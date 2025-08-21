
"use client";

import { useEffect } from 'react';
import type { School } from '@/lib/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { addSchool, updateSchool } from '@/lib/supabase';

const schoolSchema = z.object({
    name: z.string().min(3, "School name is too short"),
});

type SchoolFormData = z.infer<typeof schoolSchema>;

interface SchoolFormProps {
  editingSchool?: School | null;
  onSchoolAction?: () => void;
  onCancelEdit?: () => void;
}

export function SchoolForm({ 
    editingSchool, 
    onSchoolAction,
    onCancelEdit
}: SchoolFormProps) {
  const { toast } = useToast();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<SchoolFormData>({
    resolver: zodResolver(schoolSchema),
  });

  useEffect(() => {
    if (editingSchool) {
      reset(editingSchool);
    } else {
      reset({ name: '' });
    }
  }, [editingSchool, reset]);

  const onSubmit = async (data: SchoolFormData) => {
    try {
      if (editingSchool) {
        await updateSchool({ ...editingSchool, ...data });
        toast({ title: 'Success', description: 'School updated successfully.' });
      } else {
        await addSchool({ ...data, enrollment: {} });
        toast({ title: 'Success', description: 'New school added.' });
      }
      
      reset({ name: '' });
      if (onSchoolAction) {
        onSchoolAction();
      }
    } catch (err: any) {
        toast({ variant: 'destructive', title: 'Error', description: err.message });
    }
  };
  
  const handleCancel = () => {
      reset({ name: '' });
      if(onCancelEdit) {
          onCancelEdit();
      }
  }

  const formContent = (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="name">School Name</Label>
        <Input id="name" {...register('name')} placeholder="e.g., Accra High School" />
        {errors.name && <p className="text-destructive text-xs mt-1">{errors.name.message}</p>}
      </div>
      <div className="flex justify-end gap-2">
        {editingSchool && (
            <Button type="button" variant="ghost" onClick={handleCancel}>Cancel Edit</Button>
        )}
        <Button type="submit" className="bg-accent hover:bg-accent/90">{editingSchool ? 'Save Changes' : 'Add School'}</Button>
      </div>
    </form>
  );

  return (
    <Card className="bg-green-100 dark:bg-green-900/50">
        <CardHeader>
            <CardTitle>{editingSchool ? 'Edit School' : 'Add New School'}</CardTitle>
            <CardDescription>{editingSchool ? `Editing: ${editingSchool.name}` : 'Create a new school record.'}</CardDescription>
        </CardHeader>
        <CardContent>
            {formContent}
        </CardContent>
    </Card>
  );
}
