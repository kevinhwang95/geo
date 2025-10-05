import { useState, useEffect, useCallback } from 'react';

interface MapHeightConfig {
  minHeight: number;
  maxHeight: number;
  headerHeight: number;
  toolbarHeight: number;
  padding: number;
}

interface DynamicMapHeightResult {
  mapHeight: string;
  containerHeight: string;
  isOptimal: boolean;
  screenInfo: {
    viewportHeight: number;
    viewportWidth: number;
    availableHeight: number;
    calculatedHeight: number;
  };
}

const DEFAULT_CONFIG: MapHeightConfig = {
  minHeight: 400,      // Minimum map height in pixels
  maxHeight: 1200,     // Maximum map height in pixels
  headerHeight: 60,    // Estimated header/navigation height
  toolbarHeight: 80,   // Estimated toolbar height
  padding: 40,         // Additional padding/margins
};

export const useDynamicMapHeight = (
  isFullscreen: boolean = false,
  config: Partial<MapHeightConfig> = {}
): DynamicMapHeightResult => {
  const [dimensions, setDimensions] = useState({
    viewportHeight: window.innerHeight,
    viewportWidth: window.innerWidth,
  });

  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  const calculateMapHeight = useCallback((): DynamicMapHeightResult => {
    const { viewportHeight, viewportWidth } = dimensions;
    const { minHeight, maxHeight, headerHeight, toolbarHeight, padding } = mergedConfig;

    if (isFullscreen) {
      // Fullscreen mode: use full viewport height
      return {
        mapHeight: '100vh',
        containerHeight: '100vh',
        isOptimal: true,
        screenInfo: {
          viewportHeight,
          viewportWidth,
          availableHeight: viewportHeight,
          calculatedHeight: viewportHeight,
        },
      };
    }

    // Calculate available height for the map
    const reservedSpace = headerHeight + toolbarHeight + padding;
    const availableHeight = viewportHeight - reservedSpace;

    // Calculate optimal height based on screen size
    let calculatedHeight: number;

    if (viewportWidth < 768) {
      // Mobile: Use most of available height with small margins
      calculatedHeight = Math.max(minHeight, availableHeight * 0.85);
    } else if (viewportWidth < 1024) {
      // Tablet: Use 80% of available height
      calculatedHeight = Math.max(minHeight, availableHeight * 0.8);
    } else if (viewportWidth < 1440) {
      // Desktop: Use 75% of available height
      calculatedHeight = Math.max(minHeight, availableHeight * 0.75);
    } else {
      // Large desktop: Use 70% of available height
      calculatedHeight = Math.max(minHeight, availableHeight * 0.7);
    }

    // Apply max height constraint
    calculatedHeight = Math.min(calculatedHeight, maxHeight);

    // Check if height is optimal (not constrained by min/max)
    const isOptimal = calculatedHeight > minHeight && calculatedHeight < maxHeight;

    return {
      mapHeight: `${calculatedHeight}px`,
      containerHeight: `${calculatedHeight + reservedSpace}px`,
      isOptimal,
      screenInfo: {
        viewportHeight,
        viewportWidth,
        availableHeight,
        calculatedHeight,
      },
    };
  }, [dimensions, isFullscreen, mergedConfig]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        viewportHeight: window.innerHeight,
        viewportWidth: window.innerWidth,
      });
    };

    // Add resize listener
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Handle orientation change on mobile
  useEffect(() => {
    const handleOrientationChange = () => {
      // Small delay to allow viewport to update
      setTimeout(() => {
        setDimensions({
          viewportHeight: window.innerHeight,
          viewportWidth: window.innerWidth,
        });
      }, 100);
    };

    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  return calculateMapHeight();
};

// Utility function to get responsive breakpoints
export const getScreenBreakpoint = (width: number): string => {
  if (width < 480) return 'xs';      // Extra small phones
  if (width < 768) return 'sm';      // Small phones
  if (width < 1024) return 'md';     // Tablets
  if (width < 1440) return 'lg';     // Desktop
  if (width < 1920) return 'xl';     // Large desktop
  return '2xl';                      // Extra large screens
};

// Utility function to get recommended map height for different screen sizes
export const getRecommendedMapHeight = (screenType: string): number => {
  const recommendations = {
    xs: 300,   // Small phones
    sm: 400,   // Large phones
    md: 500,   // Tablets
    lg: 600,   // Desktop
    xl: 700,   // Large desktop
    '2xl': 800, // Extra large screens
  };

  return recommendations[screenType as keyof typeof recommendations] || 600;
};
