import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Camera, Upload, X, AlertTriangle, MessageSquare, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import axiosClient from '@/api/axiosClient';
import { resizeImages, formatFileSize, getFileSizeReduction, RESIZE_PRESETS } from '@/utils/imageResize';

interface Land {
  id?: number;
  land_name: string;
  land_code: string;
  location?: string;
  city?: string;
  district?: string;
  province?: string;
}

interface CreateNotificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedLand: Land | null;
  onNotificationCreated?: () => void;
}

const CreateNotificationDialog: React.FC<CreateNotificationDialogProps> = ({
  open,
  onOpenChange,
  selectedLand,
  onNotificationCreated
}) => {
  const { t } = useTranslation();
  
  const notificationTypes = [
    { value: 'harvest_due', label: t('createNotification.harvestDue'), icon: CheckCircle, color: 'text-green-500' },
    { value: 'harvest_overdue', label: t('createNotification.harvestOverdue'), icon: AlertTriangle, color: 'text-red-500' },
    { value: 'maintenance_due', label: t('createNotification.maintenanceDue'), icon: AlertTriangle, color: 'text-yellow-500' },
    { value: 'comment_added', label: t('createNotification.commentAdded'), icon: MessageSquare, color: 'text-blue-500' },
    { value: 'photo_added', label: t('createNotification.photoAdded'), icon: Camera, color: 'text-purple-500' },
  ];

  const priorityLevels = [
    { value: 'low', label: t('createNotification.low'), color: 'bg-gray-100 text-gray-800' },
    { value: 'medium', label: t('createNotification.medium'), color: 'bg-yellow-100 text-yellow-800' },
    { value: 'high', label: t('createNotification.high'), color: 'bg-red-100 text-red-800' },
  ];
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<string>('');
  const [priority, setPriority] = useState<string>('medium');
  const [photos, setPhotos] = useState<File[]>([]);
  const [isResizing, setIsResizing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset form when dialog opens/closes
  React.useEffect(() => {
    if (open) {
      setTitle('');
      setMessage('');
      setType('');
      setPriority('medium');
      setPhotos([]);
      
      // Debug selected land
      console.log('CreateNotificationDialog opened with selectedLand:', selectedLand);
      
      if (!selectedLand) {
        console.warn('No land selected - Create Notification button will be disabled until land is selected');
      }
    }
  }, [open, selectedLand]);

  const handlePhotoCapture = () => {
    // For web, we'll use file input with camera capture
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    // Filter and validate files first
    const validFiles = Array.from(files).filter(file => 
      file.type.startsWith('image/') && file.size <= 10 * 1024 * 1024 // 10MB limit
    );

    if (validFiles.length === 0) {
      toast.error(t('createNotification.noValidImageFiles'));
      return;
    }

    try {
      setIsResizing(true);
      
      // Show toast with progress info
      toast.info(`Processing ${validFiles.length} image${validFiles.length > 1 ? 's' : ''}...`);

      // Resize images using optimized settings for notifications
      const resizedPhotos = await resizeImages(validFiles, RESIZE_PRESETS.webOptimized);
      
      // Calculate and display size reduction
      const totalOriginalSize = validFiles.reduce((sum, file) => sum + file.size, 0);
      const totalNewSize = resizedPhotos.reduce((sum, file) => sum + file.size, 0);
      const reduction = getFileSizeReduction(totalOriginalSize, totalNewSize);

      if (reduction > 0) {
        toast.success(`Images processed! ${reduction}% size reduction achieved`, {
          description: `Original: ${formatFileSize(totalOriginalSize)} → New: ${formatFileSize(totalNewSize)}`,
        });
      }

      setPhotos(prev => [...prev, ...resizedPhotos]);
      
    } catch (error) {
      console.error('Error processing images:', error);
      toast.error('Failed to process images. Please try again.');
    } finally {
      setIsResizing(false);
      // Clear the input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!selectedLand || !title.trim() || !message.trim() || !type) {
      return;
    }

    setIsSubmitting(true);
    try {
      if (!selectedLand?.id) {
        throw new Error('Selected land is missing an id.');
      }
      const formData = new FormData();
      formData.append('land_id', selectedLand.id.toString());
      formData.append('title', title.trim());
      formData.append('message', message.trim());
      formData.append('type', type);
      formData.append('priority', priority);

      // Add photos if any
      photos.forEach((photo, index) => {
        formData.append(`photos[${index}]`, photo);
      });

      const response = await axiosClient.post('/notifications', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Notification created:', response.data);
      
      // Call the callback to refresh notifications
      if (onNotificationCreated) {
        onNotificationCreated();
      }

      // Close dialog
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating notification:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // const selectedType = notificationTypes.find(t => t.value === type);
  // const selectedPriority = priorityLevels.find(p => p.value === priority);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('createNotification.title')}</DialogTitle>
          <DialogDescription>
            {t('createNotification.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Selected Land Info */}
          {selectedLand && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">{t('createNotification.selectedLand')}</h3>
              <div className="space-y-1 text-sm text-gray-600">
                <p><strong>{t('createNotification.name')}:</strong> {selectedLand.land_name}</p>
                <p><strong>{t('createNotification.code')}:</strong> {selectedLand.land_code}</p>
                <p><strong>{t('createNotification.location')}:</strong> {
                  [
                    selectedLand.location,
                    selectedLand.city,
                    selectedLand.district,
                    selectedLand.province
                  ].filter(Boolean).join(', ') || t('createNotification.notSpecified')
                }</p>
              </div>
            </div>
          )}

          {/* Notification Type */}
          <div className="space-y-2">
            <Label htmlFor="type">{t('createNotification.notificationType')} *</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue placeholder={t('createNotification.selectNotificationType')} />
              </SelectTrigger>
              <SelectContent>
                {notificationTypes.map((notificationType) => {
                  const IconComponent = notificationType.icon;
                  return (
                    <SelectItem key={notificationType.value} value={notificationType.value}>
                      <div className="flex items-center space-x-2">
                        <IconComponent className={`h-4 w-4 ${notificationType.color}`} />
                        <span>{notificationType.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Priority Level */}
          <div className="space-y-2">
            <Label htmlFor="priority">{t('createNotification.priorityLevel')}</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger>
                <SelectValue placeholder={t('createNotification.selectPriorityLevel')} />
              </SelectTrigger>
              <SelectContent>
                {priorityLevels.map((level) => (
                  <SelectItem key={level.value} value={level.value}>
                    <Badge className={level.color}>{level.label}</Badge>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">{t('createNotification.titleLabel')} *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('createNotification.enterNotificationTitle')}
              maxLength={100}
            />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">{t('createNotification.messageLabel')} *</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t('createNotification.enterNotificationMessage')}
              rows={4}
              maxLength={500}
            />
            <div className="text-sm text-gray-500 text-right">
              {message.length}/500 {t('createNotification.characters')}
            </div>
          </div>

          {/* Photo Upload */}
          <div className="space-y-2">
            <Label>{t('createNotification.photosOptional')}</Label>
            <div className="flex space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={handlePhotoCapture}
                className="flex items-center space-x-2"
              >
                <Camera className="h-4 w-4" />
                <span>{t('createNotification.takePhoto')}</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isResizing}
                className="flex items-center space-x-2"
              >
                {isResizing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                <span>{isResizing ? t('createNotification.creating') : t('createNotification.uploadPhotos')}</span>
              </Button>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              onChange={handlePhotoUpload}
              className="hidden"
            />

            {/* Photo Preview */}
            {photos.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                {photos.map((photo, index) => (
                  <div key={index} className="relative">
                    <img
                      src={URL.createObjectURL(photo)}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-24 object-cover rounded border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-1 right-1 h-6 w-6 p-0"
                      onClick={() => removePhoto(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                    <div className="text-xs text-gray-500 mt-1 truncate">
                      {photo.name}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex-col gap-3">
          {/* Requirements status */}
          <div className="text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <span className={`flex items-center gap-1 ${selectedLand ? 'text-green-600' : 'text-orange-600'}`}>
                {selectedLand ? '✓' : '✗'} {t('createNotification.landSelected')}
              </span>
              <span className={`flex items-center gap-1 ${title.trim() ? 'text-green-600' : 'text-orange-600'}`}>
                {title.trim() ? '✓' : '✗'} {t('createNotification.titleStatus')}
              </span>
              <span className={`flex items-center gap-1 ${message.trim() ? 'text-green-600' : 'text-orange-600'}`}>
                {message.trim() ? '✓' : '✗'} {t('createNotification.messageStatus')}
              </span>
              <span className={`flex items-center gap-1 ${type ? 'text-green-600' : 'text-orange-600'}`}>
                {type ? '✓' : '✗'} {t('createNotification.typeStatus')}
              </span>
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t('createNotification.cancel')}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!selectedLand || !title.trim() || !message.trim() || !type || isSubmitting}
            >
              {isSubmitting ? t('createNotification.creating') : t('createNotification.createNotification')}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateNotificationDialog;
