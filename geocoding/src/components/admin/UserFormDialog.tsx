import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import axiosClient from '@/api/axiosClient';
import { User, Mail, Phone, Shield, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    role: 'admin' | 'contributor' | 'user' | 'team_lead';
  } | null;
  isEditing: boolean;
  onUserSaved: () => void;
}

const UserFormDialog: React.FC<UserFormDialogProps> = ({
  open,
  onOpenChange,
  user,
  isEditing,
  onUserSaved,
}) => {
  const { t } = useTranslation();
  
  const userSchema = z.object({
    first_name: z.string().min(1, t('createUser.firstNameRequired')),
    last_name: z.string().min(1, t('createUser.lastNameRequired')),
    email: z.string().email(t('createUser.invalidEmailAddress')),
    phone: z.string().min(1, t('createUser.phoneNumberRequired')),
    role: z.enum(['admin', 'contributor', 'user', 'team_lead'], {
      message: t('createUser.pleaseSelectRole'),
    }),
  });

  type UserFormData = z.infer<typeof userSchema>;
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = React.useState<string | null>(null);
  const form = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      role: user?.role || 'user',
    },
  });

  // Update form values when user prop changes
  React.useEffect(() => {
    if (user) {
      form.reset({
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      });
    } else {
      form.reset({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        role: 'user',
      });
    }
    // Clear any previous error/success messages when dialog opens
    setSubmitError(null);
    setSubmitSuccess(null);
  }, [user, form, open]);

  const onSubmit = async (values: UserFormData) => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);
      setSubmitSuccess(null);
      
      // Convert snake_case to camelCase for API
      const apiData = {
        firstName: values.first_name,
        lastName: values.last_name,
        email: values.email,
        phone: values.phone,
        role: values.role,
      };
      
      if (isEditing && user) {
        // Update existing user
        await axiosClient.put(`/users/${user.id}`, apiData);
        toast.success('User updated successfully!', {
          description: `${values.first_name} ${values.last_name} has been updated.`,
        });
        setSubmitSuccess('User updated successfully!');
      } else {
        // Create new user
        const response = await axiosClient.post('/users', apiData);
        const responseData = response.data;
        
        if (responseData.email_sent) {
          toast.success('User created successfully!', {
            description: `${values.first_name} ${values.last_name} has been added. Password setup email sent!`,
          });
          setSubmitSuccess('User created successfully! Password setup email has been sent.');
        } else {
          toast.warning('User created with warning', {
            description: `${values.first_name} ${values.last_name} was created, but email could not be sent.`,
          });
          setSubmitSuccess(responseData.warning || 'User created but email could not be sent.');
        }
      }
      
      // Close dialog after a short delay to show success message
      setTimeout(() => {
        onUserSaved();
        onOpenChange(false);
      }, 1000);
      
    } catch (error: any) {
      console.error('Failed to save user:', error);
      
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          t('createUser.failedToSaveUser');
      
      setSubmitError(errorMessage);
      
      toast.error(t('createUser.failedToSaveUser'), {
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'admin':
        return t('createUser.fullSystemAccess');
      case 'team_lead':
        return t('createUser.canManageTeams');
      case 'contributor':
        return t('createUser.canCreateAndManageLands');
      case 'user':
        return t('createUser.canViewLandsAndCreateNotifications');
      default:
        return '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>{isEditing ? t('createUser.editUser') : t('createUser.createNewUser')}</span>
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? t('createUser.editUserDescription')
              : t('createUser.createUserDescription')
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Success Message */}
            {submitSuccess && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  {submitSuccess}
                </AlertDescription>
              </Alert>
            )}

            {/* Error Message */}
            {submitError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {submitError}
                </AlertDescription>
              </Alert>
            )}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span>{t('createUser.firstName')}</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder={t('createUser.enterFirstName')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('createUser.lastName')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('createUser.enterLastName')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center space-x-2">
                    <Mail className="h-4 w-4" />
                    <span>{t('createUser.email')}</span>
                  </FormLabel>
                  <FormControl>
                    <Input 
                      type="email" 
                      placeholder={t('createUser.enterEmailAddress')} 
                      {...field} 
                      disabled={isEditing} // Don't allow email changes for existing users
                    />
                  </FormControl>
                  <FormMessage />
                  {isEditing && (
                    <p className="text-xs text-gray-500">
                      {t('createUser.emailCannotBeChanged')}
                    </p>
                  )}
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center space-x-2">
                    <Phone className="h-4 w-4" />
                    <span>{t('createUser.phone')}</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder={t('createUser.enterPhoneNumber')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('createUser.role')}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('createUser.selectRole')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="user">
                        <div className="flex flex-col">
                          <span>{t('createUser.user')}</span>
                          <span className="text-xs text-gray-500">
                            {t('createUser.userDescription')}
                          </span>
                        </div>
                      </SelectItem>
                      <SelectItem value="contributor">
                        <div className="flex flex-col">
                          <span>{t('createUser.contributor')}</span>
                          <span className="text-xs text-gray-500">
                            {t('createUser.contributorDescription')}
                          </span>
                        </div>
                      </SelectItem>
                      <SelectItem value="team_lead">
                        <div className="flex flex-col">
                          <span>{t('createUser.teamLead')}</span>
                          <span className="text-xs text-gray-500">
                            {t('createUser.teamLeadDescription')}
                          </span>
                        </div>
                      </SelectItem>
                      <SelectItem value="admin">
                        <div className="flex flex-col">
                          <span>{t('createUser.admin')}</span>
                          <span className="text-xs text-gray-500">
                            {t('createUser.adminDescription')}
                          </span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                  <p className="text-xs text-gray-500">
                    {getRoleDescription(field.value)}
                  </p>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                {t('createUser.cancel')}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {isEditing ? t('createUser.updating') : t('createUser.creating')}
                  </>
                ) : (
                  isEditing ? t('createUser.updateUser') : t('createUser.createUser')
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default UserFormDialog;
