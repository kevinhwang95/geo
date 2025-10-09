import DatePicker from "@/components/ui/date-picker";
import { Button } from "@/components/ui/button";
import React from "react";
import { createPortal } from "react-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  //FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { landRegistrySchema } from "@/types/landRegistry.type";
import { z } from "zod"
import { useGenericCrud } from '@/hooks/useGenericCrud';
import type LandRegistry from '@/types/landRegistry.type';
import { Textarea } from "@/components/ui/textarea";
import axiosClient from '@/api/axiosClient';
import { MapPin, User, Calendar, Hash, Building, Map, Leaf, Save, X, Globe, Crop, Clock, FileText as NotesIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getTranslatedPlantType, getTranslatedCategory } from '@/utils/translationUtils';


export interface MyFormDialogProps {
  //polygonPaths: google.maps.LatLngLiteral[][];
  polygonPaths: string;
  polygonArea: number | null;
  open: boolean;
  setOpen: (open: boolean) => void;
  createItem?: (item: Omit<LandRegistry, 'id'>) => Promise<void>;
  isFullscreen?: boolean;
};

export function MyFormDialog({ open, setOpen, polygonPaths, polygonArea, createItem: parentCreateItem, isFullscreen = false }: MyFormDialogProps) {
  const { t } = useTranslation();
  const { createItem: localCreateItem } = useGenericCrud<LandRegistry>('lands');
  // Use parent createItem if provided, otherwise use local one
  const createItem = parentCreateItem || localCreateItem;
  
  // State for plant types and categories
  const [plantTypes, setPlantTypes] = React.useState<Array<{id: number, name: string, description?: string, harvest_cycle_days?: number, requires_tree_count?: boolean, translation_key?: string}>>([]);
  const [categories, setCategories] = React.useState<Array<{id: number, name: string, description?: string, color: string, translation_key?: string}>>([]);
  const [loadingOptions, setLoadingOptions] = React.useState(true);
  const [optionsError, setOptionsError] = React.useState<string | null>(null);
  const [retryCount, setRetryCount] = React.useState(0);
  //const coordination = JSON.stringify(polygonPaths[polygonPaths.length - 1]);
  const coordination = polygonPaths;
  
  const size = polygonArea ? parseFloat(polygonArea.toFixed(2)) : 0;
 
  const currentdate = new Date().toISOString().slice(0, 10)
  const formattedDate = new Date().toISOString().slice(0, 19).replace('T', ' ');

  // Fetch plant types and categories on component mount
  React.useEffect(() => {
    const fetchOptions = async () => {
      try {
        setLoadingOptions(true);
        setOptionsError(null);
        
        console.log('Fetching plant types and categories...');
        
        // Fetch plant types and categories in parallel
        const [plantTypesResponse, categoriesResponse] = await Promise.allSettled([
          axiosClient.get('/plant-types'),
          axiosClient.get('/categories')
        ]);
        
        // Handle plant types response
        if (plantTypesResponse.status === 'fulfilled' && plantTypesResponse.value.data.success) {
          const plantTypesData = plantTypesResponse.value.data.data;
          console.log('Plant types loaded:', plantTypesData.length);
          setPlantTypes(plantTypesData);
        } else {
          console.error('Plant types fetch failed:', plantTypesResponse);
          setOptionsError('Failed to load plant types');
        }
        
        // Handle categories response
        if (categoriesResponse.status === 'fulfilled' && categoriesResponse.value.data.success) {
          const categoriesData = categoriesResponse.value.data.data;
          console.log('Categories loaded:', categoriesData.length);
          setCategories(categoriesData);
        } else {
          console.error('Categories fetch failed:', categoriesResponse);
          setOptionsError('Failed to load categories');
        }
        
        // Check if both failed
        if (plantTypesResponse.status === 'rejected' && categoriesResponse.status === 'rejected') {
          setOptionsError('Failed to load both plant types and categories');
        }
        
      } catch (error) {
        console.error('Error fetching options:', error);
        setOptionsError('Network error loading options');
        
        // Retry logic
        if (retryCount < 3) {
          console.log(`Retrying fetch options (attempt ${retryCount + 1})...`);
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, 2000 * (retryCount + 1)); // Exponential backoff
        }
      } finally {
        setLoadingOptions(false);
      }
    };

    fetchOptions();
  }, [retryCount]);
  const form = useForm<z.infer<typeof landRegistrySchema>>({
    resolver: zodResolver(landRegistrySchema),
    defaultValues: {
      land_name: '',
      land_code: '',
      land_number: '',
      size: size || 1,
      coordinations: coordination || '',
      location: '',
      province: '',
      district: '',
      city: '',
      owner: '',
      planttypeid: undefined, // Will be set when data loads
      categoryid: undefined, // Will be set when data loads
      plant_date: currentdate,
      harvest_cycle: '',
      tree_count: undefined, // Optional field
      notes: '',
      created: formattedDate,
      createdby: 'Test',
      updated: formattedDate,
      updatedby: 'Test',
    },
  });
        
  // Set form values when size or coordination changes
  React.useEffect(() => {
    form.setValue('size', size || 1);
    form.setValue('coordinations', coordination || '');
  }, [size, coordination, form]);

  // Set default values when data loads
  React.useEffect(() => {
    if (!loadingOptions && !optionsError) {
      // Set default plant type if none selected and data is available
      if (plantTypes.length > 0 && !form.getValues('planttypeid')) {
        form.setValue('planttypeid', plantTypes[0].id);
      }
      
      // Set default category if none selected and data is available
      if (categories.length > 0 && !form.getValues('categoryid')) {
        form.setValue('categoryid', categories[0].id);
      }
    }
  }, [loadingOptions, optionsError, plantTypes, categories, form]);

  function onSubmit(values: z.infer<typeof landRegistrySchema>) {
    try {
      // Ensure harvest_cycle is always a string
      const safeValues = {
        ...values,
        harvest_cycle: values.harvest_cycle ?? "",
      };

      console.log(safeValues);
      createItem(safeValues);
      setOpen(false);
      form.reset();
    } catch (e) {
      console.log(e);
    }
  }

  // const handleUpdate = (id: number) => {
  //   updateItem(id, {
  //     land_name: 'Updated Post Title',
  //   });
  // };

  // const handleDelete = (id: number) => {
  //   deleteItem(id);
  // };

  const dialogContent = (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button style={{display: 'none'}} variant="outline">Open Form</Button>
      </DialogTrigger>
      <DialogContent 
        className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto" 
        style={{ 
          zIndex: isFullscreen ? 10000 : undefined,
          position: isFullscreen ? 'fixed' : undefined,
          top: isFullscreen ? '50%' : undefined,
          left: isFullscreen ? '50%' : undefined,
          transform: isFullscreen ? 'translate(-50%, -50%)' : undefined,
          maxHeight: isFullscreen ? '90vh' : undefined,
          overflowY: isFullscreen ? 'auto' : undefined,
          pointerEvents: 'auto' // Ensure the dialog is interactive
        }}
      >
         <DialogHeader className="pb-6">
           <div className="flex items-center gap-3 mb-2">
             <div className="p-2 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg">
               <MapPin className="h-6 w-6 text-white" />
             </div>
             <div>
               <DialogTitle className="text-xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                 Land Registration
               </DialogTitle>
               <DialogDescription className="text-sm text-gray-600 mt-1">
                 Register a new land parcel with its details and coordinates
               </DialogDescription>
             </div>
           </div>
         </DialogHeader>
        <Card>
          
          <CardContent className="pt-0">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                     <FormField
                       control={form.control}
                       name="land_name"
                       render={({ field }) => (
                         <FormItem>
                          <FormLabel className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <Map className="h-4 w-4 text-green-600" />
                            {t('labels.landName')}
                          </FormLabel>
                           <FormControl>
                             <Input 
                               placeholder="Enter land name" 
                               {...field} 
                               className="h-10 border-gray-200 focus:border-green-500 focus:ring-green-500 transition-colors" 
                             />
                           </FormControl>
                           <FormMessage />
                         </FormItem>
                       )}
                     />
                    <FormField
                      control={form.control}
                      name="land_code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <Hash className="h-4 w-4 text-blue-600" />
                            {t('labels.landCode')}
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter land code" 
                              {...field} 
                              className="h-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500 transition-colors" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="land_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <Hash className="h-4 w-4 text-purple-600" />
                            Land Number
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter land number" 
                              {...field} 
                              className="h-10 border-gray-200 focus:border-purple-500 focus:ring-purple-500 transition-colors" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="size"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <Crop className="h-4 w-4 text-orange-600" />
                            Size (Rai)
                          </FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step={0.01} 
                              placeholder="Enter land size" 
                              {...field}
                              onChange={(e) => {
                                const value = e.target.value;
                                field.onChange(value === '' ? undefined : parseFloat(value));
                              }}
                              className="h-10 border-gray-200 focus:border-orange-500 focus:ring-orange-500 transition-colors" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="palm_area"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <Leaf className="h-4 w-4 text-green-600" />
                            {t('labels.palmArea')}
                          </FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step={0.01} 
                              placeholder={t('landRegistration.placeholders.palmArea')} 
                              {...field}
                              onChange={(e) => {
                                const value = e.target.value;
                                field.onChange(value === '' ? undefined : parseFloat(value));
                              }}
                              className="h-10 border-gray-200 focus:border-green-500 focus:ring-green-500 transition-colors" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="coordinations"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <Globe className="h-4 w-4 text-indigo-600" />
                            Coordinates
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Auto-generated from map" 
                              {...field} 
                              className="h-10 border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed" 
                              disabled 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <MapPin className="h-4 w-4 text-red-600" />
                            Location
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter location" 
                              {...field} 
                              className="h-10 border-gray-200 focus:border-red-500 focus:ring-red-500 transition-colors" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="province"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <Building className="h-4 w-4 text-teal-600" />
                            Province
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter province" 
                              {...field} 
                              className="h-10 border-gray-200 focus:border-teal-500 focus:ring-teal-500 transition-colors" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                  </div>
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="district"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <Building className="h-4 w-4 text-cyan-600" />
                            District
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter district" 
                              {...field} 
                              className="h-10 border-gray-200 focus:border-cyan-500 focus:ring-cyan-500 transition-colors" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <Building className="h-4 w-4 text-emerald-600" />
                            City
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter city" 
                              {...field} 
                              className="h-10 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 transition-colors" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="owner"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <User className="h-4 w-4 text-pink-600" />
                            Owner
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter owner name" 
                              {...field} 
                              className="h-10 border-gray-200 focus:border-pink-500 focus:ring-pink-500 transition-colors" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="planttypeid"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <Leaf className="h-4 w-4 text-green-600" />
                            {t('labels.plantType')}
                            {optionsError && (
                              <span className="text-red-500 text-xs ml-2">⚠️ {optionsError}</span>
                            )}
                          </FormLabel>
                          <Select 
                            onValueChange={(value) => field.onChange(parseInt(value))} 
                            value={field.value?.toString()}
                            disabled={loadingOptions || plantTypes.length === 0}
                          >
                            <FormControl>
                              <SelectTrigger className="h-10 border-gray-200 focus:border-green-500 focus:ring-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                <SelectValue 
                                  placeholder={
                                    loadingOptions 
                                      ? "Loading plant types..." 
                                      : plantTypes.length === 0 
                                        ? "No plant types available" 
                                        : "Select plant type"
                                  } 
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="z-[10001]">
                              {plantTypes.length === 0 && !loadingOptions ? (
                                <SelectItem value="no-data" disabled>
                                  <div className="flex items-center gap-2 text-gray-500">
                                    <Leaf className="h-3 w-3" />
                                    No plant types available
                                  </div>
                                </SelectItem>
                              ) : (
                                plantTypes.map((plantType) => (
                                  <SelectItem key={plantType.id} value={plantType.id.toString()}>
                                    <div className="flex items-center gap-2">
                                      <Leaf className="h-3 w-3 text-green-600" />
                                      {getTranslatedPlantType(t, plantType.name, plantType.translation_key)}
                                    </div>
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="categoryid"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <Building className="h-4 w-4 text-blue-600" />
                            {t('labels.category')}
                            {optionsError && (
                              <span className="text-red-500 text-xs ml-2">⚠️ {optionsError}</span>
                            )}
                          </FormLabel>
                          <Select 
                            onValueChange={(value) => field.onChange(parseInt(value))} 
                            value={field.value?.toString()}
                            disabled={loadingOptions || categories.length === 0}
                          >
                            <FormControl>
                              <SelectTrigger className="h-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                <SelectValue 
                                  placeholder={
                                    loadingOptions 
                                      ? "Loading categories..." 
                                      : categories.length === 0 
                                        ? "No categories available" 
                                        : "Select category"
                                  } 
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="z-[10001]">
                              {categories.length === 0 && !loadingOptions ? (
                                <SelectItem value="no-data" disabled>
                                  <div className="flex items-center gap-2 text-gray-500">
                                    <Building className="h-3 w-3" />
                                    No categories available
                                  </div>
                                </SelectItem>
                              ) : (
                                categories.map((category) => (
                                  <SelectItem key={category.id} value={category.id.toString()}>
                                    <div className="flex items-center gap-2">
                                      <div 
                                        className="w-3 h-3 rounded-full border border-gray-300" 
                                        style={{ backgroundColor: category.color }}
                                      />
                                      {getTranslatedCategory(t, category.name, category.translation_key)}
                                    </div>
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="plant_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <Calendar className="h-4 w-4 text-indigo-600" />
                            Plant Date
                          </FormLabel>
                          <FormControl>
                            <div className="border border-gray-200 rounded-md focus-within:border-indigo-500 focus-within:ring-indigo-500 transition-colors">
                              <DatePicker date={field.value ? new Date(field.value) : new Date()} setDate={field.onChange} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="harvest_cycle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <Clock className="h-4 w-4 text-yellow-600" />
                            Harvest Cycle
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter harvest cycle" 
                              {...field} 
                              className="h-10 border-gray-200 focus:border-yellow-500 focus:ring-yellow-500 transition-colors" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="tree_count"
                      render={({ field }) => {
                        const selectedPlantType = plantTypes.find(pt => pt.id === form.watch('planttypeid'));
                        const requiresTreeCount = selectedPlantType?.requires_tree_count || 
                                                selectedPlantType?.name?.toLowerCase().includes('palm oil') || 
                                                selectedPlantType?.name?.toLowerCase().includes('oil palm') ||
                                                selectedPlantType?.id === 3;
                        
                        return (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2 text-sm font-medium text-gray-700">
                              <Leaf className="h-4 w-4 text-orange-600" />
                              Tree Count
                              {requiresTreeCount && (
                                <span className="text-red-500 text-xs ml-2">*Required</span>
                              )}
                            </FormLabel>
                            <FormControl>
                              <Input 
                                type="number"
                                min="0"
                                placeholder={requiresTreeCount ? "Enter number of trees (required)" : "Enter number of trees (optional)"} 
                                {...field}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  field.onChange(value === '' ? undefined : parseInt(value));
                                }}
                                className="h-10 border-gray-200 focus:border-orange-500 focus:ring-orange-500 transition-colors" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />
                  </div>

                  
                </div>
                <FormField
                       control={form.control}
                       name="notes"
                       render={({ field }) => (
                         <FormItem>
                           <FormLabel className="flex items-center gap-2 text-sm font-medium text-gray-700">
                             <NotesIcon className="h-4 w-4 text-gray-600" />
                             Notes
                           </FormLabel>
                             <FormControl>
                             <Textarea
                               placeholder="Enter additional notes or comments"
                               {...field}
                               className="min-h-[80px] border-gray-200 focus:border-gray-500 focus:ring-gray-500 transition-colors resize-none"
                             />
                             </FormControl>
                           <FormMessage />
                         </FormItem>
                       )}
                     />
                 <DialogFooter className="pt-6 border-t border-gray-100">
                   <div className="flex gap-3 w-full">
                     {optionsError && (
                       <Button 
                         type="button" 
                         variant="outline" 
                         onClick={() => {
                           setRetryCount(0);
                           setOptionsError(null);
                         }}
                         className="px-4 py-2 border-orange-300 text-orange-700 hover:bg-orange-50 transition-colors"
                       >
                         🔄 Retry Loading Options
                       </Button>
                     )}
                     <Button 
                       type="button" 
                       variant="outline" 
                       onClick={() => setOpen(false)}
                       className="flex-1 h-11 border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                     >
                       <X className="h-4 w-4 mr-2" />
                       {t('buttons.cancel')}
                     </Button>
                     <Button 
                       type="submit"
                       className="flex-1 h-11 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-medium shadow-md transition-all duration-200"
                     >
                       <Save className="h-4 w-4 mr-2" />
                       {t('buttons.registerLand')}
                     </Button>
                   </div>
                 </DialogFooter>
              </form>
            </Form>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );

  // Custom fullscreen modal
  const renderFullscreenModal = () => {
    if (!open) return null;
    
    return createPortal(
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 10000,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}
        onClick={(e) => {
          // Close dialog when clicking on backdrop
          if (e.target === e.currentTarget) {
            setOpen(false);
          }
        }}
      >
        <div 
          style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}
          onClick={(e) => e.stopPropagation()} // Prevent backdrop click when clicking inside dialog
        >
           <div style={{ padding: '24px' }}>
             <div style={{ marginBottom: '24px' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                 <div style={{ 
                   padding: '8px', 
                   background: 'linear-gradient(135deg, #10b981, #3b82f6)', 
                   borderRadius: '8px' 
                 }}>
                   <MapPin style={{ width: '24px', height: '24px', color: 'white' }} />
                 </div>
                 <div>
                   <h2 style={{ 
                     fontSize: '20px', 
                     fontWeight: '700', 
                     background: 'linear-gradient(135deg, #10b981, #3b82f6)', 
                     WebkitBackgroundClip: 'text', 
                     WebkitTextFillColor: 'transparent',
                     margin: 0
                   }}>
                     Land Registration
                   </h2>
                   <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0 0 0' }}>
                     Register a new land parcel with its details and coordinates
                   </p>
                 </div>
               </div>
             </div>
            
            <Card>
              <CardContent style={{ padding: '24px' }}>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <FormField
                          control={form.control}
                          name="land_name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('labels.landName')}</FormLabel>
                              <FormControl>
                                <Input placeholder="Land name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="land_code"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Land code</FormLabel>
                              <FormControl>
                                <Input placeholder="Land code" {...field} className="h-9" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="land_number"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Land number</FormLabel>
                              <FormControl>
                                <Input placeholder="Land number" {...field} className="h-9" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="size"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Size</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step={0.01} 
                                  placeholder="Land size" 
                                  {...field}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    field.onChange(value === '' ? undefined : parseFloat(value));
                                  }}
                                  className="h-9" 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="palm_area"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Palm Area</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step={0.01} 
                                  placeholder="Palm area" 
                                  {...field}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    field.onChange(value === '' ? undefined : parseFloat(value));
                                  }}
                                  className="h-9" 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="coordinations"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Coordinations</FormLabel>
                              <FormControl>
                                <Input placeholder="GEO Coordinations" {...field} className="h-9" disabled />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="location"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Location</FormLabel>
                              <FormControl>
                                <Input placeholder="Location" {...field} className="h-9" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="province"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Province</FormLabel>
                              <FormControl>
                                <Input placeholder="Province" {...field} className="h-9" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="space-y-3">
                        <FormField
                          control={form.control}
                          name="district"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>District</FormLabel>
                              <FormControl>
                                <Input placeholder="District" {...field} className="h-9" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>City</FormLabel>
                              <FormControl>
                                <Input placeholder="City" {...field} className="h-9" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="owner"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Owner</FormLabel>
                              <FormControl>
                                <Input placeholder="Owner" {...field} className="h-9" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="planttypeid"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('labels.plantType')} {optionsError && <span className="text-red-500 text-xs">⚠️ {optionsError}</span>}</FormLabel>
                              <Select 
                                onValueChange={(value) => field.onChange(parseInt(value))} 
                                value={field.value?.toString()}
                                disabled={loadingOptions || plantTypes.length === 0}
                              >
                                <FormControl>
                                  <SelectTrigger className="h-9 disabled:opacity-50 disabled:cursor-not-allowed">
                                    <SelectValue 
                                      placeholder={
                                        loadingOptions 
                                          ? "Loading plant types..." 
                                          : plantTypes.length === 0 
                                            ? "No plant types available" 
                                            : "Select plant type"
                                      } 
                                    />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="z-[10001]">
                                  {plantTypes.length === 0 && !loadingOptions ? (
                                    <SelectItem value="no-data" disabled>
                                      No plant types available
                                    </SelectItem>
                                  ) : (
                                    plantTypes.map((plantType) => (
                                      <SelectItem key={plantType.id} value={plantType.id.toString()}>
                                        {plantType.name}
                                      </SelectItem>
                                    ))
                                  )}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="categoryid"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('labels.category')} {optionsError && <span className="text-red-500 text-xs">⚠️ {optionsError}</span>}</FormLabel>
                              <Select 
                                onValueChange={(value) => field.onChange(parseInt(value))} 
                                value={field.value?.toString()}
                                disabled={loadingOptions || categories.length === 0}
                              >
                                <FormControl>
                                  <SelectTrigger className="h-9 disabled:opacity-50 disabled:cursor-not-allowed">
                                    <SelectValue 
                                      placeholder={
                                        loadingOptions 
                                          ? "Loading categories..." 
                                          : categories.length === 0 
                                            ? "No categories available" 
                                            : "Select category"
                                      } 
                                    />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="z-[10001]">
                                  {categories.length === 0 && !loadingOptions ? (
                                    <SelectItem value="no-data" disabled>
                                      No categories available
                                    </SelectItem>
                                  ) : (
                                    categories.map((category) => (
                                      <SelectItem key={category.id} value={category.id.toString()}>
                                        <div className="flex items-center gap-2">
                                          <div 
                                            className="w-3 h-3 rounded-full" 
                                            style={{ backgroundColor: category.color }}
                                          />
                                          {getTranslatedCategory(t, category.name, category.translation_key)}
                                        </div>
                                      </SelectItem>
                                    ))
                                  )}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="plant_date"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Plant Date</FormLabel>
                              <FormControl>
                                <DatePicker date={field.value ? new Date(field.value) : new Date()} setDate={field.onChange} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="harvest_cycle"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Harvest Cycle</FormLabel>
                              <FormControl>
                                <Input placeholder="Harvest Cycle" {...field} className="h-9" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Notes"
                              {...field}
                              className="min-h-[80px]"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <div style={{ 
                       display: 'flex', 
                       justifyContent: 'flex-end', 
                       gap: '12px', 
                       marginTop: '32px',
                       paddingTop: '20px',
                       borderTop: '1px solid #e5e7eb'
                     }}>
                       <Button 
                         type="button" 
                         variant="outline" 
                         onClick={() => setOpen(false)}
                         className="px-6 py-3 border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                       >
                         <X className="h-4 w-4 mr-2" />
                         {t('buttons.cancel')}
                       </Button>
                       <Button 
                         type="submit"
                         className="px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-medium shadow-md transition-all duration-200"
                       >
                         <Save className="h-4 w-4 mr-2" />
                         {t('buttons.registerLand')}
                       </Button>
                     </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  // Use custom fullscreen modal when in fullscreen mode
  if (isFullscreen) {
    return renderFullscreenModal();
  }

  return dialogContent;
}
