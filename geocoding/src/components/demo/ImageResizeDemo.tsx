import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Upload, 
  Download, 
  Image as ImageIcon, 
  // FileSize, // This icon doesn't exist in lucide-react 
  Zap, 
  CheckCircle, 
  Loader2,
  X
} from 'lucide-react';
import { 
  resizeImages, 
  // resizeImage, // Unused for now 
  formatFileSize, 
  getFileSizeReduction, 
  RESIZE_PRESETS 
} from '@/utils/imageResize';
import { toast } from 'sonner';

export interface ImageResizeDemoProps {}

interface ResizeResult {
  original: File;
  resized: File;
  reduction: number;
  preset: string;
}

export function ImageResizeDemo({}: ImageResizeDemoProps) {
  const [originalFiles, setOriginalFiles] = useState<File[]>([]);
  const [resizeResults, setResizeResults] = useState<ResizeResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const imageFiles = Array.from(files).filter(file => 
      file.type.startsWith('image/')
    );

    if (imageFiles.length === 0) {
      toast.error('No image files selected');
      return;
    }

    setOriginalFiles(imageFiles);
    setResizeResults([]);
    
    toast.info(`Loaded ${imageFiles.length} image${imageFiles.length > 1 ? 's' : ''}`);
  };

  const processWithPreset = async (preset: keyof typeof RESIZE_PRESETS) => {
    if (originalFiles.length === 0) return;

    setIsProcessing(true);
    try {
      const presetConfig = RESIZE_PRESETS[preset];
      toast.info(`Processing images with ${preset} preset...`);

      const resizedFiles = await resizeImages(originalFiles, presetConfig);
      
      const results: ResizeResult[] = originalFiles.map((original, index) => ({
        original,
        resized: resizedFiles[index],
        reduction: getFileSizeReduction(original.size, resizedFiles[index].size),
        preset
      }));

      setResizeResults(results);
      
      const totalOriginalSize = originalFiles.reduce((sum, file) => sum + file.size, 0);
      const totalNewSize = resizedFiles.reduce((sum, file) => sum + file.size, 0);
      const totalReduction = getFileSizeReduction(totalOriginalSize, totalNewSize);

      toast.success(`Processing complete! ${totalReduction}% total size reduction`, {
        description: `${formatFileSize(totalOriginalSize)} → ${formatFileSize(totalNewSize)}`,
      });

    } catch (error) {
      console.error('Error processing images:', error);
      toast.error('Failed to process images');
    } finally {
      setIsProcessing(false);
    }
  };

  const clearResults = () => {
    setOriginalFiles([]);
    setResizeResults([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const downloadResized = (result: ResizeResult) => {
    const url = URL.createObjectURL(result.resized);
    const link = document.createElement('a');
    link.href = url;
    link.download = `resized_${result.original.name}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Image Resize Demo</h1>
        <p className="text-muted-foreground">
          Upload images to see client-side resizing in action
        </p>
      </div>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>
            <Upload className="inline w-5 h-5 mr-2" />
            Upload Images
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center">
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="flex items-center gap-2"
            >
              <ImageIcon className="w-4 h-4" />
              Select Images
            </Button>
            
            {originalFiles.length > 0 && (
              <Button
                variant="outline"
                onClick={clearResults}
                disabled={isProcessing}
                className="flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Clear
              </Button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />

          {/* File List */}
          {originalFiles.length > 0 && (
            <div className="mt-4 space-y-2">
              <h4 className="font-medium">Original Images:</h4>
              {originalFiles.map((file, index) => (
                <div key={index} className="flex items-center gap-4 p-2 bg-gray-50 rounded">
                  <ImageIcon className="w-4 h-4" />
                  <span className="flex-1">{file.name}</span>
                  <Badge variant="outline">{formatFileSize(file.size)}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resize Presets */}
      <Card>
        <CardHeader>
          <CardTitle>
            <Zap className="inline w-5 h-5 mr-2" />
            Resize Presets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Button
              onClick={() => processWithPreset('thumbnail')}
              disabled={originalFiles.length === 0 || isProcessing}
              variant="outline"
              className="flex flex-col items-center gap-2 h-auto py-3"
            >
              <div className="text-center">
                <div className="font-medium">Thumbnail</div>
                <div className="text-xs text-muted-foreground">300×300</div>
                <div className="text-xs text-muted-foreground">Quality: 70%</div>
              </div>
            </Button>

            <Button
              onClick={() => processWithPreset('preview')}
              disabled={originalFiles.length === 0 || isProcessing}
              variant="outline"
              className="flex flex-col items-center gap-2 h-auto py-3"
            >
              <div className="text-center">
                <div className="font-medium">Preview</div>
                <div className="text-xs text-muted-foreground">800×600</div>
                <div className="text-xs text-muted-foreground">Quality: 80%</div>
              </div>
            </Button>

            <Button
              onClick={() => processWithPreset('full')}
              disabled={originalFiles.length === 0 || isProcessing}
              variant="outline"
              className="flex flex-col items-center gap-2 h-auto py-3"
            >
              <div className="text-center">
                <div className="font-medium">Full HD</div>
                <div className="text-xs text-muted-foreground">1920×1080</div>
                <div className="text-xs text-muted-foreground">Quality: 90%</div>
              </div>
            </Button>

            <Button
              onClick={() => processWithPreset('webOptimized')}
              disabled={originalFiles.length === 0 || isProcessing}
              variant="outline"
              className="flex flex-col items-center gap-2 h-auto py-3"
            >
              <div className="text-center">
                <div className="font-medium">Web Optimized</div>
                <div className="text-xs text-muted-foreground">1200×800</div>
                <div className="text-xs text-muted-foreground">WebP Format</div>
              </div>
            </Button>
          </div>

          {isProcessing && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Processing images...</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {resizeResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              <CheckCircle className="inline w-5 h-5 mr-2" />
              Resize Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {resizeResults.map((result, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">{result.original.name}</h4>
                    <div className="flex gap-2">
                      <Badge variant="secondary">{RESIZE_PRESETS[result.preset as keyof typeof RESIZE_PRESETS].format}</Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadResized(result)}
                        className="flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" />
                        Download
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-green-700">Original</div>
                      <div className="bg-green-50 p-3 rounded">
                        <div className="text-sm">{result.original.type}</div>
                        <div className="font-mono text-sm">{formatFileSize(result.original.size)}</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm font-medium text-blue-700">Resized</div>
                      <div className="bg-blue-50 p-3 rounded">
                        <div className="text-sm">{result.resized.type}</div>
                        <div className="font-mono text-sm">{formatFileSize(result.resized.size)}</div>
                        {result.reduction > 0 && (
                          <div className="text-sm font-medium text-green-700">
                            -{result.reduction}% smaller
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <Separator className="my-3" />

                  <div className="text-center">
                    <div className="font-medium text-lg">
                      {formatFileSize(result.original.size)} → {formatFileSize(result.resized.size)}
                    </div>
                    {result.reduction > 0 && (
                      <div className="text-green-600 font-medium">
                        {result.reduction}% size reduction
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Usage Info */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle>
            <Zap className="inline w-5 h-5 mr-2" />
            Performance Benefits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="font-medium">Faster Uploads</div>
              <div className="text-sm text-muted-foreground">Smaller files upload quicker</div>
            </div>
            <div>
              <div className="font-medium">Bandwidth Savings</div>
              <div className="text-sm text-muted-foreground">Reduce data usage on mobile</div>
            </div>
            <div>
              <div className="font-medium">Better UX</div>
              <div className="text-sm text-muted-foreground">Smooth user experience</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
