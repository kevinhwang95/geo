import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useTranslation } from 'react-i18next';
import axiosClient from '@/api/axiosClient';
import { toast } from 'sonner';
import { Edit, Save, X, Camera, Upload, Trash2 } from 'lucide-react';
import WorkNotePhotoCarousel from './WorkNotePhotoCarousel';

interface WorkNote {
  id: number;
  work_id: number;
  title: string;
  content: string;
  priority_level: 'critical' | 'high' | 'medium' | 'low';
  created_by_user_id: number;
  created_at: string;
  updated_at: string;
  created_by_name: string;
  photos?: Array<{
    id: number;
    filename: string;
    file_path: string;
    mime_type: string;
  }>;
}

interface UploadedPhoto {
  id?: number;
  filename: string;
  file_path?: string;
  mime_type?: string;
  url?: string;
  file?: File;
}

interface EditWorkNoteFormProps {
  note: WorkNote | null;
  open: boolean;
  onClose: () => void;
  onNoteUpdated: () => void;
}

const EditWorkNoteForm: React.FC<EditWorkNoteFormProps> = ({
  note,
  open,
  onClose,
  onNoteUpdated,
}) => {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<'critical' | 'high' | 'medium' | 'low'>('medium');
  const [submitting, setSubmitting] = useState(false);
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  // Initialize form when note changes
  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setPriority(note.priority_level);
      // Initialize existing photos
      if (note.photos && note.photos.length > 0) {
        const mappedPhotos = note.photos.map(photo => ({
          id: photo.id,
          filename: photo.filename,
          file_path: photo.file_path,
          mime_type: photo.mime_type,
          url: `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/uploads/photos/${photo.filename}`
        }));
        setPhotos(mappedPhotos);
      } else {
        setPhotos([]);
      }
    } else {
      // Reset form when dialog closes
      setTitle('');
      setContent('');
      setPriority('medium');
      setPhotos([]);
    }
  }, [note]);

  const handleFileUpload = async (files: FileList) => {
    if (!note) return;

    const newPhotos: UploadedPhoto[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error(t('addWorkNoteForm.invalidFileType'));
        continue;
      }

      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      
      const newPhoto = {
        filename: file.name,
        file: file,
        url: previewUrl,
        mime_type: file.type
      };
      
      newPhotos.push(newPhoto);
    }

    if (newPhotos.length > 0) {
      setPhotos(prev => [...prev, ...newPhotos]);
      toast.success(t('addWorkNoteForm.photosSelected', { count: newPhotos.length }));
    }
  };

  const removePhoto = (index: number) => {
    const photoToRemove = photos[index];
    
    // Revoke object URL if it's a preview
    if (photoToRemove.url && photoToRemove.url.startsWith('blob:')) {
      URL.revokeObjectURL(photoToRemove.url);
    }
    
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const uploadNewPhotos = async () => {
    if (!note) return;

    const newPhotos = photos.filter(photo => photo.file && !photo.id);
    if (newPhotos.length === 0) return;

    setUploadingPhotos(true);
    
    try {
      const uploadPromises = newPhotos.map(async (photo) => {
        if (!photo.file) return null;

        const formData = new FormData();
        formData.append('photo', photo.file);
        formData.append('work_note_id', note.id.toString());

        const response = await axiosClient.post('/work-note-photos/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        if (response.data.success && response.data.data) {
          return response.data.data;
        }
        return null;
      });

      const uploadResults = await Promise.all(uploadPromises);
      const successfulUploads = uploadResults.filter(result => result !== null);
      
      if (successfulUploads.length > 0) {
        toast.success(t('addWorkNoteForm.photosUploaded', { count: successfulUploads.length }));
        
        // Update the photos state to replace uploaded photos with server data
        setPhotos(prev => {
          const updated = prev.map(photo => {
            if (photo.file && !photo.id) {
              // Find the corresponding uploaded photo
              const uploadedPhoto = successfulUploads.find(uploaded => 
                uploaded.original_filename === photo.filename
              );
              if (uploadedPhoto) {
                // Replace with server photo data
                return {
                  id: uploadedPhoto.id,
                  filename: uploadedPhoto.filename,
                  file_path: uploadedPhoto.url,
                  mime_type: uploadedPhoto.mime_type,
                  url: `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${uploadedPhoto.url}`
                };
              }
            }
            return photo;
          });
          return updated;
        });
      }
      
      if (successfulUploads.length < newPhotos.length) {
        toast.warning(t('addWorkNoteForm.somePhotosFailed'));
      }
      
    } catch (error) {
      console.error('Failed to upload photos:', error);
      toast.error(t('addWorkNoteForm.photoUploadFailed'));
    } finally {
      setUploadingPhotos(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!note) return;

    if (!title.trim()) {
      toast.error(t('addWorkNoteForm.titleRequired'));
      return;
    }

    if (!content.trim()) {
      toast.error(t('addWorkNoteForm.contentRequired'));
      return;
    }

    setSubmitting(true);
    try {
      // Update the work note
      const updateData = {
        title: title.trim(),
        content: content.trim(),
        priority_level: priority,
      };

      await axiosClient.put(`/work-notes/${note.id}`, updateData);
      
      // Upload new photos if any
      const newPhotos = photos.filter(photo => photo.file && !photo.id);
      if (newPhotos.length > 0) {
        await uploadNewPhotos();
      }
      
      toast.success(t('addWorkNoteForm.noteUpdated'));
      onNoteUpdated();
      onClose();
    } catch (error) {
      console.error('Failed to update note:', error);
      toast.error(t('addWorkNoteForm.updateFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      onClose();
    }
  };

  if (!note) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Edit className="h-5 w-5" />
            <span>{t('addWorkNoteForm.editWorkNote')}</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              {t('addWorkNoteForm.title')}
            </label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('addWorkNoteForm.titlePlaceholder')}
              disabled={submitting}
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="content" className="text-sm font-medium">
              {t('addWorkNoteForm.content')}
            </label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t('addWorkNoteForm.contentPlaceholder')}
              rows={6}
              disabled={submitting}
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="priority" className="text-sm font-medium">
              {t('addWorkNoteForm.priority')}
            </label>
            <Select
              value={priority}
              onValueChange={(value: 'critical' | 'high' | 'medium' | 'low') => setPriority(value)}
              disabled={submitting}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="critical">{t('addWorkNoteForm.priorityLevels.critical')}</SelectItem>
                <SelectItem value="high">{t('addWorkNoteForm.priorityLevels.high')}</SelectItem>
                <SelectItem value="medium">{t('addWorkNoteForm.priorityLevels.medium')}</SelectItem>
                <SelectItem value="low">{t('addWorkNoteForm.priorityLevels.low')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Photo Upload Section */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center space-x-2">
              <Camera className="h-4 w-4" />
              <span>{t('addWorkNoteForm.photos')}</span>
            </label>
            
            {/* File Upload Input */}
            <div className="flex items-center space-x-2">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                className="hidden"
                id="photo-upload-edit"
                disabled={submitting || uploadingPhotos}
              />
              <label
                htmlFor="photo-upload-edit"
                className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload className="h-4 w-4" />
                <span>{t('addWorkNoteForm.selectPhotos')}</span>
              </label>
            </div>

            {/* Photo Carousel */}
            {photos.length > 0 && (
              <div className="mt-2">
                <WorkNotePhotoCarousel 
                  photos={photos.map(photo => ({
                    id: photo.id || 0,
                    filename: photo.filename,
                    file_path: photo.file_path || '',
                    mime_type: photo.mime_type || 'image/jpeg',
                    url: photo.url // Pass the URL for preview images
                  }))}
                />
                
                {/* Photo Management Controls */}
                <div className="mt-2 flex flex-wrap gap-2">
                  {photos.map((photo, index) => (
                    <div key={photo.id || `photo-${index}`} className="flex items-center space-x-1 bg-gray-50 rounded px-2 py-1">
                      <span className="text-xs text-gray-600 truncate max-w-20">
                        {photo.filename}
                      </span>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="h-5 w-5 p-0"
                        onClick={() => removePhoto(index)}
                        disabled={submitting || uploadingPhotos}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={submitting}
            >
              <X className="h-4 w-4 mr-2" />
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={submitting || !title.trim() || !content.trim()}
            >
              <Save className="h-4 w-4 mr-2" />
              {submitting ? t('common.updating') : t('common.update')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditWorkNoteForm;
