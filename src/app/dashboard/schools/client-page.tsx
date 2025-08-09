
"use client";

import { SchoolForm } from '@/components/dashboard/school-form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { School } from '@/lib/types';
import { useState, useMemo, Suspense, lazy, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MoreHorizontal, Edit, Trash2, Users, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { deleteSchool, getSchools, supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

const EnrollmentTab = lazy(() => import('@/components/dashboard/enrollment-tab'));

function SchoolListView({ schools, isLoading, onRowClick }: { schools: School[], isLoading: boolean, onRowClick: (id: string) => void }) {
    const [searchTerm, setSearchTerm] = useState('');

    const calculateTotals = (school: School) => {
        const enrollment = school.enrollment || {};
        const totals = Object.values(enrollment).reduce((acc, curr) => {
            acc.boys += curr.boys || 0;
            acc.girls += curr.girls || 0;
            return acc;
        }, { boys: 0, girls: 0 });
        const grandTotal = totals.boys + totals.girls;
        return { ...totals, grandTotal };
    };

    const filteredSchools = useMemo(() => {
        if (!searchTerm) return schools;
        const lowercasedTerm = searchTerm.toLowerCase();
        return schools.filter(school =>
            school.name.toLowerCase().includes(lowercasedTerm)
        );
    }, [schools, searchTerm]);
    
    if (isLoading && schools.length === 0) {
        return (
             <div className="space-y-4">
                {Array.from({length: 3}).map((_, i) => (
                    <div key={i} className="p-4 bg-secondary rounded-lg">
                        <Skeleton className="h-6 w-1/2 mb-4" />
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <Skeleton className="h-16 w-full" />
                            <Skeleton className="h-16 w-full" />
                            <Skeleton className="h-16 w-full" />
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search for a school..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 max-w-md"
                />
            </div>
            {filteredSchools.length > 0 ? filteredSchools.map(school => {
                const totals = calculateTotals(school);

                return (
                    <div
                        key={school.id}
                        className="p-4 bg-blue-100 dark:bg-blue-900/50 rounded-lg cursor-pointer hover:bg-blue-200/50 dark:hover:bg-blue-800/50 transition-colors"
                        onClick={() => onRowClick(school.id)}
                    >
                        <h3 className="font-bold text-lg text-primary">{school.name}</h3>
                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                            <div className="flex items-center gap-2 p-3 bg-blue-200 dark:bg-blue-800/60 rounded-md">
                                <Users className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <p className="text-muted-foreground">Total Boys</p>
                                    <p className="font-semibold">{totals.boys}</p>
                                </div>
                            </div>
                             <div className="flex items-center gap-2 p-3 bg-pink-200 dark:bg-pink-800/60 rounded-md">
                                <Users className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <p className="text-muted-foreground">Total Girls</p>
                                    <p className="font-semibold">{totals.girls}</p>
                                </div>
                            </div>
                             <div className="flex items-center gap-2 p-3 bg-indigo-200 dark:bg-indigo-800/60 rounded-md">
                                <Users className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <p className="text-muted-foreground">Grand Total</p>
                                    <p className="font-semibold">{totals.grandTotal}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            }) : (
                <div className="text-center text-muted-foreground py-8">
                    {searchTerm ? `No schools found for "${searchTerm}".` : "No schools added yet. Go to the 'Add/Edit School' tab to create one."}
                </div>
            )}
        </div>
    );
}

function SchoolManagement({ schools, setSchools }: { schools: School[], setSchools: React.Dispatch<React.SetStateAction<School[]>> }) {
    const [editingSchool, setEditingSchool] = useState<School | null>(null);
    const { toast } = useToast();

    const handleEdit = (school: School) => {
        setEditingSchool(school);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setEditingSchool(null);
    }

    const handleDelete = async (schoolId: string) => {
        try {
            await deleteSchool(schoolId);
            toast({ title: "Success", description: "School deleted successfully." });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        }
    };

    return (
        <div className="space-y-8">
            <SchoolForm
                editingSchool={editingSchool}
                onCancelEdit={handleCancelEdit}
                onSchoolAction={() => setEditingSchool(null)}
            />

            <div className="space-y-2 pt-4 border-t">
                 <h3 className="text-lg font-medium text-muted-foreground mb-4">Existing Schools</h3>
                {schools.length > 0 ? schools.map(school => (
                    <div key={school.id} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                        <div>
                            <p className="font-semibold">{school.name}</p>
                        </div>
                        <AlertDialog>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                        <span className="sr-only">Open menu</span>
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleEdit(school)}>
                                        <Edit className="mr-2 h-4 w-4" /> Edit
                                    </DropdownMenuItem>
                                    <AlertDialogTrigger asChild>
                                        <DropdownMenuItem className="text-destructive hover:!text-destructive">
                                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                                        </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <AlertDialogContent>
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
                        No schools found.
                    </div>
                )}
            </div>
        </div>
    );
}

export default function SchoolsPageClient({ initialSchools }: { initialSchools: School[] }) {
  const [schools, setSchools] = useState<School[]>(initialSchools);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('view');
  const router = useRouter();

  const fetchSchoolData = async () => {
    setIsLoading(true);
    try {
      const data = await getSchools(true);
      setSchools(data);
    } catch (error) {
      console.error("Failed to fetch schools", error);
    } finally {
      setIsLoading(false);
    }
  };


  useEffect(() => {
    const channel = supabase
      .channel('schools-realtime-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'schools' }, 
        (payload) => {
          const newSchool = payload.new as School;
          if (payload.eventType === 'INSERT') {
            setSchools(current => [newSchool, ...current]);
          }
          if (payload.eventType === 'UPDATE') {
            setSchools(current => current.map(s => s.id === newSchool.id ? newSchool : s));
          }
          if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as School).id;
            setSchools(current => current.filter(s => s.id !== deletedId));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  
  const handleRowClick = (schoolId: string) => {
    router.push(`/dashboard/schools/${schoolId}`);
  };


  return (
    <Card>
      <CardHeader>
        <CardTitle>School & Enrollment Management</CardTitle>
        <CardDescription>Manage schools and their student enrollment data.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3">
                <TabsTrigger value="view">View Schools</TabsTrigger>
                <TabsTrigger value="enrollment">Manage Enrollment</TabsTrigger>
                <TabsTrigger value="add">Add/Edit School</TabsTrigger>
            </TabsList>
            <TabsContent value="view" className="mt-4">
                <SchoolListView schools={schools} isLoading={isLoading} onRowClick={handleRowClick} />
            </TabsContent>
            <TabsContent value="enrollment" className="mt-4">
                <Suspense fallback={<div>Loading...</div>}>
                    <EnrollmentTab schools={schools} onDataChange={fetchSchoolData} />
                </Suspense>
            </TabsContent>
            <TabsContent value="add" className="mt-4">
                <SchoolManagement
                    schools={schools}
                    setSchools={setSchools}
                />
            </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
