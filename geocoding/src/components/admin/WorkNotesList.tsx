import React, { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useTranslation } from 'react-i18next';
import axiosClient from '@/api/axiosClient';
import { toast } from 'sonner';
import { 
  MessageSquare, 
  Camera,
  Edit,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  Search
} from 'lucide-react';
import { Input } from '@/components/ui/input';
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

interface WorkNotesListProps {
  notes: WorkNote[];
  workId?: number;
  onNotesUpdated: () => void;
  onEditNote?: (note: WorkNote) => void;
}

const WorkNotesList: React.FC<WorkNotesListProps> = ({
  notes,
  workId: _workId,
  onNotesUpdated,
  onEditNote,
}) => {
  const { t } = useTranslation();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<WorkNote | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedNote, setSelectedNote] = useState<WorkNote | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const getInitials = (name: string | undefined | null) => {
    if (!name || typeof name !== 'string') {
      return 'U'; // Default to 'U' for User
    }
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  const handleDeleteClick = (note: WorkNote) => {
    setNoteToDelete(note);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!noteToDelete) return;

    setDeleting(true);
    try {
      await axiosClient.delete(`/work-notes/${noteToDelete.id}`);
      toast.success(t('workNotesList.noteDeleted'));
      onNotesUpdated();
      setDeleteDialogOpen(false);
      setNoteToDelete(null);
    } catch (error) {
      console.error('Failed to delete note:', error);
      toast.error(t('workNotesList.deleteFailed'));
    } finally {
      setDeleting(false);
    }
  };

  // const _truncateText = (text: string, maxLength: number = 100) => {
  //   if (text.length <= maxLength) return text;
  //   return text.substring(0, maxLength) + '...';
  // };

  // Filter and pagination logic
  const filteredNotes = useMemo(() => {
    if (!searchTerm.trim()) return notes;
    
    const term = searchTerm.toLowerCase();
    return notes.filter(note => 
      note.title.toLowerCase().includes(term) ||
      note.content.toLowerCase().includes(term) ||
      note.created_by_name?.toLowerCase().includes(term) ||
      note.priority_level.toLowerCase().includes(term)
    );
  }, [notes, searchTerm]);

  const totalPages = Math.ceil(filteredNotes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentNotes = useMemo(() => {
    return filteredNotes.slice(startIndex, endIndex);
  }, [filteredNotes, startIndex, endIndex]);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  if (notes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 border rounded-lg">
        <MessageSquare className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {t('workNotesList.noNotes')}
        </h3>
        <p className="text-gray-500 text-center">
          {t('workNotesList.noNotesDescription')}
        </p>
      </div>
    );
  }

  if (filteredNotes.length === 0 && searchTerm) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center space-x-2">
            <MessageSquare className="h-5 w-5" />
            <span>{t('workNotesList.workNotes')}</span>
            <Badge variant="secondary">0</Badge>
          </h3>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search notes by title, content, author, or priority..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-10"
          />
        </div>

        <div className="flex flex-col items-center justify-center py-8 border rounded-lg">
          <Search className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No notes found
          </h3>
          <p className="text-gray-500 text-center">
            No notes match your search for "{searchTerm}". Try a different search term.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center space-x-2">
          <MessageSquare className="h-5 w-5" />
          <span>{t('workNotesList.workNotes')}</span>
          <Badge variant="secondary">{filteredNotes.length}</Badge>
        </h3>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search notes by title, content, author, or priority..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1); // Reset to first page when searching
          }}
          className="pl-10"
        />
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <Table className="min-w-[500px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[45%] min-w-[180px]">{t('workNotesList.title')}</TableHead>
              <TableHead className="w-[12%] min-w-[80px]">{t('workNotesList.author')}</TableHead>
              <TableHead className="w-[10%] min-w-[70px]">{t('workNotesList.priority')}</TableHead>
              <TableHead className="w-[15%] min-w-[90px]">{t('workNotesList.created')}</TableHead>
              <TableHead className="w-[8%] min-w-[50px]">{t('workNotesList.photos')}</TableHead>
              <TableHead className="w-[10%] min-w-[80px] text-right">{t('workNotesList.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentNotes.map((note) => {
              const { date, time } = formatDate(note.created_at);
              
              return (
                <TableRow key={note.id}>
                  <TableCell className="max-w-0">
                    <div 
                      className="font-medium text-gray-900 leading-tight cursor-help"
                      title={`${note.title}\n\nContent: ${note.content}`}
                    >
                      {note.title}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div 
                      className="h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium mx-auto"
                      title={note.created_by_name || 'Unknown User'}
                    >
                      {getInitials(note.created_by_name)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getPriorityColor(note.priority_level)} className="text-xs px-1.5 py-0.5">
                      {t(`workNotesList.priorityLevels.${note.priority_level}`)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div 
                      className="text-sm font-medium"
                      title={`${date} at ${time}`}
                    >
                      {date}
                    </div>
                  </TableCell>
                  <TableCell>
                    {note.photos && note.photos.length > 0 ? (
                      <div 
                        className="flex items-center justify-center"
                        title={`${note.photos.length} photo${note.photos.length > 1 ? 's' : ''}`}
                      >
                        <Camera className="h-4 w-4 text-gray-500" />
                        <span className="text-sm ml-1">{note.photos.length}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-0.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          // Show note details in a modal or expand inline
                          setSelectedNote(note);
                        }}
                        className="text-gray-500 hover:text-gray-700 h-7 w-7 p-0"
                        title="View note details"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          // Trigger edit functionality
                          onEditNote?.(note);
                        }}
                        className="text-gray-500 hover:text-gray-700 h-7 w-7 p-0"
                        title="Edit note"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(note)}
                        className="text-red-500 hover:text-red-700 h-7 w-7 p-0"
                        title="Delete note"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2 py-3">
          <div className="text-sm text-gray-500">
            Showing {startIndex + 1} to {Math.min(endIndex, filteredNotes.length)} of {filteredNotes.length} notes
            {searchTerm && ` (filtered from ${notes.length} total)`}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => goToPage(pageNum)}
                    className="h-8 w-8 p-0 text-xs"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('workNotesList.deleteNote')}</DialogTitle>
            <DialogDescription>
              {t('workNotesList.deleteConfirmation', { title: noteToDelete?.title })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleting}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleting}
            >
              {deleting ? t('workNotesList.deleting') : t('workNotesList.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Note Modal */}
      <Dialog open={!!selectedNote} onOpenChange={() => setSelectedNote(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedNote?.title}</DialogTitle>
            <DialogDescription>
              {t('workNotesList.viewNoteDescription')}
            </DialogDescription>
          </DialogHeader>
          
          {selectedNote && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                    {getInitials(selectedNote.created_by_name)}
                  </div>
                  <div>
                    <div className="font-medium">{selectedNote.created_by_name}</div>
                    <div className="text-sm text-gray-500">
                      {formatDate(selectedNote.created_at).date} at {formatDate(selectedNote.created_at).time}
                    </div>
                  </div>
                </div>
                <Badge variant={getPriorityColor(selectedNote.priority_level)}>
                  {t(`workNotesList.priorityLevels.${selectedNote.priority_level}`)}
                </Badge>
              </div>
              
              <div className="border-t pt-4">
                <div className="prose max-w-none">
                  <p className="whitespace-pre-wrap">{selectedNote.content}</p>
                </div>
              </div>

              {selectedNote.photos && selectedNote.photos.length > 0 && (
                <WorkNotePhotoCarousel photos={selectedNote.photos} />
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedNote(null)}>
              {t('common.close')}
            </Button>
            {onEditNote && (
              <Button onClick={() => {
                onEditNote(selectedNote!);
                setSelectedNote(null);
              }}>
                {t('common.edit')}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WorkNotesList;
