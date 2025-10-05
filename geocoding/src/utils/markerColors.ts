/**
 * Marker colors using database category colors
 */

/**
 * Get background color from land data (preferred method)
 * Uses category_color from database, falls back to plant type colors
 */
export function getMarkerBackgroundColor(landData?: { category_color?: string, planttypeid?: number }): string {
  // First priority: Use category color from database
  if (landData?.category_color && landData.category_color !== '#4285F4') {
    return landData.category_color;
  }
  
  // Fallback: Use plant type colors for backward compatibility
  if (landData?.planttypeid) {
    return getPlantTypeBackgroundColor(landData.planttypeid);
  }
  
  // Default blue if no data available
  return '#4285F4';
}

/**
 * Legacy function for plant type colors (fallback)
 */
export function getPlantTypeBackgroundColor(plantTypeId?: number | null): string {
  const PLANT_TYPE_BACKGROUND_COLORS: { [key: string]: string } = {
    '1': '#10B981', // Rice - Green
    '2': '#F59E0B', // Corn - Amber
    '3': '#8B5CF6', // Soybean - Purple
    '4': '#F97316', // Wheat - Orange
    '5': '#EF4444', // Tomato - Red
    '6': '#6B7280', // Potato - Gray
    '7': '#92400E', // Coffee - Brown
    '8': '#059669', // Tea - Teal Green
    '9': '#EC4899', // Sugarcane - Pink
    '10': '#F3F4F6', // Cotton - Light Gray
    '11': '#84CC16', // Palm Oil - Lime Green
  };
  
  if (!plantTypeId) return '#4285F4'; // Default blue
  return PLANT_TYPE_BACKGROUND_COLORS[plantTypeId.toString()] || '#4285F4';
}

/**
 * Interface for category data (used in legend)
 */
export interface CategoryInfo {
  id: string;
  name: string;
  color: string;
}

/**
 * Default categories based on database schema
 * Note: This should ideally be fetched from API, but kept as fallback
 */
export const DEFAULT_CATEGORIES: CategoryInfo[] = [
  { id: '1', name: 'Food Crops', color: '#4CAF50' },
  { id: '2', name: 'Cash Crops', color: '#FF9800' },
  { id: '3', name: 'Fiber Crops', color: '#9C27B0' },
  { id: '4', name: 'Oil Crops', color: '#FFC107' },
  { id: '5', name: 'Medicinal Crops', color: '#F44336' },
  { id: '6', name: 'Ornamental Crops', color: '#E91E63' },
  { id: '7', name: 'Research', color: '#607D8B' },
  { id: '8', name: 'Conservation', color: '#795548' },
];

/**
 * Default plant type data (fallback for legend)
 */
export interface PlantTypeInfo {
  id: string;
  name: string;
  color: string;
}

export const DEFAULT_PLANT_TYPES: PlantTypeInfo[] = [
  { id: '1', name: 'Rice', color: '#10B981' },
  { id: '2', name: 'Corn', color: '#F59E0B' },
  { id: '3', name: 'Soybean', color: '#8B5CF6' },
  { id: '4', name: 'Wheat', color: '#F97316' },
  { id: '5', name: 'Tomato', color: '#EF4444' },
  { id: '6', name: 'Potato', color: '#6B7280' },
  { id: '7', name: 'Coffee', color: '#92400E' },
  { id: '8', name: 'Tea', color: '#059669' },
  { id: '9', name: 'Sugarcane', color: '#EC4899' },
  { id: '10', name: 'Cotton', color: '#F3F4F6' },
  { id: '11', name: 'Palm Oil', color: '#84CC16' },
];