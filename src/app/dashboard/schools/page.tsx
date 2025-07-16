
"use client";

import { useDataContext } from '@/context/data-context';
import { SchoolForm } from '@/components/dashboard/school-form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { School } from '@/lib/types';
import { useState, useMemo, Suspense, lazy } from 'react';
import { useRouter } from 'next/navigation';
import { MoreHorizontal, Edit, Trash2, Users, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';

const EnrollmentTab = lazy(() => import('@/components/dashboard/enrollment-tab'));

function SchoolListView({ schools }: { schools: School[] }) {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');

    const handleRowClick = (schoolId: string) => {
        router.push(`/dashboard/schools/${schoolId}`);
    };

    const calculateTotals = (school: School) => {
        const enrollment = school.enrollment || {};
        return Object.values(enrollment).reduce((acc, curr) => {
            acc.boys += curr.boys || 0;
            acc.girls += curr.girls || 0;
            return acc;
        }, { boys: 0, girls: 0 });
    };

    const filteredSchools = useMemo(() => schools.filter(school =>
        school.name.toLowerCase().includes(searchTerm.toLowerCase())
    ), [schools, searchTerm]);

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
                const grandTotal = totals.boys + totals.girls;

                return (
                    <div
                        key={school.id}
                        className="p-4 bg-secondary rounded-lg cursor-pointer hover:bg-muted transition-colors"
                        onClick={() => handleRowClick(school.id)}
                    >
                        <h3 className="font-bold text-lg text-primary">{school.name}</h3>
                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                            <div className="flex items-center gap-2 p-3 bg-background rounded-md">
                                <Users className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <p className="text-muted-foreground">Total Boys</p>
                                    <p className="font-semibold">{totals.boys}</p>
                                </div>
                            </div>
                             <div className="flex items-center gap-2 p-3 bg-background rounded-md">
                                <Users className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <p className="text-muted-foreground">Total Girls</p>
                                    <p className="font-semibold">{totals.girls}</p>
                                </div>
                            </div>
                             <div className="flex items-center gap-2 p-3 bg-background rounded-md">
                                <Users className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <p className="text-muted-foreground">Grand Total</p>
                                    <p className="font-semibold">{grandTotal}</p>
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

function SchoolManagement({ schools, setSchools, onSchoolAdded }: { schools: School[], setSchools: React.Dispatch<React.SetStateAction<School[]>>, onSchoolAdded: () => void }) {
    const [editingSchool, setEditingSchool] = useState<School | null>(null);

    const handleEdit = (school: School) => {
        setEditingSchool(school);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setEditingSchool(null);
    }

    const handleDelete = (schoolId: string) => {
        setSchools(schools.filter(s => s.id !== schoolId));
    };

    return (
        <div className="space-y-8">
            <SchoolForm
                setSchools={setSchools}
                editingSchool={editingSchool}
                onCancelEdit={handleCancelEdit}
                onSchoolAdded={() => {
                    setEditingSchool(null);
                    onSchoolAdded();
                }}
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

export default function SchoolsPage() {
  const { schools, setSchools } = useDataContext();
  const [activeTab, setActiveTab] = useState('view');

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
                <SchoolListView schools={schools} />
            </TabsContent>
            <TabsContent value="enrollment" className="mt-4">
                <Suspense fallback={<div>Loading...</div>}>
                    <EnrollmentTab schools={schools} setSchools={setSchools} />
                </Suspense>
            </TabsContent>
            <TabsContent value="add" className="mt-4">
                <SchoolManagement
                    schools={schools}
                    setSchools={setSchools}
                    onSchoolAdded={() => { /* can add toast here if needed */ }}
                />
            </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
