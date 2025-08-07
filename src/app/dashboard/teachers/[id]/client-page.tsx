"use client";

import { useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';
import type { Teacher, School, LeaveRequest } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { TeacherForm } from '@/components/dashboard/teacher-form';
import { deleteTeacher } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface TeacherProfileClientPageProps {
    teacher: Teacher;
    schools: School[];
    initialLeaveRequests: LeaveRequest[];
    initialIsOnLeave: boolean;
    children: React.ReactNode;
}

export function TeacherProfileClientPage({
    teacher,
    schools,
    children
}: TeacherProfileClientPageProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [isFormOpen, setIsFormOpen] = useState(false);

    const handleDelete = async () => {
        try {
            await deleteTeacher(teacher.id);
            toast({ title: "Success", description: "Teacher profile deleted." });
            router.push('/dashboard/teachers');
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        }
    };

    const handleFormSave = () => {
        setIsFormOpen(false);
        router.refresh();
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Teachers
                </Button>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setIsFormOpen(true)}>
                        <Edit className="mr-2 h-4 w-4" /> Edit
                    </Button>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive">
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete this teacher's profile.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                                    Delete
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>

            {children}

            <TeacherForm
                isOpen={isFormOpen}
                setIsOpen={setIsFormOpen}
                editingTeacher={teacher}
                onSave={handleFormSave}
                schools={schools}
            />
        </div>
    );
}
