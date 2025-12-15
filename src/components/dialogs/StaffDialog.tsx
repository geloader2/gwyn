import { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Staff, StaffFormData } from '@/hooks/useStaff';
import { Camera, X } from 'lucide-react';

const staffSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address').max(255),
  phone: z.string().max(20).optional().default(''),
  title: z.string().min(1, 'Title is required').max(100),
  bio: z.string().max(500).optional().default(''),
  is_active: z.boolean().default(true),
  avatar_url: z.string().optional().default(''),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100).optional().or(z.literal('')),
});

interface StaffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff: Staff | null;
  onSubmit: (data: StaffFormData) => Promise<{ success: boolean }>;
}

export const StaffDialog = ({ open, onOpenChange, staff, onSubmit }: StaffDialogProps) => {
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEditing = !!staff;

  const form = useForm<StaffFormData>({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      title: 'Specialist',
      bio: '',
      is_active: true,
      avatar_url: '',
      password: '',
    },
  });

  useEffect(() => {
    if (staff) {
      form.reset({
        name: staff.name,
        email: staff.email,
        phone: staff.phone || '',
        title: staff.title,
        bio: staff.bio || '',
        is_active: staff.is_active,
        avatar_url: staff.avatar_url || '',
        password: '',
      });
      setPhotoPreview(staff.avatar_url || null);
    } else {
      form.reset({
        name: '',
        email: '',
        phone: '',
        title: 'Specialist',
        bio: '',
        is_active: true,
        avatar_url: '',
        password: '',
      });
      setPhotoPreview(null);
    }
  }, [staff, open]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500 * 1024) {
        alert('Image size must be less than 500KB');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setPhotoPreview(base64);
        form.setValue('avatar_url', base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setPhotoPreview(null);
    form.setValue('avatar_url', '');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (data: StaffFormData) => {
    const result = await onSubmit(data);
    if (result.success) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{staff ? 'Edit Staff Member' : 'Add New Staff Member'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Photo Upload */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-border">
                  {photoPreview ? (
                    <img 
                      src={photoPreview} 
                      alt="Staff photo" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Camera className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                {photoPreview && (
                  <button
                    type="button"
                    onClick={removePhoto}
                    className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/90"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                  id="photo-upload"
                />
                <label htmlFor="photo-upload">
                  <Button type="button" variant="outline" size="sm" asChild>
                    <span className="cursor-pointer">
                      {photoPreview ? 'Change Photo' : 'Upload Photo'}
                    </span>
                  </Button>
                </label>
                <p className="text-xs text-muted-foreground mt-1 text-center">Max 500KB</p>
              </div>
            </div>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="email@example.com" {...field} disabled={isEditing} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {!isEditing && (
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Login password" {...field} />
                    </FormControl>
                    <FormMessage />
                    <p className="text-xs text-muted-foreground">This will be their login password</p>
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="+1 (555) 000-0000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Senior Aesthetician" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Short biography..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border border-border p-3">
                  <FormLabel className="cursor-pointer">Active</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Saving...' : staff ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
