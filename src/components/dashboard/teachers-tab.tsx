"use client";

import { useState, useMemo, useCallback, useEffect } from 'react';
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
import { getTeachers, supabase, parseTeacherDates } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { searchTeachers, deleteTeacherAction } from '@/app/actions/teacher-actions';

const PAGE_SIZE = 20;

interface TeachersTabProps {
    initialTeachers: Teacher[]; // Will be empty on initial load
    initialSchools: School[];
}

export default function TeachersTab({ initialTeachers, initialSchools }: TeachersTabProps) {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [schools, setSchools] = useState<School[]>(initialSchools);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true); // Start in loading state
  const [isSearching, setIsSearching] = useState(false);

  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const fetchInitialTeachers = useCallback(async () => {
    setIsLoading(true);
    try {
      // When fetching from the client, `isAdmin` must be false to use the public key.
      const newTeachers = await getTeachers(0, PAGE_SIZE, false);
      setTeachers(newTeachers.map(parseTeacherDates));
      setPage(0);
      setHasMore(newTeachers.length === PAGE_SIZE);
    } catch (error) {
      console.error("Failed to fetch initial teachers:", error);
      toast({ variant: 'destructive', title: "Error", description: "Failed to load teachers." });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Fetch initial data on component mount
  useEffect(() => {
    fetchInitialTeachers();
  }, [fetchInitialTeachers]);

  // Effect for handling search logic
  useEffect(() => {
    const handler = setTimeout(async () => {
        if (searchTerm.trim()) {
            setIsSearching(true);
            setHasMore(false); // Disable "load more" during search
            const results = await searchTeachers(searchTerm);
            setTeachers(results.map(parseTeacherDates));
            setIsSearching(false);
        } else if (teachers.length > 0) { // Only refetch if there was a search term before
            // When search is cleared, revert to the initial list
            fetchInitialTeachers();
        }
    }, 500);

    return () => clearTimeout(handler);
  }, [searchTerm, fetchInitialTeachers]);

  // Real-time updates simply trigger a refetch of the initial data.
  useEffect(() => {
    const channel = supabase
      .channel('teachers-realtime-channel-final-perf')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teachers' }, () => {
          // A change happened, refetch the first page to show the latest state.
          // This is simpler and more robust than trying to merge changes.
          fetchInitialTeachers();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchInitialTeachers]);

  const handleFormSave = () => {
    setIsFormOpen(false);
    setEditingTeacher(null);
    // After saving, refetch the initial data to ensure the list is up-to-date.
    fetchInitialTeachers();
  };

  const handleDelete = async (teacherId: string) => {
    try {
      await deleteTeacherAction(teacherId);
      toast({ title: 'Success', description: 'Teacher deleted successfully.' });
      // After deleting, refetch.
      fetchInitialTeachers();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const fetchMoreTeachers = useCallback(async () => {
      if (isLoadingMore || !hasMore) return;
      setIsLoadingMore(true);
      try {
          const nextPage = page + 1;
          // When fetching from the client, `isAdmin` must be false.
          const newTeachers = await getTeachers(nextPage, PAGE_SIZE, false);
          setTeachers(prev => [...prev, ...newTeachers.map(parseTeacherDates)]);
          setPage(nextPage);
          if (newTeachers.length < PAGE_SIZE) {
              setHasMore(false);
          }
      } catch (error) {
          console.error("Failed to fetch more teachers:", error);
          toast({ variant: 'destructive', title: "Error", description: "Failed to load more teachers." });
      } finally {
          setIsLoadingMore(false);
      }
  }, [page, hasMore, isLoadingMore, toast]);

  const handleAdd = () => {
    setEditingTeacher(null);
    setIsFormOpen(true);
  };

  const handleEdit = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setIsFormOpen(true);
  };

  const getSchoolName = useCallback((schoolId?: string | null) => {
    if (!schoolId) return 'N/A';
    return schools.find(s => s.id === schoolId)?.name || 'N/A';
  }, [schools]);

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase();
  };

  const handleRowClick = (teacherId: string) => {
    router.push(`/dashboard/teachers/${teacherId}`);
  };

  return (
    <Card className="bg-purple-100 dark:bg-purple-900/50">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
                <CardTitle>Teacher Management</CardTitle>
                <CardDescription>Add, edit, and manage teacher profiles.</CardDescription>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
                <Button size="sm" onClick={handleAdd}><PlusCircle className="mr-2 h-4 w-4" /> Add Teacher</Button>
            </div>
        </div>
        <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            {(isSearching || (isLoading && teachers.length === 0)) && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />}
            <Input
                placeholder="Search by name, school, specialization, or years in school..."
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
                <TableHead>Professional Qualification</TableHead>
                <TableHead>Current School</TableHead>
                <TableHead>Registered No.</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && teachers.length === 0 ? (
                  Array.from({length: 5}).map((_, i) => (
                      <TableRow key={i} className="animate-pulse">
                          <TableCell><Skeleton className="h-20 w-20 rounded-full" /></TableCell>
                          <TableCell><div className="space-y-2"><Skeleton className="h-4 w-40" /><Skeleton className="h-3 w-48" /></div></TableCell>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                          <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                      </TableRow>
                  ))
              ) : teachers.length > 0 ? teachers.map(teacher => (
                <TableRow key={teacher.id} onClick={() => handleRowClick(teacher.id)} className="cursor-pointer">
                  <TableCell>
                     <Avatar className="h-20 w-20">
                          <AvatarImage src={teacher.photo ?? undefined} alt={`${teacher.firstName} ${teacher.lastName}`} />
                          <AvatarFallback className="text-2xl">{getInitials(teacher.firstName, teacher.lastName)}</AvatarFallback>
                      </Avatar>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium flex items-center gap-2">{teacher.firstName} {teacher.lastName}</div>
                    <div className="text-sm text-muted-foreground">{teacher.areaOfSpecialization || 'N/A'}</div>
                  </TableCell>
                  <TableCell>{teacher.staffId}</TableCell>
                  <TableCell>{teacher.professionalQualification || 'N/A'}</TableCell>
                  <TableCell>{getSchoolName(teacher.schoolId)}</TableCell>
                  <TableCell>{teacher.registeredNo || 'N/A'}</TableCell>
                  <TableCell>{teacher.phoneNo || 'N/A'}</TableCell>
                  <TableCell className="text-right">
                    <AlertDialog>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" className="h-8 w-8 p-0"><span className="sr-only">Open menu</span><MoreHorizontal className="h-4 w-4" /></Button>
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
                  <TableCell colSpan={8} className="h-24 text-center">
                    {isSearching ? 'No teachers found matching your search.' : 'No teachers have been added yet.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        {hasMore && !searchTerm && (
            <div className="mt-4 flex justify-center">
                <Button onClick={fetchMoreTeachers} disabled={isLoadingMore}>
                    {isLoadingMore ? (
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
        schools={schools}
      />
    </Card>
  );
}
