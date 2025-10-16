import React, { useState } from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Camera } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Photo {
  id: number;
  filename: string;
  file_path: string;
  mime_type: string;
  url?: string; // Optional URL for preview images
}

interface WorkNotePhotoCarouselProps {
  photos: Photo[];
  className?: string;
}

const WorkNotePhotoCarousel: React.FC<WorkNotePhotoCarouselProps> = ({
  photos,
  className = '',
}) => {
  const { t } = useTranslation();
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);

  if (!photos || photos.length === 0) {
    return null;
  }

  const openPhotoDialog = (index: number) => {
    setSelectedPhotoIndex(index);
  };

  const closePhotoDialog = () => {
    setSelectedPhotoIndex(null);
  };

  const getPhotoUrl = (photo: Photo) => {
    // Use provided URL if available (for preview images), otherwise generate from filename
    return photo.url || `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/uploads/photos/${photo.filename}`;
  };

  return (
    <>
      <div className={`border-t pt-4 ${className}`}>
        <h4 className="font-medium mb-2 flex items-center space-x-2">
          <Camera className="h-4 w-4" />
          <span>{t('workNotesList.photos')} ({photos.length})</span>
        </h4>
        
        {photos.length === 1 ? (
          // Single photo - show as clickable thumbnail
          <div className="flex justify-center">
            <div 
              className="border rounded p-2 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => openPhotoDialog(0)}
            >
              <img
                src={getPhotoUrl(photos[0])}
                alt={photos[0].filename}
                className="w-full h-32 object-cover rounded"
                onError={(e) => {
                  console.error('Failed to load image:', {
                    filename: photos[0].filename,
                    url: getPhotoUrl(photos[0])
                  });
                  e.currentTarget.style.display = 'none';
                }}
              />
              <div className="text-sm text-gray-600 truncate mt-1">{photos[0].filename}</div>
            </div>
          </div>
        ) : (
          // Multiple photos - show as carousel
          <div className="relative">
            <Carousel className="w-full max-w-xs mx-auto">
              <CarouselContent>
                {photos.map((photo, index) => (
                  <CarouselItem key={photo.id || `photo-${index}`}>
                    <div 
                      className="border rounded p-2 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => openPhotoDialog(index)}
                    >
                      <img
                        src={getPhotoUrl(photo)}
                        alt={photo.filename}
                        className="w-full h-32 object-cover rounded"
                        onError={(e) => {
                          console.error('Failed to load image:', {
                            filename: photo.filename,
                            url: getPhotoUrl(photo)
                          });
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <div className="text-sm text-gray-600 truncate mt-1">{photo.filename}</div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </div>
        )}
      </div>

      {/* Full-size photo dialog */}
      <Dialog open={selectedPhotoIndex !== null} onOpenChange={closePhotoDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="flex items-center space-x-2">
              <Camera className="h-5 w-5" />
              <span>
                {selectedPhotoIndex !== null && photos[selectedPhotoIndex]?.filename}
              </span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="p-6 pt-0">
            {selectedPhotoIndex !== null && (
              <div className="relative">
                <img
                  src={getPhotoUrl(photos[selectedPhotoIndex])}
                  alt={photos[selectedPhotoIndex].filename}
                  className="w-full h-auto max-h-[60vh] object-contain rounded"
                  onError={(e) => {
                    console.error('Failed to load full-size image:', {
                      filename: photos[selectedPhotoIndex].filename,
                      url: getPhotoUrl(photos[selectedPhotoIndex])
                    });
                    e.currentTarget.style.display = 'none';
                  }}
                />
                
                {/* Photo navigation for multiple photos */}
                {photos.length > 1 && (
                  <div className="flex justify-center space-x-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const prevIndex = selectedPhotoIndex === 0 ? photos.length - 1 : selectedPhotoIndex - 1;
                        setSelectedPhotoIndex(prevIndex);
                      }}
                    >
                      {t('common.previous')}
                    </Button>
                    <span className="flex items-center text-sm text-gray-500">
                      {selectedPhotoIndex + 1} / {photos.length}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const nextIndex = selectedPhotoIndex === photos.length - 1 ? 0 : selectedPhotoIndex + 1;
                        setSelectedPhotoIndex(nextIndex);
                      }}
                    >
                      {t('common.next')}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default WorkNotePhotoCarousel;
