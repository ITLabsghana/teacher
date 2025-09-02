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
import { supabase, parseTeacherDates } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { searchTeachers, deleteTeacherAction } from '@/app/actions/teacher-actions';

interface TeachersTabProps {
    initialTeachers: Teacher[];
    initialSchools: School[];
}

export default function TeachersTab({ initialTeachers, initialSchools }: TeachersTabProps) {
  const [schools, setSchools] = useState<School[]>(initialSchools);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();
  const { toast } = useToast();

  // State for search results. `null` means no search is active.
  const [searchResults, setSearchResults] = useState<Teacher[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // The definitive list of teachers to render. It's derived from props or search state.
  // This avoids the complex state synchronization issues.
  const teachersToRender = useMemo(() => {
      const list = searchResults === null ? initialTeachers : searchResults;
      return list.map(parseTeacherDates);
  }, [initialTeachers, searchResults]);

  // Effect for handling search logic
  useEffect(() => {
    const handler = setTimeout(async () => {
        if (searchTerm.trim()) {
            setIsSearching(true);
            const results = await searchTeachers(searchTerm);
            setSearchResults(results);
            setIsSearching(false);
        } else {
            // When search is cleared, reset search results to null to show the initial list
            setSearchResults(null);
        }
    }, 500);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Effect for real-time updates. The most robust approach is to simply
  // refresh the server-provided data. This keeps a single source of truth.
  useEffect(() => {
    const channel = supabase
      .channel('teachers-realtime-channel-robust')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teachers' }, (payload) => {
          console.log('Real-time change detected, refreshing data...', payload);
          router.refresh();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [router]);

  // This function is the single, reliable way to handle data changes.
  // It closes the form and tells Next.js to refetch the data. The UI will
  // update automatically and correctly when the `initialTeachers` prop changes.
  const handleFormSave = () => {
    setIsFormOpen(false);
    setEditingTeacher(null);
    router.refresh();
  };
  
  const handleDelete = async (teacherId: string) => {
    try {
      await deleteTeacherAction(teacherId);
      toast({ title: 'Success', description: 'Teacher deleted successfully.' });
      // After deleting, we must refresh the data from the server.
      router.refresh();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

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
            {isSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />}
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
              {isSearching ? (
                  <TableRow><TableCell colSpan={8} className="h-24 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></TableCell></TableRow>
              ) : teachersToRender.length > 0 ? teachersToRender.map(teacher => (
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
                    {searchTerm ? 'No teachers found matching your search.' : 'No teachers have been added yet.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        {/* Pagination is disabled for now as it adds complexity */}
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
