import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/ui/data-table';
import { createColumns, type EmailTemplate as TableEmailTemplate } from '@/components/columnDef/emailTemplateColumns';
import { 
  Mail, 
  Plus, 
  Save,
  RefreshCw,
  AlertTriangle,
  FileText,
  Eye,
  Search,
  Trash2,
  Code,
  Send,
  Rocket,
  Globe
} from 'lucide-react';
import { useGenericCrud } from '@/hooks/useGenericCrud';
import { canManageUsers } from '@/stores/authStore';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import axiosClient from '@/api/axiosClient';

// Use the EmailTemplate type from the column definitions
type EmailTemplate = TableEmailTemplate;

interface EmailTemplateFormData {
  template_key: string;
  subject: string;
  html_content: string;
  text_content: string;
  variables: Record<string, string>;
  description: string;
  is_active: boolean;
  language_code: string;
  base_template_id?: number;
  is_base_template: boolean;
}

const EmailTemplateManagement: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState({ html_content: '', text_content: '' });
  
  // Release notification states
  const [releaseNotificationDialogOpen, setReleaseNotificationDialogOpen] = useState(false);
  const [releaseFormData, setReleaseFormData] = useState({
    version: '',
    release_notes: '',
    release_date: new Date().toISOString().split('T')[0], // Today's date
    release_type: 'minor',
    language: i18n.language || 'en' // Default to current language or English
  });
  const [sendingNotification, setSendingNotification] = useState(false);

  const { 
    data: templates, 
    loading: templatesLoading, 
    error: templatesError,
    createItem: createTemplate,
    updateItem: updateTemplate,
    deleteItem: deleteTemplate,
    fetchData: refreshTemplates
  } = useGenericCrud<EmailTemplate>('email-templates');

  const [formData, setFormData] = useState<EmailTemplateFormData>({
    template_key: '',
    subject: '',
    html_content: '',
    text_content: '',
    variables: {},
    description: '',
    is_active: true,
    language_code: 'en',
    base_template_id: undefined,
    is_base_template: false
  });

  // Filter templates based on search term
  const filteredTemplates = templates?.filter(template => {
    if (!template || !template.template_key || !template.subject) {
      return false;
    }
    
    const searchLower = searchTerm.toLowerCase();
    return (
      template.template_key.toLowerCase().includes(searchLower) ||
      template.subject.toLowerCase().includes(searchLower) ||
      (template.description && typeof template.description === 'string' && 
       template.description.toLowerCase().includes(searchLower))
    );
  }) || [];

  const handleFormSubmit = async () => {
    try {
      if (isEditing && selectedTemplate) {
        await updateTemplate(selectedTemplate.id, formData);
        toast.success('Email template updated successfully');
      } else if (isCopying) {
        await createTemplate(formData as Omit<EmailTemplate, 'id'>);
        toast.success('Email template copied successfully');
      } else {
        await createTemplate(formData as Omit<EmailTemplate, 'id'>);
        toast.success('Email template created successfully');
      }
      
      // Refresh the templates list to ensure UI is up to date
      await refreshTemplates();
      
      setIsFormOpen(false);
      setSelectedTemplate(null);
      setIsEditing(false);
      setIsCopying(false);
      resetForm();
    } catch (error: any) {
      toast.error('Failed to save email template');
      console.error('Error saving template:', error);
    }
  };

  const handleEdit = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      template_key: template.template_key,
      subject: template.subject,
      html_content: template.html_content,
      text_content: template.text_content,
      variables: template.variables || {},
      description: template.description || '',
      is_active: template.is_active,
      language_code: template.language_code,
      base_template_id: template.base_template_id,
      is_base_template: template.is_base_template
    });
    setIsEditing(true);
    setIsFormOpen(true);
  };

  const handleCopy = (template: EmailTemplate) => {
    // Generate unique template key by checking for existing copies
    let copyKey = `${template.template_key}_copy`;
    let copyNumber = 1;
    
    while (templates?.some(t => t.template_key === copyKey && t.language_code === template.language_code)) {
      copyNumber++;
      copyKey = `${template.template_key}_copy_${copyNumber}`;
    }

    // Reset selected template and form data for new template
    setSelectedTemplate(template);
    setFormData({
      template_key: copyKey,
      subject: `Copy of ${template.subject}`,
      html_content: template.html_content,
      text_content: template.text_content,
      variables: template.variables || {},
      description: `Copy of ${template.description || template.template_key} template`,
      is_active: template.is_active,
      language_code: template.language_code,
      base_template_id: template.base_template_id,
      is_base_template: false // Always make copies non-base templates
    });
    setIsEditing(false);
    setIsCopying(true);
    setIsFormOpen(true);
  };

  const handleDelete = async (template: EmailTemplate) => {
    if (window.confirm(`Are you sure you want to delete the template "${template.template_key}"?`)) {
      try {
        await deleteTemplate(template.id);
        toast.success('Email template deleted successfully');
        // Refresh the templates list to ensure UI is up to date
        await refreshTemplates();
      } catch (error: any) {
        toast.error('Failed to delete email template');
        console.error('Error deleting template:', error);
      }
    }
  };

  const handlePreview = async (template: EmailTemplate) => {
    try {
      console.log('Previewing template:', template.id);
      const response = await axiosClient.post(`/email-templates/preview/${template.id}`, {
        sample_data: {
          user_name: 'John Doe',
          setup_url: 'https://example.com/setup-password?token=sample123',
          reset_url: 'https://example.com/reset-password?token=sample123'
        }
      });

      console.log('Preview response:', response.data);
      setPreviewContent(response.data);
      setPreviewDialogOpen(true);
    } catch (error: any) {
      console.error('Preview error details:', error);
      toast.error('Failed to preview template: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleSendReleaseNotification = async () => {
    if (!releaseFormData.version || !releaseFormData.release_notes) {
      toast.error('Please fill in version and release notes');
      return;
    }

    setSendingNotification(true);
    try {
      const response = await axiosClient.post('/notifications/release', releaseFormData);

      if (response.data.success) {
        toast.success(`Release notification sent successfully to ${response.data.summary.successful_sends} admin users in ${releaseFormData.language.toUpperCase()}`);
        setReleaseNotificationDialogOpen(false);
        setReleaseFormData({
          version: '',
          release_notes: '',
          release_date: new Date().toISOString().split('T')[0],
          release_type: 'minor',
          language: i18n.language || 'en' // Reset to current language or English
        });
      } else {
        toast.error('Failed to send release notification');
      }
    } catch (error: any) {
      console.error('Send release notification error:', error);
      toast.error(error.response?.data?.error || 'Failed to send release notification');
    } finally {
      setSendingNotification(false);
    }
  };

  const resetForm = () => {
    setFormData({
      template_key: '',
      subject: '',
      html_content: '',
      text_content: '',
      variables: {},
      description: '',
      is_active: true,
      language_code: 'en',
      base_template_id: undefined,
      is_base_template: false
    });
  };

  const addVariable = () => {
    const key = prompt('Enter variable key (e.g., user_name):');
    const variableDescription = prompt('Enter variable description:');
    
    if (key && variableDescription) {
      setFormData(prev => ({
        ...prev,
        variables: {
          ...prev.variables,
          [key]: variableDescription
        }
      }));
    }
  };

  const removeVariable = (key: string) => {
    setFormData(prev => ({
      ...prev,
      variables: Object.fromEntries(
        Object.entries(prev.variables).filter(([k]) => k !== key)
      )
    }));
  };




  if (!canManageUsers()) {
    return (
      <div className="flex items-center justify-center h-64">
        <Alert className="w-auto">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to manage email templates.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Email Template Management</h2>
          <p className="text-muted-foreground">
            Manage email templates for password setup, reset, and other notifications.
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Template
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={refreshTemplates}
              disabled={templatesLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${templatesLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Templates Data Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('emailTemplates.title')}</CardTitle>
              <CardDescription>
                {t('emailTemplates.description')}
              </CardDescription>
            </div>
            <Button 
              onClick={() => setReleaseNotificationDialogOpen(true)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Rocket className="h-4 w-4" />
              Send Release Notification
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {templatesLoading ? (
            <div className="flex items-center justify-center h-32">
              <RefreshCw className="h-6 w-6 animate-spin" />
              <span className="ml-2">{t('emailTemplates.loading')}</span>
            </div>
          ) : templatesError ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Failed to load email templates: {templatesError.message || 'Unknown error occurred'}
              </AlertDescription>
            </Alert>
          ) : filteredTemplates.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <Mail className="h-8 w-8 text-gray-400 mb-2" />
              <p className="text-gray-500">{t('emailTemplates.noTemplates')}</p>
              <p className="text-sm text-gray-400">{t('emailTemplates.createFirstTemplate')}</p>
            </div>
          ) : (
            <DataTable 
              columns={createColumns({
                onPreview: handlePreview,
                onEdit: handleEdit,
                onCopy: handleCopy,
                onDelete: handleDelete,
                t: t,
              })} 
              data={filteredTemplates} 
            />
          )}
        </CardContent>
      </Card>

      {/* Template Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? t('emailTemplates.editTemplate') : isCopying ? t('emailTemplates.copyTemplate') : t('emailTemplates.createTemplate')}
            </DialogTitle>
            <DialogDescription>
              {isEditing 
                ? t('emailTemplates.editDescription')
                : isCopying 
                  ? t('emailTemplates.copyDescription')
                  : t('emailTemplates.createDescription')
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="template_key">{t('emailTemplates.templateKey')} *</Label>
                <Input
                  id="template_key"
                  value={formData.template_key}
                  onChange={(e) => setFormData(prev => ({ ...prev, template_key: e.target.value }))}
                  placeholder="e.g., password_setup, password_reset"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="language_code">Language</Label>
                <Select 
                  value={formData.language_code} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, language_code: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="th">Thai</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">{t('emailTemplates.subject')} *</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Email subject line"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of this template"
              />
            </div>

            {/* Variables */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Template Variables</Label>
                <Button type="button" variant="outline" size="sm" onClick={addVariable}>
                  <Plus className="h-3 w-3 mr-1" />
                  Add Variable
                </Button>
              </div>
              
              {Object.keys(formData.variables).length > 0 ? (
                <div className="space-y-2">
                      {Object.entries(formData.variables).map(([key, description]) => (
                    <div key={key} className="flex items-center gap-2 p-2 border rounded">
                      <Badge variant="outline">{`{{${key}}}`}</Badge>
                      <span className="flex-1 text-sm text-gray-600">{description}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeVariable(key)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No variables defined. Click "Add Variable" to add template variables.</p>
              )}
            </div>

            {/* Content Tabs */}
            <Tabs defaultValue="html" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="html" className="flex items-center gap-2">
                  <Code className="h-3 w-3" />
                  {t('emailTemplates.htmlContent')}
                </TabsTrigger>
                <TabsTrigger value="preview" className="flex items-center gap-2">
                  <Eye className="h-3 w-3" />
                  Live Preview
                </TabsTrigger>
                <TabsTrigger value="text" className="flex items-center gap-2">
                  <FileText className="h-3 w-3" />
                  Text Content
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="html" className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="html_content">{t('emailTemplates.htmlContent')} *</Label>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const template = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Template</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #7c3aed; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome!</h1>
        </div>
        <div class="content">
            <h2>Hello {{user_name}},</h2>
            <p>Your message content goes here.</p>
            <div style="text-align: center;">
                <a href="{{action_url}}" class="button">Take Action</a>
            </div>
        </div>
        <div class="footer">
            <p>This email was sent from our system.</p>
        </div>
    </div>
</body>
</html>`;
                        setFormData(prev => ({ ...prev, html_content: template }));
                      }}
                      className="h-8 px-2 text-xs"
                      title="Insert Template"
                    >
                      Template
                    </Button>
                  </div>
                </div>
                <Textarea
                  id="html_content"
                  value={formData.html_content}
                  onChange={(e) => setFormData(prev => ({ ...prev, html_content: e.target.value }))}
                  placeholder="HTML email template content..."
                  rows={15}
                  className="font-mono text-sm"
                />
                <div className="text-xs text-gray-500">
                  <p><strong>Tips:</strong></p>
                  <ul className="list-disc list-inside space-y-1 mt-1">
                    <li>Use <code className="bg-gray-100 px-1 rounded">{'{{variable_name}}'}</code> for dynamic content</li>
                    <li>Common tags: <code className="bg-gray-100 px-1 rounded">&lt;p&gt;</code>, <code className="bg-gray-100 px-1 rounded">&lt;h1&gt;</code>, <code className="bg-gray-100 px-1 rounded">&lt;div&gt;</code>, <code className="bg-gray-100 px-1 rounded">&lt;span&gt;</code></li>
                    <li>Click "Template" button to insert a starter template</li>
                  </ul>
                </div>
              </TabsContent>

              <TabsContent value="preview" className="space-y-2">
                <Label>Live Preview</Label>
                <div className="border rounded p-4 bg-gray-50 max-h-96 overflow-y-auto">
                  <div 
                    className="bg-white p-6 rounded shadow-sm min-h-[200px]"
                    dangerouslySetInnerHTML={{ 
                      __html: formData.html_content || '<p class="text-gray-500 italic">Enter HTML content to see preview...</p>' 
                    }}
                  />
                </div>
                <div className="text-xs text-gray-500">
                  <p>This preview shows how your HTML will look. Variables like <code className="bg-gray-100 px-1 rounded">{'{{user_name}}'}</code> will be replaced with actual values when emails are sent.</p>
                </div>
              </TabsContent>
              
              <TabsContent value="text" className="space-y-2">
                <Label htmlFor="text_content">Text Content *</Label>
                <Textarea
                  id="text_content"
                  value={formData.text_content}
                  onChange={(e) => setFormData(prev => ({ ...prev, text_content: e.target.value }))}
                  placeholder="Plain text email template content..."
                  rows={12}
                  className="font-mono text-sm"
                />
              </TabsContent>
            </Tabs>

            {/* Settings */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_base_template"
                  checked={formData.is_base_template}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_base_template: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="is_base_template">Base Template</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>
              {t('emailTemplates.cancel')}
            </Button>
            <Button onClick={handleFormSubmit} className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              {isEditing ? t('emailTemplates.update') : isCopying ? t('emailTemplates.create') : t('emailTemplates.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Email Template Preview</DialogTitle>
            <DialogDescription>
              Preview how the email template will look with sample data.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Tabs defaultValue="html" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="html">HTML Preview</TabsTrigger>
                <TabsTrigger value="text">Text Preview</TabsTrigger>
              </TabsList>
              
              <TabsContent value="html" className="space-y-4">
                <div className="border rounded bg-gray-50 max-h-[60vh] overflow-y-auto">
                  <div className="p-4">
                    <div 
                      className="bg-white p-6 rounded shadow-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: previewContent.html_content }}
                    />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="text" className="space-y-4">
                <div className="border rounded bg-gray-50 max-h-[60vh] overflow-y-auto">
                  <div className="p-4">
                    <pre className="whitespace-pre-wrap text-sm bg-white p-6 rounded shadow-sm max-w-none">
                      {previewContent.text_content}
                    </pre>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Release Notification Dialog */}
      <Dialog open={releaseNotificationDialogOpen} onOpenChange={setReleaseNotificationDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Rocket className="h-5 w-5" />
              Send Release Notification
            </DialogTitle>
            <DialogDescription>
              Send a release notification email to all admin users using the release notification template.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="version">Version *</Label>
                <Input
                  id="version"
                  value={releaseFormData.version}
                  onChange={(e) => setReleaseFormData(prev => ({ ...prev, version: e.target.value }))}
                  placeholder="e.g., 1.2.0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="release_type">Release Type</Label>
                <Select 
                  value={releaseFormData.release_type} 
                  onValueChange={(value) => setReleaseFormData(prev => ({ ...prev, release_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="major">Major</SelectItem>
                    <SelectItem value="minor">Minor</SelectItem>
                    <SelectItem value="patch">Patch</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="language" className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Language
                </Label>
                <Select 
                  value={releaseFormData.language} 
                  onValueChange={(value) => setReleaseFormData(prev => ({ ...prev, language: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="th">ไทย (Thai)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="release_date">Release Date</Label>
              <Input
                id="release_date"
                type="date"
                value={releaseFormData.release_date}
                onChange={(e) => setReleaseFormData(prev => ({ ...prev, release_date: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="release_notes">Release Notes *</Label>
              <Textarea
                id="release_notes"
                value={releaseFormData.release_notes}
                onChange={(e) => setReleaseFormData(prev => ({ ...prev, release_notes: e.target.value }))}
                placeholder="Describe what's new in this release..."
                rows={4}
                className="resize-none overflow-y-auto"
                style={{ maxHeight: '120px' }}
              />
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This will send the release notification to all users with admin or system roles. 
                Make sure the release notification email template exists and is active.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setReleaseNotificationDialogOpen(false)}
              disabled={sendingNotification}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSendReleaseNotification}
              disabled={sendingNotification || !releaseFormData.version || !releaseFormData.release_notes}
            >
              {sendingNotification ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Notification
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmailTemplateManagement;
