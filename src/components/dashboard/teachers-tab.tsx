"use client";

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Teacher, School } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle, Search, Loader2 } from 'lucide-react';
import { TeacherForm } from './teacher-form';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { getTeachers, deleteTeacher, getSchools } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

const PAGE_SIZE = 20;

// Custom hook for debouncing
function useDebounce(value: string, delay: number) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
}

export default function TeachersTab() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [schools, setSchools] = useState<Partial<School>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const router = useRouter();
  const { toast } = useToast();
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const loadTeachers = useCallback(async (loadPage: number, search: string) => {
    setIsLoading(true);
    try {
      const newTeachers = await getTeachers(loadPage, PAGE_SIZE, search);
      setTeachers(prev => loadPage === 0 ? newTeachers : [...prev, ...newTeachers]);
      setPage(loadPage);
      setHasMore(newTeachers.length === PAGE_SIZE);
    } catch (error) {
      toast({ variant: 'destructive', title: "Error", description: "Failed to load teachers." });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Effect for handling search
  useEffect(() => {
    loadTeachers(0, debouncedSearchTerm);
  }, [debouncedSearchTerm, loadTeachers]);

  // Effect for fetching initial schools data
  useEffect(() => {
    const fetchSchools = async () => {
        try {
            const schoolData = await getSchools('id,name');
            setSchools(schoolData);
        } catch (error) {
            toast({ variant: 'destructive', title: "Error", description: "Failed to load schools." });
        }
    };
    fetchSchools();
  }, [toast]);

  const handleLoadMore = () => {
    if (hasMore && !isLoading) {
      loadTeachers(page + 1, debouncedSearchTerm);
    }
  };

  const handleFormSave = () => {
    setIsFormOpen(false);
    loadTeachers(0, debouncedSearchTerm); // Refresh the list
  };

  const handleAdd = () => {
    setEditingTeacher(null);
    setIsFormOpen(true);
  };

  const handleEdit = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setIsFormOpen(true);
  };
  
  const handleDelete = async (teacherId: string) => {
    try {
      await deleteTeacher(teacherId);
      setTeachers(prev => prev.filter(t => t.id !== teacherId));
      toast({ title: 'Success', description: 'Teacher deleted successfully.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const getSchoolName = useCallback((teacher: Teacher) => {
    // The new getTeachers function includes the school name
    if (teacher.school && 'name' in teacher.school) {
        return (teacher.school as School).name;
    }
    return 'N/A';
  }, []);

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
                <CardTitle>Teacher Management</CardTitle>
                <CardDescription>Add, edit, and manage teacher profiles.</CardDescription>
            </div>
            <Button size="sm" onClick={handleAdd}><PlusCircle className="mr-2 h-4 w-4" /> Add Teacher</Button>
        </div>
        <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
                placeholder="Search by name or specialization..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 max-w-md"
            />
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Picture</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Staff ID</TableHead>
                <TableHead>Current School</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && teachers.length === 0 ? (
                  Array.from({length: 5}).map((_, i) => (
                      <TableRow key={i}>
                          <TableCell><Skeleton className="h-12 w-12 rounded-full" /></TableCell>
                          <TableCell><div className="space-y-2"><Skeleton className="h-4 w-40" /></div></TableCell>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                          <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                      </TableRow>
                  ))
              ) : teachers.length > 0 ? teachers.map(teacher => (
                <TableRow key={teacher.id} onClick={() => router.push(`/dashboard/teachers/${teacher.id}`)} className="cursor-pointer">
                  <TableCell>
                     <Avatar className="h-12 w-12">
                          <AvatarImage src={teacher.photo ?? undefined} alt={`${teacher.firstName} ${teacher.lastName}`} />
                          <AvatarFallback>{getInitials(teacher.firstName, teacher.lastName)}</AvatarFallback>
                      </Avatar>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{teacher.firstName} {teacher.lastName}</div>
                    <div className="text-sm text-muted-foreground">{teacher.areaOfSpecialization || 'N/A'}</div>
                  </TableCell>
                  <TableCell>{teacher.staffId}</TableCell>
                  <TableCell>{getSchoolName(teacher)}</TableCell>
                  <TableCell>{teacher.phoneNo || 'N/A'}</TableCell>
                  <TableCell className="text-right">
                    <AlertDialog>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEdit(teacher); }}>Edit</DropdownMenuItem>
                          <AlertDialogTrigger asChild>
                             <DropdownMenuItem className="text-destructive hover:!text-destructive" onClick={(e) => e.stopPropagation()}>Delete</DropdownMenuItem>
                          </AlertDialogTrigger>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <AlertDialogContent onClick={(e) => e.stopPropagation()}>
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
                    {searchTerm ? 'No teachers found matching your search.' : 'No teachers have been added yet.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        {hasMore && (
            <div className="mt-4 flex justify-center">
                <Button onClick={handleLoadMore} disabled={isLoading}>
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Loading...
                        </>
                    ) : 'Load More'}
                </Button>
            </div>
        )}
      </CardContent>
      <TeacherForm
        key={editingTeacher ? editingTeacher.id : 'new'}
        isOpen={isFormOpen}
        setIsOpen={setIsFormOpen}
        editingTeacher={editingTeacher}
        onSave={handleFormSave}
        schools={schools as School[]}
      />
    </Card>
  );
}
