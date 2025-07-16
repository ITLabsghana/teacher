"use client";

import { useEffect, useState } from 'react';
import type { School } from '@/lib/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

const schoolSchema = z.object({
    name: z.string().min(3, "School name is too short"),
});

type SchoolFormData = z.infer<typeof schoolSchema>;

interface SchoolFormProps {
  // Props for when used as a dialog
  isOpen?: boolean;
  setIsOpen?: (isOpen: boolean) => void;
  editingSchool?: School | null;
  isDialog?: boolean;

  // Props for when used as a tab
  setSchools: React.Dispatch<React.SetStateAction<School[]>>;
  onSchoolAdded?: () => void;
}

export function SchoolForm({ 
    isOpen, 
    setIsOpen, 
    editingSchool, 
    setSchools, 
    onSchoolAdded,
    isDialog = false
}: SchoolFormProps) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<SchoolFormData>({
    resolver: zodResolver(schoolSchema),
  });

  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    if (isOpen) {
      if (editingSchool) {
        reset(editingSchool);
      } else {
        reset({ name: '' });
      }
    }
  }, [editingSchool, isOpen, reset]);

  const onSubmit = (data: SchoolFormData) => {
    if (editingSchool) {
      setSchools(prev => prev.map(s => s.id === editingSchool.id ? { ...s, ...data } : s));
    } else {
      setSchools(prev => [...prev, { ...data, id: crypto.randomUUID(), enrollment: {} }]);
    }
    
    if (isDialog && setIsOpen) {
      setIsOpen(false);
    } else {
      reset({ name: '' });
      setFormKey(prev => prev + 1); // Remount the form
      if (onSchoolAdded) {
          onSchoolAdded();
      }
    }
  };

  const formContent = (
    <form key={formKey} onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="name">School Name</Label>
        <Input id="name" {...register('name')} placeholder="e.g., Accra High School" />
        {errors.name && <p className="text-destructive text-xs mt-1">{errors.name.message}</p>}
      </div>
      <div className={isDialog ? "" : "flex justify-end"}>
        {isDialog ? (
             <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setIsOpen && setIsOpen(false)}>Cancel</Button>
                <Button type="submit" className="bg-accent hover:bg-accent/90">{editingSchool ? 'Save Changes' : 'Add School'}</Button>
            </DialogFooter>
        ) : (
            <Button type="submit" className="bg-accent hover:bg-accent/90">{editingSchool ? 'Save Changes' : 'Add School'}</Button>
        )}
      </div>
    </form>
  );

  if (isDialog) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingSchool ? 'Edit School' : 'Add New School'}</DialogTitle>
            <DialogDescription>
              {editingSchool ? "Update the school's details." : "Fill in the details for the new school."}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {formContent}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Card>
        <CardContent className="pt-6">
            {formContent}
        </CardContent>
    </Card>
  );
}
