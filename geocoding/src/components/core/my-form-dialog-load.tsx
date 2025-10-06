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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export interface MyFormDialogProps {
  //polygonPaths: google.maps.LatLngLiteral[][];
  land: LandRegistry;
  open: boolean;
  setOpen: (open: boolean) => void;
  onUpdateSuccess?: () => void;
}

export function MyFormDialogLoad({ open, setOpen, land, onUpdateSuccess = () => {} }: MyFormDialogProps) {

  const { createItem, updateItem } = useGenericCrud<LandRegistry>('lands');
  const coordination = land.coordinations;

  // State for plant types and categories
  const [plantTypes, setPlantTypes] = React.useState<Array<{id: number, name: string, description?: string, harvest_cycle_days?: number, requires_tree_count?: boolean}>>([]);
  const [loadingOptions, setLoadingOptions] = React.useState(true);

  // Fetch plant types data
  React.useEffect(() => {
    const fetchPlantTypes = async () => {
      try {
        const response = await axiosClient.get('/plant-types');
        if (response.data && Array.isArray(response.data)) {
          setPlantTypes(response.data);
        }
      } catch (error) {
        console.error('Error fetching plant types:', error);
      } finally {
        setLoadingOptions(false);
      }
    };

    fetchPlantTypes();
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
      coordinations: coordination || '',
      location: land.location || '',
      province: land.province || '',
      district: land.district || '',
      city: land.city || '',
      owner: land.owner || '',
      planttypeid: land.planttypeid || 1,
      categoryid: land.categoryid || 1,
      plant_date: land.plant_date || currentdate,
      harvest_cycle: land.harvest_cycle || '',
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
        coordinations: land.coordinations || '',
        location: land.location || '',
        province: land.province || '',
        district: land.district || '',
        city: land.city || '',
        owner: land.owner || '',
        planttypeid: land.planttypeid || 1,
        categoryid: land.categoryid || 1,
        plant_date: land.plant_date || currentdate,
        harvest_cycle: land.harvest_cycle || '',
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
      // Ensure harvest_cycle is always a string
      const safeValues = {
        ...values,
        harvest_cycle: values.harvest_cycle ?? "",
      };

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
                            Land Name
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
                            Land Code
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
                            Plant Type
                          </FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              placeholder="Plant Type ID" 
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
                      name="categoryid"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <Hash className="h-4 w-4 text-violet-600" />
                            Category
                          </FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              placeholder="Category ID" 
                              {...field} 
                              className="h-10 border-gray-200 focus:border-violet-500 focus:ring-violet-500 transition-colors" 
                            />
                          </FormControl>
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
                    <FormField
                      control={form.control}
                      name="harvest_cycle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <Clock className="h-4 w-4 text-amber-600" />
                            Harvest Cycle
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter harvest cycle" 
                              {...field} 
                              className="h-10 border-gray-200 focus:border-amber-500 focus:ring-amber-500 transition-colors" 
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
                                <span className="text-red-500 text-xs">*</span>
                              )}
                            </FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="0"
                                step="1"
                                placeholder="Enter number of trees"
                                {...field}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  field.onChange(value === '' ? undefined : parseInt(value));
                                }}
                                className="h-10 border-gray-200 focus:border-orange-500 focus:ring-orange-500 transition-colors"
                              />
                            </FormControl>
                            {requiresTreeCount && (
                              <p className="text-xs text-orange-600 mt-1">
                                Tree count is required for {selectedPlantType?.name || 'this plant type'}
                              </p>
                            )}
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
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      className="flex-1 h-11 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-medium shadow-md transition-all duration-200"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {land.id ? 'Update Land' : 'Create Land'}
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
