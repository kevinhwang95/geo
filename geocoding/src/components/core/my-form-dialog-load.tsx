import React from "react";
import DatePicker from "@/components/ui/date-picker";
import { Button } from "@/components/ui/button";
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
import { MapPin, User, Calendar, Hash, Building, Map, Leaf, Save, X, Globe, Crop, Clock, FileText as NotesIcon } from "lucide-react";
import axiosClient from '@/api/axiosClient';
import { useTranslation } from 'react-i18next';
import { getTranslatedPlantType, getTranslatedCategory } from '@/utils/translationUtils';

export interface MyFormDialogProps {
  //polygonPaths: google.maps.LatLngLiteral[][];
  land: LandRegistry;
  open: boolean;
  setOpen: (open: boolean) => void;
  onUpdateSuccess?: () => void;
}

export function MyFormDialogLoad({ open, setOpen, land, onUpdateSuccess = () => {} }: MyFormDialogProps) {
  const { t } = useTranslation();
  const { createItem, updateItem } = useGenericCrud<LandRegistry>('lands');
  const coordination = land.coordinations;

  // State for plant types and categories
  const [plantTypes, setPlantTypes] = React.useState<Array<{id: number, name: string, description?: string, harvest_cycle_days?: number, requires_tree_count?: boolean, translation_key?: string}>>([]);
  const [categories, setCategories] = React.useState<Array<{id: number, name: string, description?: string, color: string, translation_key?: string}>>([]);
  const [loadingOptions, setLoadingOptions] = React.useState(true);
  const [optionsError, setOptionsError] = React.useState<string | null>(null);

  // Fetch plant types and categories data
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
      } finally {
        setLoadingOptions(false);
      }
    };

    fetchOptions();
  }, []);
 
  const currentdate = new Date().toISOString().slice(0, 10)
  const formattedDate = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const form = useForm<z.infer<typeof landRegistrySchema>>({
    resolver: zodResolver(landRegistrySchema),
    defaultValues: {
      id: land.id,
      land_name: land.land_name || '',
      land_code: land.land_code || '',
      land_number: land.land_number || '',
      size: land.size || 0,
      palm_area: land.palm_area || undefined,
      coordinations: coordination || '',
      location: land.location || '',
      province: land.province || '',
      district: land.district || '',
      city: land.city || '',
      owner: land.owner || '',
      planttypeid: land.planttypeid || 1,
      categoryid: land.categoryid || 1,
      plant_date: land.plant_date || currentdate,
      previous_harvest_date: land.previous_harvest_date,
      tree_count: land.tree_count,
      notes: land.notes || '',
      created: land.created || formattedDate,
      createdby: land.createdby || '',
      updated: land.updated || formattedDate,
      updatedby: land.updatedby || '',
    },
  });

  // Reset form values when land prop changes
  React.useEffect(() => {
    if (land && land.id) {
      console.log('Resetting form with land data:', land);
      form.reset({
        id: land.id,
        land_name: land.land_name || '',
        land_code: land.land_code || '',
        land_number: land.land_number || '',
        size: land.size || 0,
        palm_area: land.palm_area || undefined,
        coordinations: land.coordinations || '',
        location: land.location || '',
        province: land.province || '',
        district: land.district || '',
        city: land.city || '',
        owner: land.owner || '',
        planttypeid: land.planttypeid || 1,
        categoryid: land.categoryid || 1,
        plant_date: land.plant_date || currentdate,
        previous_harvest_date: land.previous_harvest_date,
        tree_count: land.tree_count,
        notes: land.notes || '',
        created: land.created || formattedDate,
        createdby: land.createdby || '',
        updated: land.updated || formattedDate,
        updatedby: land.updatedby || '',
      });
    }
  }, [land, form, currentdate, formattedDate]);
        
  // // Set form values when size or coordination changes
  // React.useEffect(() => {
  //   form.setValue('size', size || 1);
  //   form.setValue('coordinations', coordination || 'test');
  // }, [size, coordination]);

  async function onSubmit(values: z.infer<typeof landRegistrySchema>) {
    try {
      // Remove harvest_cycle from submission since it's now derived from plant type
      const { harvest_cycle, ...safeValues } = values;

      console.log(safeValues);
      
      // If land has an ID, it's an update operation
      if (land.id) {
        await updateItem(land.id, safeValues);
        // Call the success callback to refresh the parent data
        onUpdateSuccess();
      } else {
        await createItem(safeValues);
      }
      
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button style={{display: 'none'}} variant="outline">Open Form</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
        <DialogHeader className="pb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg">
              <MapPin className="h-6 w-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                {land.id ? 'Edit Land' : 'Land Registration'}
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-600 mt-1">
                {land.id ? 'Update land details and information' : 'Register a new land parcel with its details and coordinates'}
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
                      name="id"
                      render={({ field }) => (
                        <FormItem className="hidden">
                          <FormControl>
                            <Input {...field} disabled />
                          </FormControl>
                        </FormItem>
                      )}
                    />
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
                            <Building className="h-4 w-4 text-emerald-600" />
                            Province
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter province" 
                              {...field} 
                              className="h-10 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 transition-colors" 
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
                            <Building className="h-4 w-4 text-teal-600" />
                            City
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter city" 
                              {...field} 
                              className="h-10 border-gray-200 focus:border-teal-500 focus:ring-teal-500 transition-colors" 
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
                            <User className="h-4 w-4 text-slate-600" />
                            Owner
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter owner name" 
                              {...field} 
                              className="h-10 border-gray-200 focus:border-slate-500 focus:ring-slate-500 transition-colors" 
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
                            <Calendar className="h-4 w-4 text-rose-600" />
                            Plant Date
                          </FormLabel>
                          <FormControl>
                            <DatePicker date={field.value ? new Date(field.value) : new Date()} setDate={field.onChange} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {/* Harvest Cycle Display - derived from plant type */}
                    <div className="space-y-2">
                      <FormLabel className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <Clock className="h-4 w-4 text-amber-600" />
                        Harvest Cycle
                      </FormLabel>
                      <div className="h-10 px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-700 flex items-center">
                        {(() => {
                          const selectedPlantType = plantTypes.find(pt => pt.id === form.watch('planttypeid'));
                          return selectedPlantType?.harvest_cycle_days 
                            ? `${selectedPlantType.harvest_cycle_days} days`
                            : 'Select a plant type to see harvest cycle';
                        })()}
                      </div>
                      <p className="text-xs text-gray-500">
                        Harvest cycle is determined by the selected plant type
                      </p>
                    </div>
                    <FormField
                      control={form.control}
                      name="previous_harvest_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <Calendar className="h-4 w-4 text-orange-600" />
                            Previous Harvest Date
                          </FormLabel>
                          <FormControl>
                            <DatePicker 
                              date={field.value ? new Date(field.value) : undefined} 
                              setDate={field.onChange} 
                              placeholder="Select previous harvest date (optional)"
                            />
                          </FormControl>
                          <FormMessage />
                          <p className="text-xs text-gray-500">
                            Date of the last harvest - used to calculate next harvest date
                          </p>
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
                                step="1"
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
                          placeholder="Enter any additional notes or comments"
                          {...field}
                          className="min-h-[100px] border-gray-200 focus:border-gray-400 focus:ring-gray-400 transition-colors resize-none"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter className="pt-6 border-t border-gray-100">
                  <div className="flex gap-3 w-full">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => setOpen(false)}
                      className="px-4 py-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <X className="h-4 w-4 mr-2" />
                      {t('buttons.cancel')}
                    </Button>
                    <Button 
                      type="submit"
                      className="flex-1 h-11 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-medium shadow-md transition-all duration-200"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {land.id ? t('buttons.updateLand') : t('buttons.registerLand')}
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
}
