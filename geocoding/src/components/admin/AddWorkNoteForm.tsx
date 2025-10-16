import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';
import axiosClient from '@/api/axiosClient';
import { toast } from 'sonner';
import { MessageSquare, Send, Upload, X } from 'lucide-react';

interface AddWorkNoteFormProps {
  workId: number;
  onNoteAdded: () => void;
}

interface UploadedPhoto {
  id: number;
  filename: string;
  url?: string;
  file_path?: string;
  mime_type?: string;
  file?: File; // Store the actual file for upload
}

const AddWorkNoteForm: React.FC<AddWorkNoteFormProps> = ({
  workId,
  onNoteAdded,
}) => {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<'critical' | 'high' | 'medium' | 'low'>('medium');
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      // Store files for later upload after work note is created
      const filesArray = Array.from(files);
      setPhotos(prev => [...prev, ...filesArray.map(file => ({
        id: Math.random(), // Temporary ID for preview
        filename: file.name,
        url: URL.createObjectURL(file), // Create preview URL
        file: file // Store the actual file for later upload
      }))]);
      
      toast.success(t('addWorkNoteForm.photosSelected'));
    } catch (error) {
      console.error('Failed to upload photos:', error);
      toast.error(t('addWorkNoteForm.uploadFailed'));
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (photoId: number) => {
    setPhotos(prev => prev.filter(photo => photo.id !== photoId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      toast.error(t('addWorkNoteForm.fillRequiredFields'));
      return;
    }

    setSubmitting(true);
    try {
      // Create the work note
      const noteData = {
        work_id: workId,
        title: title.trim(),
        content: content.trim(),
        priority_level: priority,
      };

      const noteResponse = await axiosClient.post('/work-notes', noteData);
      const note = noteResponse.data.data;

      // Upload photos to the note if any
      if (photos.length > 0) {
        const photosToUpload = photos.filter(photo => photo.file);
        
        if (photosToUpload.length > 0) {
          const photoPromises = photosToUpload.map(async (photo) => {
            try {
              const formData = new FormData();
              formData.append('photo', photo.file!);
              formData.append('work_note_id', note.id.toString());
              
              const response = await axiosClient.post('/work-note-photos/upload', formData, {
                headers: {
                  'Content-Type': 'multipart/form-data',
                },
              });
              
              return { success: true, data: response.data.data };
            } catch (error) {
              console.error('Failed to upload photo:', photo.filename, error);
              return { success: false, filename: photo.filename, error };
            }
          });
          
          const photoResults = await Promise.all(photoPromises);
          
          // Check results and show appropriate messages
          const successful = photoResults.filter(r => r.success).length;
          const failed = photoResults.filter(r => !r.success).length;
          
          if (successful > 0 && failed === 0) {
            toast.success(t('addWorkNoteForm.photosUploaded'));
          } else if (successful > 0 && failed > 0) {
            toast.warning(`Photos uploaded: ${successful}, Failed: ${failed}`);
          } else if (failed > 0) {
            toast.error(t('addWorkNoteForm.uploadFailed'));
          }
        }
      }

      toast.success(t('addWorkNoteForm.noteCreated'));
      
      // Reset form
      setTitle('');
      setContent('');
      setPriority('medium');
      setPhotos([]);
      
      onNoteAdded();
    } catch (error) {
      console.error('Failed to create work note:', error);
      toast.error(t('addWorkNoteForm.creationFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MessageSquare className="h-5 w-5" />
          <span>{t('addWorkNoteForm.addWorkNote')}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {t('addWorkNoteForm.title')} <span className="text-red-500">*</span>
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('addWorkNoteForm.titlePlaceholder')}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              {t('addWorkNoteForm.priority')}
            </label>
            <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">{t('addWorkNoteForm.priorityLevels.low')}</SelectItem>
                <SelectItem value="medium">{t('addWorkNoteForm.priorityLevels.medium')}</SelectItem>
                <SelectItem value="high">{t('addWorkNoteForm.priorityLevels.high')}</SelectItem>
                <SelectItem value="critical">{t('addWorkNoteForm.priorityLevels.critical')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              {t('addWorkNoteForm.content')} <span className="text-red-500">*</span>
            </label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t('addWorkNoteForm.contentPlaceholder')}
              rows={4}
              required
            />
          </div>

          {/* Photo Upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {t('addWorkNoteForm.photos')} ({t('addWorkNoteForm.optional')})
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                id="photo-upload"
                disabled={uploading}
              />
              <label
                htmlFor="photo-upload"
                className="cursor-pointer flex flex-col items-center justify-center py-4"
              >
                <Upload className="h-8 w-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-600">
                  {uploading ? t('addWorkNoteForm.uploading') : t('addWorkNoteForm.clickToUpload')}
                </span>
              </label>
            </div>

            {/* Display uploaded photos */}
            {photos.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-2">
                {photos.filter(photo => photo && photo.id).map((photo, index) => (
                  <div key={photo.id || `photo-${index}`} className="relative group">
                    <img
                      src={photo?.url || `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/uploads/photos/${photo?.filename}`}
                      alt={photo?.filename || 'Uploaded photo'}
                      className="w-full h-20 object-cover rounded border"
                      onError={(e) => {
                        console.error('Failed to load image:', {
                          filename: photo?.filename,
                          url: photo?.url,
                          fullSrc: photo?.url || `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/uploads/photos/${photo?.filename}`
                        });
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => photo?.id && removePhoto(photo.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button
            type="submit"
            disabled={submitting || uploading || !title.trim() || !content.trim()}
            className="w-full"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                {t('addWorkNoteForm.creating')}
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                {t('addWorkNoteForm.addNote')}
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default AddWorkNoteForm;
