
"use client";

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Download, Upload, FileText, FileWarning, Trash2 } from 'lucide-react';
import { useDataContext } from '@/context/data-context';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { School, Teacher, LeaveRequest, User } from '@/lib/types';

type ReportFormat = 'csv' | 'pdf' | 'docx';
type BackupFormat = 'json' | 'csv' | 'sql';

export default function ReportsTab() {
  const {
    teachers, schools, leaveRequests, users,
    setTeachers, setSchools, setLeaveRequests, setUsers
  } = useDataContext();
  const { toast } = useToast();

  const [reportType, setReportType] = useState('');
  const [reportFormat, setReportFormat = useState<ReportFormat>('csv');
  const [exportFormat, setExportFormat = useState<BackupFormat>('json');
  const [importFormat, setImportFormat = useState<BackupFormat>('json');
  const [importError, setImportError = useState('');
  const [clearDataConfirmation, setClearDataConfirmation = useState('');

  const CONFIRMATION_TEXT = 'DELETE ALL DATA';

  const downloadCSV = (csvContent: string, fileName: string) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const arrayToCSV = (data: any[], headers: { key: string, label: string }[]): string => {
    const headerRow = headers.map(h => h.label).join(',');
    const bodyRows = data.map(row => {
        return headers.map(header => {
            let value = row[header.key] ?? '';
            if (value instanceof Date) {
              value = value.toLocaleDateString();
            }
            const stringValue = String(value).replace(/"/g, '""');
            return `"${stringValue}"`;
        }).join(',');
    });
    return [headerRow, ...bodyRows].join('\n');
  };

  const handleGenerateReport = () => {
    if (!reportType) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Please select a report type.',
        });
        return;
    }

    if (reportFormat !== 'csv') {
        toast({
            title: 'Feature Not Implemented',
            description: `Generating ${reportFormat.toUpperCase()} reports is not yet available. Please choose CSV.`,
        });
        return;
    }

    let csvContent = '';
    let fileName = `${reportType}-${new Date().toISOString().split('T')[0]}.csv`;
    const getSchoolName = (schoolId?: string) => schools.find(s => s.id === schoolId)?.name || 'N/A';
    
    switch (reportType) {
        case 'teacher-list': {
            const headers = [
                { key: 'staffId', label: 'Staff ID' },
                { key: 'firstName', label: 'First Name' },
                { key: 'lastName', label: 'Last Name' },
                { key: 'email', label: 'Email' },
                { key: 'phoneNo', label: 'Phone No.' },
                { key: 'gender', label: 'Gender' },
                { key: 'rank', label: 'Rank' },
                { key: 'job', label: 'Job' },
                { key: 'currentSchool', label: 'Current School' },
                { key: 'firstAppointmentDate', label: 'First Appointment Date' },
            ];
            const data = teachers.map(t => ({ ...t, currentSchool: getSchoolName(t.schoolId) }));
            csvContent = arrayToCSV(data, headers);
            break;
        }

        case 'school-enrollment': {
            const data: any[] = [];
            schools.forEach(school => {
                if (school.enrollment && Object.keys(school.enrollment).length > 0) {
                    Object.entries(school.enrollment).forEach(([classLevel, { boys, girls }]) => {
                        data.push({
                            schoolName: school.name,
                            classLevel,
                            boys,
                            girls,
                            total: (boys || 0) + (girls || 0)
                        });
                    });
                } else {
                    data.push({ schoolName: school.name, classLevel: 'N/A', boys: 0, girls: 0, total: 0 });
                }
            });
            const headers = [
                { key: 'schoolName', label: 'School Name' },
                { key: 'classLevel', label: 'Class' },
                { key: 'boys', label: 'Boys' },
                { key: 'girls', label: 'Girls' },
                { key: 'total', label: 'Total Students' },
            ];
            csvContent = arrayToCSV(data, headers);
            break;
        }

        case 'leave-summary': {
            const getTeacherName = (teacherId: string) => {
                const teacher = teachers.find(t => t.id === teacherId);
                return teacher ? `${teacher.firstName} ${teacher.lastName}` : 'N/A';
            };
            const data = leaveRequests.map(req => ({
                teacherName: getTeacherName(req.teacherId),
                leaveType: req.leaveType,
                startDate: req.startDate,
                returnDate: req.returnDate,
                status: req.status
            }));
            const headers = [
                { key: 'teacherName', label: 'Teacher Name' },
                { key: 'leaveType', label: 'Leave Type' },
                { key: 'startDate', label: 'Start Date' },
                { key: 'returnDate', label: 'Return Date' },
                { key: 'status', label: 'Status' },
            ];
            csvContent = arrayToCSV(data, headers);
            break;
        }

        case 'general-report': {
            const totalStudents = schools.reduce((sum, school) => {
                const schoolTotal = Object.values(school.enrollment || {}).reduce((acc, curr) => acc + (curr.boys || 0) + (curr.girls || 0), 0);
                return sum + schoolTotal;
            }, 0);
            const data = [
                { metric: 'Total Teachers', value: teachers.length },
                { metric: 'Total Schools', value: schools.length },
                { metric: 'Total Students', value: totalStudents },
                { metric: 'Total Leave Requests', value: leaveRequests.length },
                { metric: 'Approved Leave Requests', value: leaveRequests.filter(r => r.status === 'Approved').length },
            ];
            const headers = [{ key: 'metric', label: 'Metric' }, { key: 'value', label: 'Value' }];
            csvContent = arrayToCSV(data, headers);
            break;
        }

        default:
            toast({ variant: 'destructive', title: 'Error', description: 'Unknown report type.' });
            return;
    }

    downloadCSV(csvContent, fileName);
    toast({ title: 'Report Generated', description: `${reportType} has been successfully exported as a CSV file.` });
  };


  const handleExport = () => {
    if (exportFormat !== 'json') {
      toast({
        title: "Feature Not Implemented",
        description: `${exportFormat.toUpperCase()} export is not yet available. Please use JSON.`,
      });
      return;
    }

    const allData = {
      teachers,
      schools,
      leaveRequests,
      users,
      exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `teacher-management-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: "Export Successful", description: "All data has been exported as JSON." });
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (importFormat !== 'json') {
      toast({
        variant: 'destructive',
        title: "Feature Not Implemented",
        description: `Please use a JSON file for import.`,
      });
      event.target.value = ''; // Reset file input
      return;
    }

    setImportError('');
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data = JSON.parse(text);

        if (!data.teachers || !data.schools || !data.leaveRequests || !data.users) {
          throw new Error("Invalid backup file format. Missing required data keys.");
        }

        setTeachers(data.teachers as Teacher[]);
        setSchools(data.schools as School[]);
        setLeaveRequests(data.leaveRequests as LeaveRequest[]);
        setUsers(data.users as User[]);

        toast({ title: "Import Successful", description: "Data has been successfully restored from the backup file." });
      } catch (error: any) {
        console.error("Import failed:", error);
        setImportError(error.message || "Failed to parse the backup file. Please ensure it's a valid JSON backup.");
        toast({
          variant: 'destructive',
          title: "Import Failed",
          description: error.message || "Could not process the file.",
        });
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset file input
  };

  const handleClearAllData = () => {
    setTeachers([]);
    setSchools([]);
    setLeaveRequests([]);

    const preservedUsers = users.filter(u => u.role === 'Admin' || u.role === 'Supervisor');
    setUsers(preservedUsers);

    toast({ title: "All Data Cleared", description: "The application data has been reset, preserving Admin and Supervisor accounts." });
    setClearDataConfirmation('');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileText /> Generate Reports</CardTitle>
          <CardDescription>Create and download reports for your institution's data.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="report-type">Report Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger id="report-type">
                  <SelectValue placeholder="Select a report type..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="teacher-list">Teacher List</SelectItem>
                  <SelectItem value="school-enrollment">School Enrollment Summary</SelectItem>
                  <SelectItem value="leave-summary">Leave Summary</SelectItem>
                  <SelectItem value="general-report">General Report</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 space-y-2">
              <Label htmlFor="report-format">Format</Label>
              <Select value={reportFormat} onValueChange={(v) => setReportFormat(v as ReportFormat)}>
                <SelectTrigger id="report-format">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV (Excel)</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="docx">DOCX (Word)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button className="mt-4" onClick={handleGenerateReport}>Generate Report</Button>
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>Backup your current data or restore from a previous backup.</CardDescription>
        </CardHeader>
        <CardContent className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-4 p-6 border rounded-lg">
            <h3 className="text-lg font-medium flex items-center gap-2"><Download /> Export Data</h3>
            <p className="text-sm text-muted-foreground">Download a full backup of all application data (teachers, schools, users, etc.).</p>
            <div className="flex items-end gap-2">
                <div className="flex-1">
                    <Label htmlFor="export-format">Format</Label>
                    <Select value={exportFormat} onValueChange={(v) => setExportFormat(v as BackupFormat)}>
                        <SelectTrigger id="export-format"><SelectValue /></SelectTrigger>
                        <SelectContent>
                        <SelectItem value="json">JSON</SelectItem>
                        <SelectItem value="csv">CSV (Excel)</SelectItem>
                        <SelectItem value="sql">SQL</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Button onClick={handleExport} variant="secondary">Export</Button>
            </div>
          </div>

          <div className="space-y-4 p-6 border rounded-lg">
            <h3 className="text-lg font-medium flex items-center gap-2"><Upload /> Import Data</h3>
            <p className="text-sm text-muted-foreground">Restore data from a backup file. This will overwrite all current data.</p>
             <div className="flex items-end gap-2">
                <div className="flex-1">
                    <Label htmlFor="import-format">Format</Label>
                    <Select value={importFormat} onValueChange={(v) => setImportFormat(v as BackupFormat)}>
                        <SelectTrigger id="import-format"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="json">JSON</SelectItem>
                            <SelectItem value="csv">CSV (Excel)</SelectItem>
                            <SelectItem value="sql">SQL</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Button asChild variant="outline">
                    <label htmlFor="import-file" className="cursor-pointer">
                        <Upload className="mr-2 h-4 w-4" />
                        Choose File
                        <Input id="import-file" type="file" accept=".json,.csv,.sql" className="hidden" onChange={handleImport} />
                    </label>
                </Button>
            </div>
            {importError && (
                <Alert variant="destructive" className="mt-2">
                    <FileWarning className="h-4 w-4" />
                    <AlertDescription>{importError}</AlertDescription>
                </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      <Separator />

      <Card className="border-destructive">
        <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>These actions are irreversible. Please proceed with caution.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex justify-between items-center p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                <div>
                    <h4 className="font-semibold">Clear All Application Data</h4>
                    <p className="text-sm text-muted-foreground">Permanently delete all teachers, schools, leave requests, and non-admin/supervisor users.</p>
                </div>
                <AlertDialog onOpenChange={() => setClearDataConfirmation('')}>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Clear All Data
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete all data in the application except for Admin and Supervisor users. To confirm, please type <strong className="text-destructive-foreground">{CONFIRMATION_TEXT}</strong> below.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <Input
                            value={clearDataConfirmation}
                            onChange={(e) => setClearDataConfirmation(e.target.value)}
                            placeholder={CONFIRMATION_TEXT}
                            className="border-destructive focus-visible:ring-destructive"
                        />
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleClearAllData}
                                className="bg-destructive hover:bg-destructive/90"
                                disabled={clearDataConfirmation !== CONFIRMATION_TEXT}
                            >
                                Yes, Clear All Data
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </CardContent>
      </Card>

    </div>
  );
}

    