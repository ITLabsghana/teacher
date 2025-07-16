
"use client";

import { useState, useEffect } from 'react';
import type { School } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { PenSquare, Save } from 'lucide-react';
import { useDataContext } from '@/context/data-context';
import { useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';


interface EnrollmentTabProps {
  schools: School[];
  setSchools: React.Dispatch<React.SetStateAction<School[]>>;
  selectedSchoolId?: string | null;
  onSave?: () => void;
}

const allClassLevels = [
  'KG1', 'KG2', 
  'Basic 1', 'Basic 2', 'Basic 3', 'Basic 4', 'Basic 5', 'Basic 6',
  'J.H.S 1', 'J.H.S 2', 'J.H.S 3',
  'S.H.S 1', 'S.H.S 2', 'S.H.S 3'
];

type EnrollmentData = { [className: string]: { boys: number; girls: number } };

export default function EnrollmentTab({ schools, setSchools, selectedSchoolId: initialSchoolId, onSave }: EnrollmentTabProps) {
  const params = useParams();
  const { toast } = useToast();
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(initialSchoolId ?? null);
  const [enrollmentData, setEnrollmentData] = useState<EnrollmentData>({});
  const [totalBoys, setTotalBoys] = useState(0);
  const [totalGirls, setTotalGirls] = useState(0);
  const isDetailPage = !!params.id;

  useEffect(() => {
    if (initialSchoolId) {
        setSelectedSchoolId(initialSchoolId);
    }
  }, [initialSchoolId]);

  useEffect(() => {
    if (selectedSchoolId) {
      const school = schools.find(s => s.id === selectedSchoolId);
      const initialData = allClassLevels.reduce((acc, level) => {
        acc[level] = { boys: school?.enrollment?.[level]?.boys || 0, girls: school?.enrollment?.[level]?.girls || 0 };
        return acc;
      }, {} as EnrollmentData);
      setEnrollmentData(initialData);
    } else {
      setEnrollmentData({});
    }
  }, [selectedSchoolId, schools]);

  useEffect(() => {
    const totals = Object.values(enrollmentData).reduce((acc, curr) => {
        acc.boys += Number(curr.boys) || 0;
        acc.girls += Number(curr.girls) || 0;
        return acc;
    }, { boys: 0, girls: 0 });
    setTotalBoys(totals.boys);
    setTotalGirls(totals.girls);
  }, [enrollmentData]);

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

  const handleSave = () => {
    if (!selectedSchoolId) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Please select a school before saving.",
        });
        return;
    }
    
    try {
        setSchools(prevSchools => 
          prevSchools.map(school => 
            school.id === selectedSchoolId 
              ? { ...school, enrollment: enrollmentData } 
              : school
          )
        );
        
        toast({
            title: "Success!",
            description: "Enrollment data has been saved successfully.",
        });
        
        if(onSave) {
            onSave();
        }
    } catch(e) {
         toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to save enrollment data.",
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Class Level</TableHead>
                <TableHead>Boys</TableHead>
                <TableHead>Girls</TableHead>
                <TableHead>Total Students</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allClassLevels.map(level => {
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
                  </TableRow>
                )
              })}
            </TableBody>
            <TableFooter>
                <TableRow>
                    <TableCell colSpan={4} className="p-0">
                         <div className="flex justify-between w-full items-center bg-muted p-4 mt-4 rounded-b-lg">
                            <div className="flex gap-8 font-bold">
                                <span>Total Boys: {totalBoys}</span>
                                <span>Total Girls: {totalGirls}</span>
                                <span>Grand Total: {totalBoys + totalGirls}</span>
                            </div>
                            <Button onClick={handleSave}>
                                <Save className="mr-2 h-4 w-4" />
                                Save Enrollment Data
                            </Button>
                        </div>
                    </TableCell>
                </TableRow>
            </TableFooter>
          </Table>
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
