
"use client";

import { useState } from 'react';
import type { School } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, PlusCircle, Edit, Trash2 } from 'lucide-react';
import { SchoolForm } from './school-form';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useRouter } from 'next/navigation';

interface SchoolsTabProps {
  schools: School[];
  setSchools: React.Dispatch<React.SetStateAction<School[]>>;
}

function SchoolManagement({ schools, setSchools }: SchoolsTabProps) {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingSchool, setEditingSchool] = useState<School | null>(null);
    const router = useRouter();

    const handleAdd = () => {
        setEditingSchool(null);
        setIsFormOpen(true);
    };

    const handleEdit = (school: School) => {
        setEditingSchool(school);
        setIsFormOpen(true);
    };

    const handleDelete = (schoolId: string) => {
        setSchools(schools.filter(s => s.id !== schoolId));
    };

    const handleRowClick = (schoolId: string) => {
        router.push(`/dashboard/schools/${schoolId}`);
    };

    return (
        <>
            <div className="flex justify-end mb-4">
                <div className="flex gap-2">
                    <Button size="sm" onClick={handleAdd}><PlusCircle className="mr-2 h-4 w-4" /> Add School</Button>
                </div>
            </div>
            <div className="space-y-2">
                {schools.length > 0 ? schools.map(school => (
                    <div key={school.id} className="flex items-center justify-between p-3 bg-secondary rounded-lg cursor-pointer hover:bg-muted" onClick={() => handleRowClick(school.id)}>
                        <div>
                            <p className="font-semibold">{school.name}</p>
                        </div>
                        <AlertDialog>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                        <span className="sr-only">Open menu</span>
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEdit(school); }}>
                                        <Edit className="mr-2 h-4 w-4" /> Edit
                                    </DropdownMenuItem>
                                    <AlertDialogTrigger asChild>
                                        <DropdownMenuItem className="text-destructive hover:!text-destructive" onClick={(e) => e.stopPropagation()}>
                                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                                        </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete the school and may affect associated teacher profiles.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(school.id)} className="bg-destructive hover:bg-destructive/90">
                                        Delete
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                )) : (
                    <div className="text-center text-muted-foreground py-8">
                        No schools added yet.
                    </div>
                )}
            </div>
            <SchoolForm
                isOpen={isFormOpen}
                setIsOpen={setIsFormOpen}
                editingSchool={editingSchool}
                setSchools={setSchools}
            />
        </>
    );
}

export default function SchoolsTab({ schools, setSchools }: SchoolsTabProps) {
  return (
    <Card>
        <CardHeader>
            <CardTitle>School Management</CardTitle>
            <CardDescription>Add, edit, and manage schools and their student enrollment.</CardDescription>
        </CardHeader>
        <CardContent>
            <SchoolManagement schools={schools} setSchools={setSchools} />
        </CardContent>
    </Card>
  );
}
