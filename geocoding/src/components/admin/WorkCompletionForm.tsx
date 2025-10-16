import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Combobox } from '@/components/ui/combobox';
import { useTranslation } from 'react-i18next';
import axiosClient from '@/api/axiosClient';
import { toast } from 'sonner';
import { 
  CheckCircle, 
  Upload, 
  X, 
  Truck, 
  User, 
  Package,
  Calendar,
  MessageSquare,
  Users,
} from 'lucide-react';

interface WorkCompletionFormProps {
  workAssignment: {
    id: number;
    title: string;
    teamId: number | null;
    teamName?: string;
    status: string;
  };
  completion: {
    id: number;
    completionNote: string;
    workerCount: number;
    weightOfProduct: number | null;
    truckNumber: string | null;
    driverName: string | null;
    completedByName: string;
    completedAt: string;
    workers?: Array<{
      userId: number;
      userName: string;
      teamName: string;
    }>;
    photos?: Array<{
      id: number;
      filename: string;
      file_path: string;
      mime_type: string;
    }>;
  } | null;
  onWorkCompleted: () => void;
}

interface UploadedPhoto {
  id: number;
  filename: string;
  url?: string;
  file_path?: string;
  mime_type?: string;
}

interface Worker {
  id: number;
  userId: number;
  userName: string;
  teamName: string;
}

const WorkCompletionForm: React.FC<WorkCompletionFormProps> = ({
  workAssignment,
  completion,
  onWorkCompleted,
}) => {
  const { t } = useTranslation();
  const [completionNote, setCompletionNote] = useState('');
  const [completionDate, setCompletionDate] = useState(new Date().toISOString().slice(0, 16)); // YYYY-MM-DDTHH:MM format
  const [selectedWorkers, setSelectedWorkers] = useState<Worker[]>([]);
  const [availableWorkers, setAvailableWorkers] = useState<Worker[]>([]);
  const [weightOfProduct, setWeightOfProduct] = useState('');
  const [truckNumber, setTruckNumber] = useState('');
  const [driverName, setDriverName] = useState('');
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingWorkers, setLoadingWorkers] = useState(false);

  const isCompleted = completion !== null;
  const canComplete = workAssignment.status !== 'completed' && workAssignment.teamId !== null;


  // Load all available workers (not just assigned team members)
  useEffect(() => {
    if (canComplete) {
      loadAllAvailableWorkers();
    }
  }, [canComplete]);

  const loadAllAvailableWorkers = async () => {
    setLoadingWorkers(true);
    try {
      // Get all team members from all teams
      const response = await axiosClient.get('/teams/members/all');
      console.log('Workers API response:', response.data);
      
      if (response.data.success && response.data.data) {
        const workers: Worker[] = response.data.data.map((member: any) => ({
          id: member.id,
          userId: member.user_id,
          userName: member.user_name,
          teamName: member.team_name
        }));
        console.log('Mapped workers:', workers);
        setAvailableWorkers(workers);
      } else {
        console.warn('No workers data received from API');
        setAvailableWorkers([]);
      }
    } catch (error) {
      console.error('Failed to load workers:', error);
      toast.error('Failed to load workers');
      setAvailableWorkers([]);
    } finally {
      setLoadingWorkers(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData();
        formData.append('photo', file);
        formData.append('land_id', '1'); // Default land ID, should be from work assignment
        
        const response = await axiosClient.post('/photos/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        return response.data;
      });

      const uploadedPhotos = await Promise.all(uploadPromises);
      setPhotos(prev => [...prev, ...uploadedPhotos]);
      toast.success(t('workCompletionForm.photosUploaded'));
    } catch (error) {
      console.error('Failed to upload photos:', error);
      toast.error(t('workCompletionForm.uploadFailed'));
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (photoId: number) => {
    setPhotos(prev => prev.filter(photo => photo.id !== photoId));
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!completionNote.trim()) {
      toast.error(t('workCompletionForm.completionNoteRequired'));
      return;
    }

    if (selectedWorkers.length === 0) {
      toast.error('Please select at least one worker');
      return;
    }

    setSubmitting(true);
    try {
      // Create the work completion using the farm-works complete endpoint
      const completionData = {
        team_id: workAssignment.teamId!,
        completion_note: completionNote.trim(),
        completion_date: completionDate, // Include the completion date
        workers: selectedWorkers, // Include selected workers with their details
        weight_of_product: weightOfProduct ? parseFloat(weightOfProduct) : null,
        truck_number: truckNumber.trim() || null,
        driver_name: driverName.trim() || null,
      };

      await axiosClient.post(`/farm-works/complete/${workAssignment.id}`, completionData);

      // Note: Photo upload for completions would need to be handled separately
      // as the current API doesn't support adding photos to completions
      // This could be added as a future enhancement

      toast.success(t('workCompletionForm.workCompleted'));
      onWorkCompleted();
    } catch (error) {
      console.error('Failed to complete work:', error);
      toast.error(t('workCompletionForm.completionFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  if (isCompleted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span>{t('workCompletionForm.workCompleted')}</span>
            <Badge variant="default" className="bg-green-600">
              {t('workCompletionForm.completed')}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span>{t('workCompletionForm.completedBy')}</span>
              </label>
              <span>{completion.completedByName || 'Unknown'}</span>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>{t('workCompletionForm.completedAt')}</span>
              </label>
              <span>
                {completion.completedAt ? 
                  (() => {
                    try {
                      return new Date(completion.completedAt).toLocaleString();
                    } catch (error) {
                      console.error('Date parsing error:', error, 'Date string:', completion.completedAt);
                      return completion.completedAt;
                    }
                  })() 
                  : 'Unknown'
                }
              </span>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center space-x-2">
              <MessageSquare className="h-4 w-4" />
              <span>{t('workCompletionForm.completionNote')}</span>
            </label>
            <p className="text-gray-700 whitespace-pre-wrap">{completion.completionNote}</p>
          </div>

          {completion.workerCount > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>{t('workCompletionForm.workerCount')}</span>
              </label>
              <span>{completion.workerCount}</span>
            </div>
          )}

          {/* Workers List */}
          {completion.workers && completion.workers.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>{t('workCompletionForm.workersInvolved', 'Workers Involved')}</span>
              </label>
              <div className="space-y-1">
                {completion.workers.map((worker, index) => (
                  <div key={worker.userId || `worker-${index}`} className="flex items-center justify-between p-2 border rounded-lg bg-gray-50">
                    <div>
                      <span className="font-medium">{worker.userName}</span>
                      {worker.teamName && (
                        <span className="text-sm text-gray-500 ml-2">({worker.teamName})</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {completion.weightOfProduct && (
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center space-x-2">
                <Package className="h-4 w-4" />
                <span>{t('workCompletionForm.weightOfProduct')}</span>
              </label>
              <span>{completion.weightOfProduct} kg</span>
            </div>
          )}

          {(completion.truckNumber || completion.driverName) && (
            <>
              <Separator />
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center space-x-2">
                  <Truck className="h-4 w-4" />
                  <span>{t('workCompletionForm.transportation')}</span>
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {completion.truckNumber && (
                    <div>
                      <span className="text-sm text-gray-600">{t('workCompletionForm.truckNumber')}: </span>
                      <span>{completion.truckNumber}</span>
                    </div>
                  )}
                  {completion.driverName && (
                    <div>
                      <span className="text-sm text-gray-600">{t('workCompletionForm.driverName')}: </span>
                      <span>{completion.driverName}</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Completion Photos */}
          {completion.photos && completion.photos.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {t('workCompletionForm.photos')} ({completion.photos.length})
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {completion.photos.map((photo, index) => (
                    <img
                      key={photo.id || `photo-${index}`}
                      src={`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/uploads/photos/${photo.filename}`}
                      alt={photo.filename}
                      className="w-full h-20 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                      onError={(e) => {
                        console.error('Failed to load image:', photo?.filename);
                        e.currentTarget.style.display = 'none';
                      }}
                      onClick={() => {
                        window.open(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/uploads/${photo.filename}`, '_blank');
                      }}
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  if (!canComplete) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <CheckCircle className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {t('workCompletionForm.cannotComplete')}
          </h3>
          <p className="text-gray-500 text-center">
            {workAssignment.status === 'completed' 
              ? t('workCompletionForm.alreadyCompleted')
              : t('workCompletionForm.mustBeAssignedToTeam')
            }
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <CheckCircle className="h-5 w-5" />
          <span>{t('workCompletionForm.completeWork')}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {t('workCompletionForm.completionNote')} <span className="text-red-500">*</span>
            </label>
            <Textarea
              value={completionNote}
              onChange={(e) => setCompletionNote(e.target.value)}
              placeholder={t('workCompletionForm.completionNotePlaceholder')}
              rows={4}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              {t('workCompletionForm.completionDate')} <span className="text-red-500">*</span>
            </label>
            <Input
              type="datetime-local"
              value={completionDate}
              onChange={(e) => setCompletionDate(e.target.value)}
              required
              className="h-10"
            />
            <p className="text-xs text-gray-500">
              {t('workCompletionForm.completionDateHelp')}
            </p>
          </div>

          {/* Worker Selection */}
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="space-y-1">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {t('workCompletionForm.selectWorkers')} <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-gray-500">
                  {t('workCompletionForm.selectWorkersHelp')}
                </p>
              </div>
              
              {loadingWorkers ? (
                <div className="text-sm text-gray-500">Loading all workers...</div>
              ) : (
                <div className="space-y-2">
                  <Combobox<number>
                    options={availableWorkers.map(worker => ({
                      key: worker.userId,
                      value: worker.userId,
                      label: `${worker.userName} (${worker.teamName})${workAssignment.teamName && worker.teamName === workAssignment.teamName ? ' - ' + t('workCompletionForm.assignedTeam') : ''}`
                    }))}
                    value={selectedWorkers.map(w => w.userId)}
                    onChange={(selectedUserIds) => {
                      const userIds = Array.isArray(selectedUserIds) ? selectedUserIds : [selectedUserIds];
                      const selectedWorkers = availableWorkers.filter(worker => 
                        userIds.includes(worker.userId)
                      );
                      setSelectedWorkers(selectedWorkers);
                    }}
                    allowMultipleSelect={true}
                    searchText={t('workCompletionForm.searchWorkers')}
                    selectText={t('workCompletionForm.selectWorkers')}
                    noOptionFoundText={t('workCompletionForm.noWorkersFound')}
                    disabled={loadingWorkers}
                    className="w-full"
                  />
                  
                  {availableWorkers.length === 0 && !loadingWorkers && (
                    <div className="text-sm text-gray-500 p-3 border rounded-lg">
                      {t('workCompletionForm.noWorkersAvailable')}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Selected Workers List */}
            {selectedWorkers.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">{t('workCompletionForm.selectedWorkers', 'Selected Workers')}</h4>
                <div className="space-y-2">
                  {selectedWorkers.map((worker, index) => (
                    <div key={worker.userId || `selected-worker-${index}`} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                      <div>
                        <span className="font-medium">{worker.userName}</span>
                        <span className="text-sm text-gray-500 ml-2">({worker.teamName})</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedWorkers(prev => prev.filter(w => w.userId !== worker.userId))}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              {t('workCompletionForm.weightOfProduct')} ({t('workCompletionForm.optional')})
            </label>
            <Input
              type="number"
              step="0.001"
              value={weightOfProduct}
              onChange={(e) => setWeightOfProduct(e.target.value)}
              placeholder="0.000"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t('workCompletionForm.truckNumber')} ({t('workCompletionForm.optional')})
              </label>
              <Input
                value={truckNumber}
                onChange={(e) => setTruckNumber(e.target.value)}
                placeholder={t('workCompletionForm.truckNumberPlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t('workCompletionForm.driverName')} ({t('workCompletionForm.optional')})
              </label>
              <Input
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                placeholder={t('workCompletionForm.driverNamePlaceholder')}
              />
            </div>
          </div>

          {/* Photo Upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {t('workCompletionForm.photos')} ({t('workCompletionForm.optional')})
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                id="completion-photo-upload"
                disabled={uploading}
              />
              <label
                htmlFor="completion-photo-upload"
                className="cursor-pointer flex flex-col items-center justify-center py-4"
              >
                <Upload className="h-8 w-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-600">
                  {uploading ? t('workCompletionForm.uploading') : t('workCompletionForm.clickToUpload')}
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
                        console.error('Failed to load image:', photo?.filename);
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removePhoto(photo.id)}
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
            disabled={submitting || uploading || !completionNote.trim()}
            className="w-full"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                {t('workCompletionForm.completing')}
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                {t('workCompletionForm.completeWork')}
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default WorkCompletionForm;
