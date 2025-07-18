
"use client";

import { useState, useEffect } from 'react';
import type { School } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { PenSquare, Save, PlusCircle, Trash2 } from 'lucide-react';
import { useDataContext } from '@/context/data-context';
import { useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

interface EnrollmentTabProps {
  schools: School[];
  selectedSchoolId?: string | null;
  onSave?: () => void;
}

type EnrollmentData = { [className: string]: { boys: number; girls: number } };

export default function EnrollmentTab({ schools, selectedSchoolId: initialSchoolId, onSave }: EnrollmentTabProps) {
  const params = useParams();
  const { toast } = useToast();
  const { updateSchool } = useDataContext();

  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(initialSchoolId ?? null);
  const [enrollmentData, setEnrollmentData] = useState<EnrollmentData>({});
  const [newClassName, setNewClassName] = useState('');

  const isDetailPage = !!params.id;

  useEffect(() => {
    if (initialSchoolId) {
        setSelectedSchoolId(initialSchoolId);
    }
  }, [initialSchoolId]);

  useEffect(() => {
    if (selectedSchoolId) {
      const school = schools.find(s => s.id === selectedSchoolId);
      setEnrollmentData(school?.enrollment || {});
    } else {
      setEnrollmentData({});
    }
  }, [selectedSchoolId, schools]);

  const sortedClassLevels = Object.keys(enrollmentData).sort();

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
  
  const handleAddNewClass = () => {
    if (!newClassName) {
        toast({ variant: "destructive", title: "Error", description: "Please enter a class name." });
        return;
    }
    if (enrollmentData[newClassName] !== undefined) {
        toast({ variant: "destructive", title: "Error", description: "This class already exists." });
        return;
    }
    setEnrollmentData(prev => ({ ...prev, [newClassName]: { boys: 0, girls: 0 } }));
    setNewClassName('');
  };
  
  const handleRemoveClass = (className: string) => {
      setEnrollmentData(prev => {
          const newState = { ...prev };
          delete newState[className];
          return newState;
      });
  };

  const handleSave = async () => {
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
        const updatedSchool = { ...schoolToUpdate, enrollment: enrollmentData };
        await updateSchool(updatedSchool);
        
        toast({ title: "Success!", description: "Enrollment data has been saved successfully." });
        
        if (onSave) {
            onSave();
        }
    } catch(e: any) {
         toast({
            variant: "destructive",
            title: "Error",
            description: e.message || "Failed to save enrollment data.",
        });
    }
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
            <div className="flex gap-2 items-end">
                <div className="flex-grow">
                    <Label htmlFor="new-class-name">New Class Name</Label>
                    <Input 
                        id="new-class-name"
                        placeholder="e.g., Basic 1, JHS 2, Form 1"
                        value={newClassName}
                        onChange={e => setNewClassName(e.target.value)}
                    />
                </div>
                <Button onClick={handleAddNewClass} variant="outline">
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Class
                </Button>
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
                            No classes added yet. Use the input above to add a class.
                        </TableCell>
                    </TableRow>
                )}
                </TableBody>
                {sortedClassLevels.length > 0 && (
                    <TableFooter>
                        <TableRow>
                            <TableCell colSpan={5} className="p-0">
                                <div className="flex justify-between w-full items-center bg-muted p-4 mt-4 rounded-b-lg">
                                    <div className="flex gap-8 font-bold">
                                        <span>Total Boys: {totals.boys}</span>
                                        <span>Total Girls: {totals.girls}</span>
                                        <span>Grand Total: {totals.boys + totals.girls}</span>
                                    </div>
                                    <Button onClick={handleSave}>
                                        <Save className="mr-2 h-4 w-4" />
                                        Save Enrollment Data
                                    </Button>
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
    <Card>
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
