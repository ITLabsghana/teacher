"use client";

import { useState } from 'react';
import type { School } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { X, PlusCircle, Download, Upload } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const schoolCategories: School['category'][] = ['KG1', 'KG2', 'Basic 1-6', 'J.H.S 1-3', 'S.H.S 1-3'];

const schoolSchema = z.object({
    name: z.string().min(3, "School name is too short"),
    category: z.enum(schoolCategories, { required_error: "Category is required" }),
});

interface SchoolsTabProps {
  schools: School[];
  setSchools: React.Dispatch<React.SetStateAction<School[]>>;
}

export default function SchoolsTab({ schools, setSchools }: SchoolsTabProps) {
  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<z.infer<typeof schoolSchema>>({
    resolver: zodResolver(schoolSchema),
    defaultValues: { name: '', category: undefined }
  });

  const onSubmit = (data: z.infer<typeof schoolSchema>) => {
    setSchools(prev => [...prev, { ...data, id: crypto.randomUUID() }]);
    reset();
  };
  
  const handleDelete = (schoolId: string) => {
    setSchools(schools.filter(s => s.id !== schoolId));
  };

  return (
    <Card>
        <CardHeader>
            <div className="flex justify-between items-start">
                <div>
                    <CardTitle>School Management</CardTitle>
                    <CardDescription>Add, categorize, and manage schools.</CardDescription>
                </div>
                 <div className="flex gap-2">
                    <Button variant="outline" size="sm"><Upload className="mr-2 h-4 w-4" /> Import</Button>
                    <Button variant="outline" size="sm"><Download className="mr-2 h-4 w-4" /> Export</Button>
                </div>
            </div>
        </CardHeader>
        <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="flex items-end gap-2 mb-6">
                <div className="grid gap-1.5 flex-grow">
                    <Label htmlFor="name">School Name</Label>
                    <Input id="name" {...register('name')} placeholder="e.g., Accra High School" />
                    {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
                </div>
                <div className="grid gap-1.5">
                    <Label>Category</Label>
                    <Controller
                        control={control}
                        name="category"
                        render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Select Category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {schoolCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        )}
                    />
                    {errors.category && <p className="text-destructive text-xs">{errors.category.message}</p>}
                </div>
                <Button type="submit" size="sm" className="h-10"><PlusCircle className="mr-2 h-4 w-4" /> Add School</Button>
            </form>

            <h3 className="text-lg font-medium mb-4">Existing Schools</h3>
            <div className="space-y-2">
                {schools.length > 0 ? schools.map(school => (
                    <div key={school.id} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                        <div>
                            <p className="font-semibold">{school.name}</p>
                            <p className="text-sm text-muted-foreground">{school.category}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => handleDelete(school.id)}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                )) : (
                    <div className="text-center text-muted-foreground py-8">
                        No schools added yet.
                    </div>
                )}
            </div>
        </CardContent>
    </Card>
  );
}
