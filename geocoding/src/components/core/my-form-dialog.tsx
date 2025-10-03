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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  const { createItem: localCreateItem } = useGenericCrud<LandRegistry>('lands');
  // Use parent createItem if provided, otherwise use local one
  const createItem = parentCreateItem || localCreateItem;
  
  // State for plant types and categories
  const [plantTypes, setPlantTypes] = React.useState<Array<{id: number, name: string, description?: string, scientific_name?: string, harvest_cycle_days: number}>>([]);
  const [categories, setCategories] = React.useState<Array<{id: number, name: string, description?: string, color: string}>>([]);
  const [loadingOptions, setLoadingOptions] = React.useState(true);
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
        
        // Fetch plant types
        const plantTypesResponse = await axiosClient.get('/plant-types');
        if (plantTypesResponse.data.success) {
          setPlantTypes(plantTypesResponse.data.data);
        }
        
        // Fetch categories
        const categoriesResponse = await axiosClient.get('/categories');
        if (categoriesResponse.data.success) {
          setCategories(categoriesResponse.data.data);
        }
      } catch (error) {
        console.error('Error fetching options:', error);
      } finally {
        setLoadingOptions(false);
      }
    };

    fetchOptions();
  }, []);
  const form = useForm<z.infer<typeof landRegistrySchema>>({
    resolver: zodResolver(landRegistrySchema),
    defaultValues: {
      land_name: 'Test',
      land_code: 'Test',
      land_number: 'Test',
      size: size||1,
      coordinations: coordination||'test',
      location: 'Test',
      province: 'Test',
      district: 'Test',
      city: 'Test',
      owner: 'Test',
      planttypeid: 1,
      categoryid: 1,
      plant_date: currentdate,
      harvest_cycle: 'Test',
      notes: 'Test',
      created: formattedDate,
      createdby: 'Test',
      updated: formattedDate,
      updatedby: 'Test',
    },
  });
        
  // Set form values when size or coordination changes
  React.useEffect(() => {
    form.setValue('size', size || 1);
    form.setValue('coordinations', coordination || 'test');
  }, [size, coordination]);

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
        className="sm:max-w-[600px]" 
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
        <DialogHeader>
          <DialogTitle>Land Registration</DialogTitle>
          <DialogDescription>
            Register a new land parcel with its details and coordinates.
          </DialogDescription>
        </DialogHeader>
        <Card>
          <CardHeader>
            <CardTitle>New Land Registration</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-6">
                    <FormField
                      control={form.control}
                      name="land_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Land Name</FormLabel>
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
                            <Input placeholder="Land code" {...field} />
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
                            <Input placeholder="Land number" {...field} />
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
                            <Input type="number" step={0.01} placeholder="Land size" {...field} />
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
                            <Input placeholder="GEO Coordinations" {...field} />
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
                            <Input placeholder="Location" {...field} />
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
                            <Input placeholder="Province" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                  </div>
                  <div className="space-y-6">
                    <FormField
                      control={form.control}
                      name="district"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>District</FormLabel>
                          <FormControl>
                            <Input placeholder="District" {...field} />
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
                            <Input placeholder="City" {...field} />
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
                            <Input placeholder="Owner" {...field} />
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
                          <FormLabel>Plant Type</FormLabel>
                          <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={loadingOptions ? "Loading..." : "Select plant type"} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {plantTypes.map((plantType) => (
                                <SelectItem key={plantType.id} value={plantType.id.toString()}>
                                  {plantType.name}
                                  {plantType.scientific_name && ` (${plantType.scientific_name})`}
                                </SelectItem>
                              ))}
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
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={loadingOptions ? "Loading..." : "Select category"} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories.map((category) => (
                                <SelectItem key={category.id} value={category.id.toString()}>
                                  <div className="flex items-center gap-2">
                                    <div 
                                      className="w-3 h-3 rounded-full" 
                                      style={{ backgroundColor: category.color }}
                                    />
                                    {category.name}
                                  </div>
                                </SelectItem>
                              ))}
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
                            <Input placeholder="Harvest Cycle" {...field} />
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
                              className="min-h-[120px]"
                            />
                            </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                <DialogFooter>
                  <Button type="submit">Save changes</Button>
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
            <div style={{ marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>Land Registration</h2>
              <p style={{ fontSize: '14px', color: '#666' }}>Register a new land parcel with its details and coordinates.</p>
            </div>
            
            <Card>
              <CardContent style={{ padding: '24px' }}>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-6">
                        <FormField
                          control={form.control}
                          name="land_name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Land Name</FormLabel>
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
                                <Input placeholder="Land code" {...field} />
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
                                <Input placeholder="Land number" {...field} />
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
                                <Input type="number" step={0.01} placeholder="Land size" {...field} />
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
                                <Input placeholder="GEO Coordinations" {...field} />
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
                                <Input placeholder="Location" {...field} />
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
                                <Input placeholder="Province" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="space-y-6">
                        <FormField
                          control={form.control}
                          name="district"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>District</FormLabel>
                              <FormControl>
                                <Input placeholder="District" {...field} />
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
                                <Input placeholder="City" {...field} />
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
                                <Input placeholder="Owner" {...field} />
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
                              <FormLabel>Plant Type</FormLabel>
                              <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder={loadingOptions ? "Loading..." : "Select plant type"} />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {plantTypes.map((plantType) => (
                                    <SelectItem key={plantType.id} value={plantType.id.toString()}>
                                      {plantType.name}
                                      {plantType.scientific_name && ` (${plantType.scientific_name})`}
                                    </SelectItem>
                                  ))}
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
                              <FormLabel>Category</FormLabel>
                              <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder={loadingOptions ? "Loading..." : "Select category"} />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {categories.map((category) => (
                                    <SelectItem key={category.id} value={category.id.toString()}>
                                      <div className="flex items-center gap-2">
                                        <div 
                                          className="w-3 h-3 rounded-full" 
                                          style={{ backgroundColor: category.color }}
                                        />
                                        {category.name}
                                      </div>
                                    </SelectItem>
                                  ))}
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
                                <Input placeholder="Harvest Cycle" {...field} />
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
                              className="min-h-[120px]"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                      <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit">
                        Save changes
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
