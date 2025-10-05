import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Download, Maximize2 } from 'lucide-react';

interface Photo {
  id: number;
  file_path: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  uploaded_at: string;
}

interface PhotoCarouselModalProps {
  isOpen: boolean;
  onClose: () => void;
  photos: Photo[];
  initialIndex?: number;
}

const PhotoCarouselModal: React.FC<PhotoCarouselModalProps> = ({
  isOpen,
  onClose,
  photos,
  initialIndex = 0
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isLoading, setIsLoading] = useState(false);

  // Update current index when initialIndex changes
  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          goToPrevious();
          break;
        case 'ArrowRight':
          event.preventDefault();
          goToNext();
          break;
        case 'Escape':
          event.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, photos.length]);

  // Prevent body scroll when modal is open and add isolation styles
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Add a class to the body to help with isolation
      document.body.classList.add('modal-open');
    } else {
      document.body.style.overflow = 'unset';
      document.body.classList.remove('modal-open');
    }

    return () => {
      document.body.style.overflow = 'unset';
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
  };

  const handleDownload = () => {
    if (photos[currentIndex]) {
      const photo = photos[currentIndex];
      const serverRoot = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api').replace(/\/api$/, '');
      const photoUrl = `${serverRoot}/${photo.file_path}`;
      
      const link = document.createElement('a');
      link.href = photoUrl;
      link.download = photo.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleFullscreen = () => {
    if (photos[currentIndex]) {
      const photo = photos[currentIndex];
      const serverRoot = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api').replace(/\/api$/, '');
      const photoUrl = `${serverRoot}/${photo.file_path}`;
      window.open(photoUrl, '_blank');
    }
  };

  if (!isOpen || photos.length === 0) return null;

  const currentPhoto = photos[currentIndex];
  const serverRoot = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api').replace(/\/api$/, '');
  const photoUrl = `${serverRoot}/${currentPhoto.file_path}`;

  return (
    <div 
      className="photo-carousel-modal fixed inset-0 flex items-center justify-center"
    >
      {/* Backdrop */}
      <div 
        className="photo-carousel-backdrop absolute inset-0 bg-black bg-opacity-90 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div 
        className="photo-carousel-content relative w-full h-full max-w-7xl max-h-screen p-4 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-white">
            <h3 className="text-lg font-semibold">
              {currentPhoto.file_name}
            </h3>
            <p className="text-sm text-gray-300">
              {currentIndex + 1} of {photos.length} • {Math.round(currentPhoto.file_size / 1024)}KB
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              title="Download"
            >
              <Download size={20} />
            </button>
            <button
              onClick={handleFullscreen}
              className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              title="Open in new tab"
            >
              <Maximize2 size={20} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              title="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Main Image Area */}
        <div className="flex-1 flex items-center justify-center relative">
          {/* Navigation Buttons */}
          {photos.length > 1 && (
            <>
              <button
                onClick={goToPrevious}
                className="absolute left-4 z-20 p-3 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full transition-all"
                title="Previous photo"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={goToNext}
                className="absolute right-4 z-20 p-3 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full transition-all"
                title="Next photo"
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}

          {/* Image */}
          <div className="relative max-w-full max-h-full">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
              </div>
            )}
            <img
              src={photoUrl}
              alt={currentPhoto.file_name}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onLoad={handleImageLoad}
              onError={handleImageError}
              onClick={() => setIsLoading(true)}
            />
          </div>
        </div>

        {/* Thumbnail Strip */}
        {photos.length > 1 && (
          <div className="mt-4 flex justify-center">
            <div className="flex gap-2 overflow-x-auto max-w-full p-2">
              {photos.map((photo, index) => {
                const thumbUrl = `${serverRoot}/${photo.file_path}`;
                return (
                  <button
                    key={photo.id}
                    onClick={() => goToSlide(index)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                      index === currentIndex
                        ? 'border-white shadow-lg'
                        : 'border-transparent hover:border-white hover:border-opacity-50'
                    }`}
                  >
                    <img
                      src={thumbUrl}
                      alt={photo.file_name}
                      className="w-full h-full object-cover"
                    />
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PhotoCarouselModal;
