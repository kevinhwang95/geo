import DatePicker from "@/components/ui/date-picker";
import { Button } from "@/components/ui/button";
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { DialogTitle } from "@radix-ui/react-dialog";
import { useGenericCrud } from '@/hooks/useGenericCrud';
import type LandRegistry from '@/types/landRegistry.type';
import { Textarea } from "@/components/ui/textarea";


export interface MyFormDialogProps {
  //polygonPaths: google.maps.LatLngLiteral[][];
  polygonPaths: string;
  polygonArea: number | null;
  open: boolean;
  setOpen: (open: boolean) => void;
};

export function MyFormDialog({ open, setOpen, polygonPaths, polygonArea }: MyFormDialogProps) {

  const { createItem } = useGenericCrud<LandRegistry>('api/landregistry');
  //const coordination = JSON.stringify(polygonPaths[polygonPaths.length - 1]);
  const coordination = polygonPaths;
  
  const size = polygonArea ? parseFloat(polygonArea.toFixed(2)) : 0;
 
  const currentdate = new Date().toISOString().slice(0, 10)
  const formattedDate = new Date().toISOString().slice(0, 19).replace('T', ' ');
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button style={{display: 'none'}} variant="outline">Open Form</Button>
      </DialogTrigger>
      <DialogTitle className="text-center mt-4 text-2xl font-bold">Land Registration</DialogTitle>
      <DialogContent className="sm:max-w-[600px]">
        <Card>
          <CardHeader>
            <CardTitle> <p>New Land Registration</p></CardTitle>
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
                          <FormLabel>Plant Type ID</FormLabel>
                          <FormControl>
                            <Input placeholder="Plant Type" {...field} />
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
                          <FormLabel>Category</FormLabel>
                          <FormControl>
                            <Input placeholder="Category" {...field} />
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
}
