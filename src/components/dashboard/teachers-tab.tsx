"use client";

import { useState } from 'react';
import type { Teacher, School } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle, Download, Upload } from 'lucide-react';
import { TeacherForm } from './teacher-form';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { differenceInYears } from 'date-fns';

interface TeachersTabProps {
  teachers: Teacher[];
  setTeachers: React.Dispatch<React.SetStateAction<Teacher[]>>;
  schools: School[];
}

export default function TeachersTab({ teachers, setTeachers, schools }: TeachersTabProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);

  const handleAdd = () => {
    setEditingTeacher(null);
    setIsFormOpen(true);
  };

  const handleEdit = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setIsFormOpen(true);
  };

  const handleDelete = (teacherId: string) => {
    setTeachers(teachers.filter(t => t.id !== teacherId));
  };
  
  const getSchoolName = (schoolId: string) => {
    return schools.find(s => s.id === schoolId)?.name || 'N/A';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle>Teacher Management</CardTitle>
                <CardDescription>Add, edit, and manage teacher profiles.</CardDescription>
            </div>
            <div className="flex gap-2">
                <Button variant="outline" size="sm"><Upload className="mr-2 h-4 w-4" /> Import</Button>
                <Button variant="outline" size="sm"><Download className="mr-2 h-4 w-4" /> Export</Button>
                <Button size="sm" onClick={handleAdd}><PlusCircle className="mr-2 h-4 w-4" /> Add Teacher</Button>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Date of Birth</TableHead>
              <TableHead>Age</TableHead>
              <TableHead>School</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teachers.length > 0 ? teachers.map(teacher => (
              <TableRow key={teacher.id}>
                <TableCell>{teacher.firstName} {teacher.lastName}</TableCell>
                <TableCell>{teacher.dateOfBirth.toLocaleDateString()}</TableCell>
                <TableCell>{differenceInYears(new Date(), teacher.dateOfBirth)}</TableCell>
                <TableCell>{getSchoolName(teacher.schoolId)}</TableCell>
                <TableCell>{teacher.subject}</TableCell>
                <TableCell className="text-right">
                  <AlertDialog>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(teacher)}>Edit</DropdownMenuItem>
                        <AlertDialogTrigger asChild>
                           <DropdownMenuItem className="text-destructive hover:!text-destructive">Delete</DropdownMenuItem>
                        </AlertDialogTrigger>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>This action cannot be undone. This will permanently delete the teacher's profile.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(teacher.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No teachers found. Start by adding a new teacher.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
      <TeacherForm
        isOpen={isFormOpen}
        setIsOpen={setIsFormOpen}
        editingTeacher={editingTeacher}
        setTeachers={setTeachers}
        schools={schools}
      />
    </Card>
  );
}
