
"use client";

import { useDataContext } from '@/context/data-context';
import { SchoolForm } from '@/components/dashboard/school-form';
import EnrollmentTab from '@/components/dashboard/enrollment-tab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { School } from '@/lib/types';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';


function SchoolListView({ schools }: { schools: School[] }) {
    const router = useRouter();

    const handleRowClick = (schoolId: string) => {
        router.push(`/dashboard/schools/${schoolId}`);
    };

    return (
        <div className="space-y-2">
            {schools.length > 0 ? schools.map(school => (
                <div 
                    key={school.id} 
                    className="flex items-center justify-between p-3 bg-secondary rounded-lg cursor-pointer hover:bg-muted" 
                    onClick={() => handleRowClick(school.id)}
                >
                    <p className="font-semibold">{school.name}</p>
                </div>
            )) : (
                <div className="text-center text-muted-foreground py-8">
                    No schools added yet. Go to the 'Add/Edit School' tab to create one.
                </div>
            )}
        </div>
    );
}

function SchoolManagement({ schools, setSchools, onSchoolAdded }: { schools: School[], setSchools: React.Dispatch<React.SetStateAction<School[]>>, onSchoolAdded: () => void }) {
    const [editingSchool, setEditingSchool] = useState<School | null>(null);

    const handleEdit = (school: School) => {
        setEditingSchool(school);
        // Scroll to top to make the form visible
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
                <EnrollmentTab schools={schools} setSchools={setSchools} />
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
