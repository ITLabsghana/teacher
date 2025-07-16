"use client";

import { useEffect } from 'react';
import type { School } from '@/lib/types';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const schoolCategories: School['category'][] = ['KG1', 'KG2', 'Basic 1-6', 'J.H.S 1-3', 'S.H.S 1-3'];

const schoolSchema = z.object({
    name: z.string().min(3, "School name is too short"),
    category: z.enum(schoolCategories, { required_error: "Category is required" }),
});

type SchoolFormData = z.infer<typeof schoolSchema>;

interface SchoolFormProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  editingSchool: School | null;
  setSchools: React.Dispatch<React.SetStateAction<School[]>>;
}

export function SchoolForm({ isOpen, setIsOpen, editingSchool, setSchools }: SchoolFormProps) {
  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<SchoolFormData>({
    resolver: zodResolver(schoolSchema),
  });

  useEffect(() => {
    if (isOpen) {
      if (editingSchool) {
        reset(editingSchool);
      } else {
        reset({ name: '', category: undefined });
      }
    }
  }, [editingSchool, isOpen, reset]);

  const onSubmit = (data: SchoolFormData) => {
    if (editingSchool) {
      setSchools(prev => prev.map(s => s.id === editingSchool.id ? { ...s, ...data } : s));
    } else {
      setSchools(prev => [...prev, { ...data, id: crypto.randomUUID() }]);
    }
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{editingSchool ? 'Edit School' : 'Add New School'}</DialogTitle>
          <DialogDescription>
            {editingSchool ? "Update the school's details." : "Fill in the details for the new school."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <div>
            <Label htmlFor="name">School Name</Label>
            <Input id="name" {...register('name')} placeholder="e.g., Accra High School" />
            {errors.name && <p className="text-destructive text-xs mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <Label>Category</Label>
            <Controller
              control={control}
              name="category"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {schoolCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.category && <p className="text-destructive text-xs mt-1">{errors.category.message}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button type="submit" className="bg-accent hover:bg-accent/90">{editingSchool ? 'Save Changes' : 'Add School'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}