import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { AlertTriangle, CheckCircle, MessageSquare, Camera, Info, MapPin, Calendar, Download } from 'lucide-react';
import axiosClient from '@/api/axiosClient';

interface NotificationDetail {
  id: number;
  land_id: number;
  user_id: number;
  type: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  is_read: boolean;
  is_dismissed: boolean;
  created_at: string;
  land_name?: string;
  land_code?: string;
  location?: string;
  city?: string;
  district?: string;
  province?: string;
  harvest_status?: string;
}

interface Photo {
  id: number;
  file_path: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  uploaded_at: string;
}

interface NotificationDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notificationId: number | null;
  onNavigateToMap?: () => void;
}

const NotificationDetailDialog: React.FC<NotificationDetailDialogProps> = ({
  open,
  onOpenChange,
  notificationId,
  onNavigateToMap
}) => {
  const { t } = useTranslation();
  const [notification, setNotification] = useState<NotificationDetail | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  useEffect(() => {
    if (open && notificationId) {
      loadNotificationDetails();
    }
  }, [open, notificationId]);

  const loadNotificationDetails = async () => {
    if (!notificationId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await axiosClient.get(`/notifications/show/${notificationId}`);
      
      if (response.data.success) {
        setNotification(response.data.data.notification);
        setPhotos(response.data.data.photos || []);
      } else {
        setError('Failed to load notification details');
      }
    } catch (err) {
      setError('Failed to load notification details');
      console.error('Error loading notification details:', err);
    } finally {
      setLoading(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'harvest_due':
      case 'harvest_overdue':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'maintenance_due':
        return <CheckCircle className="h-5 w-5 text-blue-500" />;
      case 'comment_added':
        return <MessageSquare className="h-5 w-5 text-green-500" />;
      case 'photo_added':
        return <Camera className="h-5 w-5 text-purple-500" />;
      case 'weather_alert':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <Info className="h-5 w-5 text-gray-500" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive" className="text-xs">{t('badges.highPriority')}</Badge>;
      case 'medium':
        return <Badge variant="secondary" className="text-xs">{t('badges.mediumPriority')}</Badge>;
      case 'low':
        return <Badge variant="outline" className="text-xs">{t('badges.lowPriority')}</Badge>;
      default:
        return null;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleViewOnMap = () => {
    if (notification?.land_id && onNavigateToMap) {
      onNavigateToMap();
      // The parent component should handle the map navigation
    }
  };

  const handlePhotoClick = (photo: Photo) => {
    const photoIndex = photos.findIndex(p => p.id === photo.id);
    setCurrentPhotoIndex(photoIndex >= 0 ? photoIndex : 0);
    // setSelectedPhoto(photo);
    setPhotoModalOpen(true);
  };

  const handleDownloadPhoto = (photo: Photo) => {
    const link = document.createElement('a');
    link.href = `${import.meta.env.VITE_API_BASE_UPLOAD}${photo.file_path}`;
    link.download = photo.file_name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Loading...</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error || !notification) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Error</DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error || 'Notification not found'}</p>
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getNotificationIcon(notification.type)}
              <div>
                <DialogTitle className="text-xl">{notification.title}</DialogTitle>
                <div className="flex items-center space-x-2 mt-1">
                  {getPriorityBadge(notification.priority)}
                  <Badge variant="outline" className="text-xs">
                    {notification.type.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Notification Message */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Message</h3>
            <p className="text-gray-700">{notification.message}</p>
          </div>

          {/* Land Information */}
          {notification.land_name && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium mb-3 flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                Land Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-600">Land Name:</span>
                  <p className="font-medium">{notification.land_name}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Land Code:</span>
                  <p className="font-medium">{notification.land_code}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Location:</span>
                  <p className="font-medium">{notification.location}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Area:</span>
                  <p className="font-medium">{notification.city}, {notification.district}, {notification.province}</p>
                </div>
              </div>
              {notification.land_id && (
                <div className="mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleViewOnMap}
                    className="flex items-center"
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    View on Map
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Photos Section */}
          {photos.length > 0 && (
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-medium mb-3 flex items-center">
                <Camera className="h-4 w-4 mr-2" />
                Photos ({photos.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {photos.map((photo) => (
                  <div key={photo.id} className="bg-white p-3 rounded-lg border">
                    <div 
                      className="aspect-square bg-white rounded-lg mb-2 flex items-center justify-center overflow-hidden cursor-pointer hover:shadow-md transition-all relative group border"
                      onClick={() => handlePhotoClick(photo)}
                    >
                      {photo.mime_type.startsWith('image/') ? (
                        <>
                          <img
                            src={`${import.meta.env.VITE_API_BASE_UPLOAD}${photo.file_path}`}
                            alt={photo.file_name}
                            className="w-full h-full object-cover rounded-lg"
                            style={{ maxWidth: '100%', maxHeight: '100%' }}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              target.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                          {/* Hover overlay - temporarily disabled to debug */}
                          {/* <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center rounded-lg">
                            <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                          </div> */}
                        </>
                      ) : (
                        <div className="text-center text-gray-500">
                          <Camera className="h-8 w-8 mx-auto mb-2" />
                          <p className="text-xs">Preview not available</p>
                        </div>
                      )}
                      <div className="hidden text-center text-gray-500">
                        <Camera className="h-8 w-8 mx-auto mb-2" />
                        <p className="text-xs">Image not found</p>
                      </div>
                    </div>
                    <div className="text-xs text-gray-600">
                      <p className="font-medium truncate">{photo.file_name}</p>
                      <p>{formatFileSize(photo.file_size)}</p>
                      <p>{new Date(photo.uploaded_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notification Details */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium mb-3 flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              Notification Details
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Created:</span>
                <p className="font-medium">{new Date(notification.created_at).toLocaleString()}</p>
              </div>
              <div>
                <span className="text-gray-600">Status:</span>
                <p className="font-medium">
                  {notification.is_read ? 'Read' : 'Unread'} • 
                  {notification.is_dismissed ? ' Dismissed' : ' Active'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>

      {/* Photo Modal with Carousel */}
      <Dialog open={photoModalOpen} onOpenChange={setPhotoModalOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Camera className="h-5 w-5 text-purple-500" />
                <div>
                  <DialogTitle className="text-lg">
                    Photos ({photos.length})
                  </DialogTitle>
                  <div className="text-sm text-gray-600 mt-1">
                    {photos.length > 0 && (
                      <>
                        Photo {currentPhotoIndex + 1} of {photos.length} • 
                        {photos[currentPhotoIndex] && formatFileSize(photos[currentPhotoIndex].file_size)} • 
                        {photos[currentPhotoIndex] && new Date(photos[currentPhotoIndex].uploaded_at).toLocaleString()}
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex space-x-2">
                {photos.length > 0 && photos[currentPhotoIndex] && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadPhoto(photos[currentPhotoIndex])}
                    className="flex items-center"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                )}
              </div>
            </div>
          </DialogHeader>

          <div className="relative">
            {photos.length > 0 ? (
              <Carousel 
                className="w-full" 
                opts={{ 
                  startIndex: currentPhotoIndex,
                  loop: true 
                }}
                setApi={(api) => {
                  if (api) {
                    api.on('select', () => {
                      setCurrentPhotoIndex(api.selectedScrollSnap());
                    });
                  }
                }}
              >
                <CarouselContent className="h-[60vh]">
                  {photos.map((photo) => (
                    <CarouselItem key={photo.id}>
                      <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg overflow-hidden">
                        {photo.mime_type.startsWith('image/') ? (
                          <img
                            src={`${import.meta.env.VITE_API_BASE_UPLOAD}${photo.file_path}`}
                            alt={photo.file_name}
                            className="max-w-full max-h-full object-contain"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              target.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : (
                          <div className="text-center text-gray-500">
                            <Camera className="h-16 w-16 mx-auto mb-4" />
                            <p className="text-lg">Preview not available</p>
                          </div>
                        )}
                        <div className="hidden text-center text-gray-500">
                          <Camera className="h-16 w-16 mx-auto mb-4" />
                          <p className="text-lg">Image not found</p>
                        </div>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                
                {photos.length > 1 && (
                  <>
                    <CarouselPrevious className="left-4" />
                    <CarouselNext className="right-4" />
                  </>
                )}
              </Carousel>
            ) : (
              <div className="flex items-center justify-center h-[60vh] bg-gray-50 rounded-lg">
                <div className="text-center text-gray-500">
                  <Camera className="h-16 w-16 mx-auto mb-4" />
                  <p className="text-lg">No photos available</p>
                </div>
              </div>
            )}

            {/* Photo thumbnails navigation */}
            {photos.length > 1 && (
              <div className="mt-4 flex justify-center space-x-2 overflow-x-auto pb-2">
                {photos.map((photo, index) => (
                  <button
                    key={photo.id}
                    onClick={() => setCurrentPhotoIndex(index)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                      index === currentPhotoIndex 
                        ? 'border-purple-500 ring-2 ring-purple-200' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img
                      src={`${import.meta.env.VITE_API_BASE_UPLOAD}${photo.file_path}`}
                      alt={photo.file_name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                    <div className="hidden w-full h-full bg-gray-100 items-center justify-center">
                      <Camera className="h-4 w-4 text-gray-400 mx-auto mt-4" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};

export default NotificationDetailDialog;
