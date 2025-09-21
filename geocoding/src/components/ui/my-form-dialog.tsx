// components/ui/my-form-dialog.tsx
import { useState } from "react";
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
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MyFormValues {
  number?: string;
  code?: string;
  location?: string;
  category?: string;
  type?: string;
  owner?: string;
  harvestDay?: string;
  plantDate?: string;
  name: string;
  email: string;
  polygonPaths: string;
  polygonArea: number | null;
}

export interface MyFormDialogProps {
  polygonPaths: google.maps.LatLngLiteral[][];
  polygonArea: number | null;
  open: boolean;
  setOpen: (open: boolean) => void;
}

export function MyFormDialog({ open, setOpen, polygonPaths, polygonArea }: MyFormDialogProps) {
  const [formValues, setFormValues] = useState<MyFormValues>({
    name: "",
    email: "",
    polygonPaths: JSON.stringify(polygonPaths),
    polygonArea: polygonArea,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormValues((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", formValues);
    setOpen(false); // Close the dialog after submission
    setFormValues({ name: "", email: "", polygonPaths:"", polygonArea: null }); // Reset form
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button style={{display: 'none'}} variant="outline">Open Form</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <Card>
          <CardHeader>
            <CardTitle>Create New Entry</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="name"
                    value={formValues.name}
                    onChange={handleChange}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Deed#
                  </Label>
                  <Input
                    id="deed"
                    value={formValues.number}
                    onChange={handleChange}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Code
                  </Label>
                  <Input
                    id="code"
                    value={formValues.number}
                    onChange={handleChange}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Coordinations
                  </Label>
                  <Input
                    id="coordinations"
                    value={JSON.stringify(polygonPaths[polygonPaths.length - 1])}
                    onChange={handleChange}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Size
                  </Label>
                  <Input
                    id="size"
                    value={polygonArea ? polygonArea.toFixed(2) + " ไร่" : "" }
                    onChange={handleChange}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">
                    Owner
                  </Label>
                  <Input
                    id="owner"
                    value={formValues.owner}
                    onChange={handleChange}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">
                    Harvest Day
                  </Label>
                  <Input
                    id="harvestDay"
                    value={formValues.owner}
                    onChange={handleChange}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">
                    Plant Date
                  </Label>
                  <DatePicker />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formValues.email}
                    onChange={handleChange}
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Save changes</Button>
              </DialogFooter>
            </form>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
