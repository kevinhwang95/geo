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

const notificationTypes = [
  { value: 'harvest_due', label: 'Harvest Due', icon: CheckCircle, color: 'text-green-500' },
  { value: 'harvest_overdue', label: 'Harvest Overdue', icon: AlertTriangle, color: 'text-red-500' },
  { value: 'maintenance_due', label: 'Maintenance Due', icon: AlertTriangle, color: 'text-yellow-500' },
  { value: 'comment_added', label: 'Comment Added', icon: MessageSquare, color: 'text-blue-500' },
  { value: 'photo_added', label: 'Photo Added', icon: Camera, color: 'text-purple-500' },
];

const priorityLevels = [
  { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-800' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'high', label: 'High', color: 'bg-red-100 text-red-800' },
];

const CreateNotificationDialog: React.FC<CreateNotificationDialogProps> = ({
  open,
  onOpenChange,
  selectedLand,
  onNotificationCreated
}) => {
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
      toast.error('No valid image files selected');
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
          <DialogTitle>Create Notification</DialogTitle>
          <DialogDescription>
            Create a notification for the selected land. Fill in all required fields to enable the Create button.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Selected Land Info */}
          {selectedLand && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Selected Land</h3>
              <div className="space-y-1 text-sm text-gray-600">
                <p><strong>Name:</strong> {selectedLand.land_name}</p>
                <p><strong>Code:</strong> {selectedLand.land_code}</p>
                <p><strong>Location:</strong> {
                  [
                    selectedLand.location,
                    selectedLand.city,
                    selectedLand.district,
                    selectedLand.province
                  ].filter(Boolean).join(', ') || 'Not specified'
                }</p>
              </div>
            </div>
          )}

          {/* Notification Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Notification Type *</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue placeholder="Select notification type" />
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
            <Label htmlFor="priority">Priority Level</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger>
                <SelectValue placeholder="Select priority level" />
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
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter notification title"
              maxLength={100}
            />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Message *</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter notification message"
              rows={4}
              maxLength={500}
            />
            <div className="text-sm text-gray-500 text-right">
              {message.length}/500 characters
            </div>
          </div>

          {/* Photo Upload */}
          <div className="space-y-2">
            <Label>Photos (Optional)</Label>
            <div className="flex space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={handlePhotoCapture}
                className="flex items-center space-x-2"
              >
                <Camera className="h-4 w-4" />
                <span>Take Photo</span>
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
                <span>{isResizing ? 'Processing...' : 'Upload Photo'}</span>
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
                {selectedLand ? '✓' : '✗'} Land Selected
              </span>
              <span className={`flex items-center gap-1 ${title.trim() ? 'text-green-600' : 'text-orange-600'}`}>
                {title.trim() ? '✓' : '✗'} Title
              </span>
              <span className={`flex items-center gap-1 ${message.trim() ? 'text-green-600' : 'text-orange-600'}`}>
                {message.trim() ? '✓' : '✗'} Message
              </span>
              <span className={`flex items-center gap-1 ${type ? 'text-green-600' : 'text-orange-600'}`}>
                {type ? '✓' : '✗'} Type
              </span>
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!selectedLand || !title.trim() || !message.trim() || !type || isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Notification'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateNotificationDialog;
