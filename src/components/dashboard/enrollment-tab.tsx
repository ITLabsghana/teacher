
"use client";

import { useState, useEffect, useMemo } from 'react';
import type { School } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { PenSquare, Save, Trash2 } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { sortClassLevels } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { updateSchool as dbUpdateSchool } from '@/lib/supabase';

interface EnrollmentTabProps {
  schools: School[];
  selectedSchoolId?: string | null;
  onSave?: () => void;
  onDataChange?: () => void; // For parent page to refetch data
}

type EnrollmentData = { [className: string]: { boys: number; girls: number } };

const CLASS_SECTIONS = {
    KG: ['KG 1', 'KG 2'],
    Basic: ['Basic 1', 'Basic 2', 'Basic 3', 'Basic 4', 'Basic 5', 'Basic 6'],
    JHS: ['JHS 1', 'JHS 2', 'JHS 3'],
    SHS: ['SHS 1', 'SHS 2', 'SHS 3'],
};

export default function EnrollmentTab({ schools, selectedSchoolId: initialSchoolId, onSave, onDataChange }: EnrollmentTabProps) {
  const params = useParams();
  const { toast } = useToast();

  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(initialSchoolId ?? null);
  const [enrollmentData, setEnrollmentData] = useState<EnrollmentData>({});

  const isDetailPage = !!params.id;

  useEffect(() => {
    if (initialSchoolId) {
        setSelectedSchoolId(initialSchoolId);
    } else if (schools.length > 0) {
        // If not in detail page, default to first school
        setSelectedSchoolId(schools[0].id);
    }
  }, [initialSchoolId, schools]);

  useEffect(() => {
    if (selectedSchoolId) {
      const school = schools.find(s => s.id === selectedSchoolId);
      setEnrollmentData(school?.enrollment || {});
    } else {
      setEnrollmentData({});
    }
  }, [selectedSchoolId, schools]);

  const sortedClassLevels = useMemo(() => sortClassLevels(Object.keys(enrollmentData)), [enrollmentData]);

  const totals = sortedClassLevels.reduce((acc, level) => {
    acc.boys += Number(enrollmentData[level]?.boys) || 0;
    acc.girls += Number(enrollmentData[level]?.girls) || 0;
    return acc;
  }, { boys: 0, girls: 0 });

  const handleInputChange = (className: string, gender: 'boys' | 'girls', value: string) => {
    const numberValue = parseInt(value, 10);
    setEnrollmentData(prev => ({
      ...prev,
      [className]: {
        ...prev[className],
        [gender]: isNaN(numberValue) ? 0 : numberValue,
      },
    }));
  };
  
  const handleAddSection = (section: keyof typeof CLASS_SECTIONS) => {
    const classesToAdd = CLASS_SECTIONS[section];
    const newEnrollmentData = { ...enrollmentData };
    let added = false;
    classesToAdd.forEach(level => {
        if (!newEnrollmentData[level]) {
            newEnrollmentData[level] = { boys: 0, girls: 0 };
            added = true;
        }
    });
    if (added) {
      setEnrollmentData(newEnrollmentData);
    } else {
      toast({ variant: 'default', title: 'Already Added', description: `All ${section} classes are already in the list.` });
    }
  };
  
  const handleRemoveClass = (className: string) => {
      setEnrollmentData(prev => {
          const newState = { ...prev };
          delete newState[className];
          return newState;
      });
  };

  const handleSave = async (dataToSave: EnrollmentData) => {
    if (!selectedSchoolId) {
        toast({ variant: "destructive", title: "Error", description: "Please select a school before saving." });
        return;
    }

    const schoolToUpdate = schools.find(s => s.id === selectedSchoolId);
    if (!schoolToUpdate) {
        toast({ variant: "destructive", title: "Error", description: "Could not find the school to update." });
        return;
    }
    
    try {
        const updatedSchool = { ...schoolToUpdate, enrollment: dataToSave };
        await dbUpdateSchool(updatedSchool);
        
        toast({ title: "Success!", description: "Enrollment data has been saved successfully." });
        
        if (onSave) onSave();
        if (onDataChange) onDataChange();

    } catch(e: any) {
         toast({
            variant: "destructive",
            title: "Error",
            description: e.message || "Failed to save enrollment data.",
        });
    }
  };

  const handleClearEnrollment = async () => {
    setEnrollmentData({});
    await handleSave({}); // Save the empty object to the database
  };

  const checkSectionExists = (section: keyof typeof CLASS_SECTIONS) => {
    return CLASS_SECTIONS[section].every(level => enrollmentData[level]);
  };

  const content = (
      <>
        {!isDetailPage && (
            <div className="w-72 mb-6">
                <Label>Select School</Label>
                <Select onValueChange={setSelectedSchoolId} value={selectedSchoolId ?? undefined}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a school..." />
                    </SelectTrigger>
                    <SelectContent>
                        {schools.map(school => <SelectItem key={school.id} value={school.id}>{school.name}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
        )}
        {selectedSchoolId ? (
          <div className="space-y-4">
             <div className="p-4 bg-green-200 dark:bg-green-800/60 border rounded-lg space-y-4">
                <p className="text-sm font-medium">Add Class Sections</p>
                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleAddSection('KG')} disabled={checkSectionExists('KG')}>Add KG Section</Button>
                    <Button variant="outline" size="sm" onClick={() => handleAddSection('Basic')} disabled={checkSectionExists('Basic')}>Add Basic Section</Button>
                    <Button variant="outline" size="sm" onClick={() => handleAddSection('JHS')} disabled={checkSectionExists('JHS')}>Add JHS Section</Button>
                    <Button variant="outline" size="sm" onClick={() => handleAddSection('SHS')} disabled={checkSectionExists('SHS')}>Add SHS Section</Button>
                </div>
            </div>

            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead className="w-[200px]">Class Level</TableHead>
                    <TableHead>Boys</TableHead>
                    <TableHead>Girls</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {sortedClassLevels.length > 0 ? sortedClassLevels.map(level => {
                    const boys = enrollmentData[level]?.boys || 0;
                    const girls = enrollmentData[level]?.girls || 0;
                    const total = boys + girls;
                    
                    return (
                    <TableRow key={level}>
                        <TableCell className="font-medium">{level}</TableCell>
                        <TableCell>
                        <Input 
                            type="number"
                            min="0"
                            className="w-24"
                            value={boys}
                            onChange={e => handleInputChange(level, 'boys', e.target.value)}
                        />
                        </TableCell>
                        <TableCell>
                        <Input 
                            type="number"
                            min="0"
                            className="w-24"
                            value={girls}
                            onChange={e => handleInputChange(level, 'girls', e.target.value)}
                        />
                        </TableCell>
                        <TableCell>{total}</TableCell>
                        <TableCell className="text-right">
                            <Button variant="ghost" size="icon" onClick={() => handleRemoveClass(level)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </TableCell>
                    </TableRow>
                    )
                }) : (
                    <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                            No classes added yet. Use the buttons above to add class sections.
                        </TableCell>
                    </TableRow>
                )}
                </TableBody>
                {sortedClassLevels.length > 0 && (
                    <TableFooter>
                        <TableRow>
                            <TableCell colSpan={5} className="p-0">
                                <div className="flex flex-wrap justify-between w-full items-center bg-green-200 dark:bg-green-800/60 p-4 mt-4 rounded-b-lg gap-4">
                                    <div className="flex flex-wrap gap-x-8 gap-y-2 font-bold">
                                        <span>Total Boys: {totals.boys}</span>
                                        <span>Total Girls: {totals.girls}</span>
                                        <span>Grand Total: {totals.boys + totals.girls}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="destructive">
                                                    <Trash2 className="mr-2 h-4 w-4" /> Clear All
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This will permanently clear all enrollment data for this school. This action cannot be undone.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={handleClearEnrollment} className="bg-destructive hover:bg-destructive/90">
                                                        Yes, Clear Enrollment
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>

                                        <Button onClick={() => handleSave(enrollmentData)}>
                                            <Save className="mr-2 h-4 w-4" />
                                            Save Enrollment
                                        </Button>
                                    </div>
                                </div>
                            </TableCell>
                        </TableRow>
                    </TableFooter>
                )}
            </Table>
          </div>
        ) : (
          <div className="flex items-center justify-center h-48 text-muted-foreground">
            <p>Please select a school to view or edit enrollment data.</p>
          </div>
        )}
    </>
  );

  if (isDetailPage) {
      return content;
  }

  return (
    <Card className="bg-green-100 dark:bg-green-900/50">
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle className="flex items-center gap-2"><PenSquare /> Enrollment Management</CardTitle>
                <CardDescription>Add or update student enrollment numbers for each school.</CardDescription>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        {content}
      </CardContent>
    </Card>
  );
}
