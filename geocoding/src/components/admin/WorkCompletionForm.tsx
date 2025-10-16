import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
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
  Plus,
  Minus
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
    completion_note: string;
    worker_count: number;
    weight_of_product: number | null;
    truck_number: string | null;
    driver_name: string | null;
    completed_by_name: string;
    completed_at: string;
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
  hoursWorked?: number;
  hourlyRate?: number;
  totalPayment?: number;
  notes?: string;
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
      if (response.data.success) {
        const workers: Worker[] = response.data.data.map((member: any) => ({
          id: member.id,
          userId: member.userId,
          userName: member.userName,
          teamName: member.teamName,
          hoursWorked: 8, // Default 8 hours
          hourlyRate: 0,
          totalPayment: 0,
          notes: ''
        }));
        setAvailableWorkers(workers);
      }
    } catch (error) {
      console.error('Failed to load workers:', error);
      toast.error('Failed to load workers');
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

  const toggleWorkerSelection = (worker: Worker) => {
    setSelectedWorkers(prev => {
      const isSelected = prev.some(w => w.userId === worker.userId);
      if (isSelected) {
        return prev.filter(w => w.userId !== worker.userId);
      } else {
        return [...prev, { ...worker }];
      }
    });
  };

  const updateWorkerDetails = (userId: number, field: keyof Worker, value: any) => {
    setSelectedWorkers(prev => 
      prev.map(worker => {
        if (worker.userId === userId) {
          const updated = { ...worker, [field]: value };
          // Auto-calculate total payment if hours or rate changed
          if (field === 'hoursWorked' || field === 'hourlyRate') {
            const hours = field === 'hoursWorked' ? value : worker.hoursWorked || 0;
            const rate = field === 'hourlyRate' ? value : worker.hourlyRate || 0;
            updated.totalPayment = hours * rate;
          }
          return updated;
        }
        return worker;
      })
    );
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

      const completionResponse = await axiosClient.post(`/farm-works/complete/${workAssignment.id}`, completionData);
      const newCompletion = completionResponse.data.completion;

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
              <span>{completion.completed_by_name}</span>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>{t('workCompletionForm.completedAt')}</span>
              </label>
              <span>{new Date(completion.completed_at).toLocaleString()}</span>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center space-x-2">
              <MessageSquare className="h-4 w-4" />
              <span>{t('workCompletionForm.completionNote')}</span>
            </label>
            <p className="text-gray-700 whitespace-pre-wrap">{completion.completion_note}</p>
          </div>

          {completion.worker_count > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span>{t('workCompletionForm.workerCount')}</span>
              </label>
              <span>{completion.worker_count}</span>
            </div>
          )}

          {completion.weight_of_product && (
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center space-x-2">
                <Package className="h-4 w-4" />
                <span>{t('workCompletionForm.weightOfProduct')}</span>
              </label>
              <span>{completion.weight_of_product} kg</span>
            </div>
          )}

          {(completion.truck_number || completion.driver_name) && (
            <>
              <Separator />
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center space-x-2">
                  <Truck className="h-4 w-4" />
                  <span>{t('workCompletionForm.transportation')}</span>
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {completion.truck_number && (
                    <div>
                      <span className="text-sm text-gray-600">{t('workCompletionForm.truckNumber')}: </span>
                      <span>{completion.truck_number}</span>
                    </div>
                  )}
                  {completion.driver_name && (
                    <div>
                      <span className="text-sm text-gray-600">{t('workCompletionForm.driverName')}: </span>
                      <span>{completion.driver_name}</span>
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
                      src={photo.url || `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/uploads/photos/${photo.filename}`}
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
                  {availableWorkers.map((worker) => {
                    // Check if this worker belongs to the assigned team
                    const isAssignedTeam = workAssignment.teamName && worker.teamName === workAssignment.teamName;
                    return (
                      <div key={worker.userId} className={`flex items-center space-x-3 p-3 border rounded-lg ${
                        isAssignedTeam ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                      }`}>
                        <Checkbox
                          id={`worker-${worker.userId}`}
                          checked={selectedWorkers.some(w => w.userId === worker.userId)}
                          onCheckedChange={() => toggleWorkerSelection(worker)}
                        />
                        <label htmlFor={`worker-${worker.userId}`} className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{worker.userName}</span>
                            {isAssignedTeam && (
                              <Badge variant="secondary" className="text-xs">
                                {t('workCompletionForm.assignedTeam')}
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">{worker.teamName}</div>
                        </label>
                      </div>
                    );
                  })}
                  
                  {availableWorkers.length === 0 && (
                    <div className="text-sm text-gray-500 p-3 border rounded-lg">
                      No workers available
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Selected Workers Details */}
            {selectedWorkers.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Worker Details & Payment</h4>
                {selectedWorkers.map((worker) => (
                  <div key={worker.userId} className="p-4 border rounded-lg bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-medium">{worker.userName}</h5>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleWorkerSelection(worker)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-medium">Hours Worked</label>
                        <Input
                          type="number"
                          step="0.5"
                          min="0"
                          value={worker.hoursWorked || ''}
                          onChange={(e) => updateWorkerDetails(worker.userId, 'hoursWorked', parseFloat(e.target.value) || 0)}
                          placeholder="8"
                          className="h-8"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium">Hourly Rate (฿)</label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={worker.hourlyRate || ''}
                          onChange={(e) => updateWorkerDetails(worker.userId, 'hourlyRate', parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                          className="h-8"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium">Total Payment (฿)</label>
                        <Input
                          type="number"
                          step="0.01"
                          value={worker.totalPayment || 0}
                          readOnly
                          className="h-8 bg-gray-100"
                        />
                      </div>
                    </div>
                    
                    <div className="mt-2">
                      <label className="text-xs font-medium">Notes</label>
                      <Input
                        value={worker.notes || ''}
                        onChange={(e) => updateWorkerDetails(worker.userId, 'notes', e.target.value)}
                        placeholder="Additional notes..."
                        className="h-8"
                      />
                    </div>
                  </div>
                ))}
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
