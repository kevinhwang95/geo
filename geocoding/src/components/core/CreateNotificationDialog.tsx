import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Camera, Upload, X, AlertTriangle, Info, MessageSquare, CheckCircle } from 'lucide-react';
import axiosClient from '@/api/axiosClient';

interface Land {
  id?: number;
  land_name: string;
  land_code: string;
  location: string;
  city: string;
  district: string;
  province: string;
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
    }
  }, [open]);

  const handlePhotoCapture = () => {
    // For web, we'll use file input with camera capture
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newPhotos = Array.from(files).filter(file => 
        file.type.startsWith('image/') && file.size <= 10 * 1024 * 1024 // 10MB limit
      );
      setPhotos(prev => [...prev, ...newPhotos]);
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

  const selectedType = notificationTypes.find(t => t.value === type);
  const selectedPriority = priorityLevels.find(p => p.value === priority);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Notification</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Selected Land Info */}
          {selectedLand && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Selected Land</h3>
              <div className="space-y-1 text-sm text-gray-600">
                <p><strong>Name:</strong> {selectedLand.land_name}</p>
                <p><strong>Code:</strong> {selectedLand.land_code}</p>
                <p><strong>Location:</strong> {selectedLand.location}, {selectedLand.city}, {selectedLand.district}, {selectedLand.province}</p>
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
                className="flex items-center space-x-2"
              >
                <Upload className="h-4 w-4" />
                <span>Upload Photo</span>
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

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedLand || !title.trim() || !message.trim() || !type || isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Notification'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateNotificationDialog;
