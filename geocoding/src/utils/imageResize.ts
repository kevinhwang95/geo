/**
 * Image resizing utility functions
 * Uses HTML5 Canvas to resize images client-side before upload
 */

export interface ImageResizeOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 to 1.0
  format?: 'jpeg' | 'png' | 'webp';
  maintainAspectRatio?: boolean;
}

const DEFAULT_OPTIONS: Required<ImageResizeOptions> = {
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 0.8,
  format: 'jpeg',
  maintainAspectRatio: true,
};

/**
 * Creates a canvas element with the given dimensions
 */
function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

/**
 * Calculates new dimensions maintaining aspect ratio
 */
function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number,
  maintainAspectRatio: boolean
): { width: number; height: number } {
  if (originalWidth <= maxWidth && originalHeight <= maxHeight) {
    return { width: originalWidth, height: originalHeight };
  }

  if (!maintainAspectRatio) {
    return { width: maxWidth, height: maxHeight };
  }

  const aspectRatio = originalWidth / originalHeight;

  if (maxWidth / maxHeight > aspectRatio) {
    return {
      width: Math.round(maxHeight * aspectRatio),
      height: maxHeight,
    };
  } else {
    return {
      width: maxWidth,
      height: Math.round(maxWidth / aspectRatio),
    };
  }
}

/**
 * Resizes an image file using HTML5 Canvas
 */
export async function resizeImage(
  file: File,
  options: Partial<ImageResizeOptions> = {}
): Promise<File> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const img = new Image();
      
      img.onload = () => {
        try {
          // Calculate new dimensions
          const { width, height } = calculateDimensions(
            img.naturalWidth,
            img.naturalHeight,
            opts.maxWidth,
            opts.maxHeight,
            opts.maintainAspectRatio
          );

          // Create canvas and draw resized image
          const canvas = createCanvas(width, height);
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          // Set high-quality image scaling
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // Draw the resized image
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to blob with specified format and quality
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to create blob from canvas'));
                return;
              }

              // Create a new File object with the resized image
              const resizedFile = new File(
                [blob], 
                file.name, 
                { 
                  type: opts.format === 'jpeg' ? 'image/jpeg' : 
                       opts.format === 'png' ? 'image/png' : 
                       'image/webp',
                  lastModified: Date.now()
                }
              );

              resolve(resizedFile);
            },
            `image/${opts.format}`,
            opts.quality
          );
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = event.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Resizes an array of image files
 */
export async function resizeImages(
  files: File[],
  options: Partial<ImageResizeOptions> = {}
): Promise<File[]> {
  const resizePromises = files.map(file => resizeImage(file, options));
  return Promise.all(resizePromises);
}

/**
 * Gets file size reduction percentage
 */
export function getFileSizeReduction(originalSize: number, newSize: number): number {
  if (originalSize === 0) return 0;
  const reduction = ((originalSize - newSize) / originalSize) * 100;
  return Math.round(reduction);
}

/**
 * Formats file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Presets for different use cases
 */
export const RESIZE_PRESETS = {
  thumbnail: { maxWidth: 300, maxHeight: 300, quality: 0.7, format: 'jpeg' as const },
  preview: { maxWidth: 800, maxHeight: 600, quality: 0.8, format: 'jpeg' as const },
  full: { maxWidth: 1920, maxHeight: 1080, quality: 0.9, format: 'jpeg' as const },
  webOptimized: { maxWidth: 1200, maxHeight: 800, quality: 0.8, format: 'webp' as const },
} as const;
