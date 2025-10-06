import { z } from "zod"

export default interface LandRegistry {
  id?: any | null,
  land_name: string,
  land_code: string,
  land_number: string,
  size: number,
  location: string,
  province: string,
  district: string,
  city: string,
  owner: string,
  coordinations: string,
  planttypeid: number,
  categoryid: number,
  category_name?: string,
  category_color?: string,
  plant_date: Date | string,
  harvest_cycle?: string,
  tree_count?: number,
  notes?: string,
  created: Date | string,
  createdby: string,
  updated?: Date | string,
  updatedby?: string
}

export const landRegistrySchema = z.object({
  id: z.number().optional(),
  land_name: z.string().min(2, {
    message: "Land name must be at least 2 characters.",
  }),
  land_code: z.string().min(2, {
    message: "Land code must be at least 2 characters.",
  }),
  land_number: z.string().min(2, {
    message: "Land number must be at least 2 characters.",
  }),
  size: z.number().min(0, {
    message: "Size must be at least 0.",
  }),
  location: z.string().min(2, {
    message: "Location must be at least 2 characters.",
  }),
  province: z.string().min(2, {
    message: "Province must be at least 2 characters.",
  }),
  district: z.string().min(2, {
    message: "District must be at least 2 characters.",
  }),
  city: z.string().min(2, {
    message: "City must be at least 2 characters.",
  }),
  owner: z.string().min(2, {
    message: "Owner must be at least 2 characters.",
  }),
  coordinations: z.string().min(2, {
    message: "Coordinations must be at least 2 characters.",
  }),
  planttypeid: z.int().min(0, {
    message: "Plant type ID must be at least 0.",
  }),
  categoryid: z.int().min(0, {
    message: "Category ID must be at least 0.",
  }),
  plant_date: z.date().or(z.string()),
  harvest_cycle: z.string().optional(),
  tree_count: z.number().int().min(0, {
    message: "Tree count must be a positive integer.",
  }).optional(),
  notes: z.string().min(2, {
    message: "Notes must be at least 2 characters.",
  }).optional(),
  created: z.date().or(z.string()),
  createdby: z.string().min(2, {
    message: "Createdby must be at least 2 characters.",
  }),
  updated: z.date().or(z.string()).optional(),
  updatedby: z.string().min(2, {
    message: "Updatedby must be at least 2 characters.",
  }).optional(),
}).refine((data) => {
  // Conditional validation: tree_count is required for certain plant types
  // This will be enhanced with dynamic plant type data from the backend
  // For now, we'll check for Palm Oil by ID (3) or by name if available
  const palmOilIds = [3]; // Palm Oil IDs that require tree count
  // const palmOilNames = ['palm oil', 'oil palm']; // Plant type names that require tree count
  
  // Check if this plant type requires tree count
  if (palmOilIds.includes(data.planttypeid) && (data.tree_count === undefined || data.tree_count === null)) {
    return false;
  }
  
  return true;
}, {
  message: "Tree count is required for this plant type.",
  path: ["tree_count"],
});

export type GeoJsonPolygon = {
  id: string;
  type: string;
  geometry: {
    type: string;
    coordinates: number[][][];
  };
  properties: {
    mode: string;
  };
};