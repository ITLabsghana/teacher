
"use client";

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
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
import type { School, Teacher, LeaveRequest, User } from '@/lib/types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Document, Packer, Paragraph, TextRun, Table as DocxTable, TableRow, TableCell, WidthType } from 'docx';
import { saveAs } from 'file-saver';


type ReportFormat = 'csv' | 'pdf' | 'docx';
type BackupFormat = 'json' | 'csv' | 'sql';

type ReportHeader = { key: string; label: string };

export default function ReportsTab() {
  const {
    teachers, schools, leaveRequests, users,
    setTeachers, setSchools, setLeaveRequests, setUsers
  } = useDataContext();
  const { toast } = useToast();

  const [reportType, setReportType] = useState('');
  const [reportFormat, setReportFormat] = useState<ReportFormat>('csv');
  const [exportFormat, setExportFormat] = useState<BackupFormat>('json');
  const [importFormat, setImportFormat] = useState<BackupFormat>('json');
  const [importError, setImportError] = useState('');
  const [clearDataConfirmation, setClearDataConfirmation] = useState('');

  const CONFIRMATION_TEXT = 'DELETE ALL DATA';

  // --- CSV Generation ---
  const downloadCSV = (csvContent: string, fileName: string) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, fileName);
  };
  
  const arrayToCSV = (data: any[], headers: ReportHeader[]): string => {
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

  // --- PDF Generation ---
  const generatePdf = (data: any[], headers: ReportHeader[], title: string, fileName: string) => {
    const doc = new jsPDF();
    doc.text(title, 14, 16);
    autoTable(doc, {
        head: [headers.map(h => h.label)],
        body: data.map(row => headers.map(h => {
            const value = row[h.key] ?? '';
            return value instanceof Date ? value.toLocaleDateString() : value;
        })),
        startY: 20,
    });
    doc.save(fileName);
  };

  // --- DOCX Generation ---
  const generateDocx = (data: any[], headers: ReportHeader[], title: string, fileName: string) => {
      const tableRows = [
        new TableRow({
            children: headers.map(h => new TableCell({ children: [new Paragraph({ text: h.label, style: 'strong' })], width: { size: 4500, type: WidthType.DXA } })),
        }),
        ...data.map(row => new TableRow({
            children: headers.map(h => {
                const value = row[h.key] ?? '';
                const text = value instanceof Date ? value.toLocaleDateString() : String(value);
                return new TableCell({ children: [new Paragraph(text)] });
            })
        }))
      ];
      
      const table = new DocxTable({
          rows: tableRows,
          width: {
              size: 100,
              type: WidthType.PERCENTAGE,
          },
      });

      const doc = new Document({
        styles: {
            paragraphStyles: [
                { id: "strong", name: "Strong", run: { bold: true } },
                { id: "heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 28, bold: true } },
            ]
        },
        sections: [{
            children: [
                new Paragraph({ text: title, style: "heading1", spacing: { after: 200 } }),
                table
            ],
        }],
      });

      Packer.toBlob(doc).then(blob => {
        saveAs(blob, fileName);
      });
  };

  const handleGenerateReport = () => {
    if (!reportType) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please select a report type.' });
        return;
    }

    let data: any[] = [];
    let headers: ReportHeader[] = [];
    let title = '';
    const getSchoolName = (schoolId?: string) => schools.find(s => s.id === schoolId)?.name || 'N/A';
    
    switch (reportType) {
        case 'teacher-list':
            title = 'Teacher List';
            headers = [
                { key: 'staffId', label: 'Staff ID' }, { key: 'firstName', label: 'First Name' }, { key: 'lastName', label: 'Last Name' },
                { key: 'email', label: 'Email' }, { key: 'phoneNo', label: 'Phone No.' }, { key: 'gender', label: 'Gender' },
                { key: 'rank', label: 'Rank' }, { key: 'job', label: 'Job' }, { key: 'currentSchool', label: 'Current School' },
                { key: 'firstAppointmentDate', label: 'First Appointment Date' },
            ];
            data = teachers.map(t => ({ ...t, currentSchool: getSchoolName(t.schoolId) }));
            break;
        case 'school-enrollment':
            title = 'School Enrollment Summary';
            headers = [
                { key: 'schoolName', label: 'School Name' }, { key: 'classLevel', label: 'Class' }, { key: 'boys', label: 'Boys' },
                { key: 'girls', label: 'Girls' }, { key: 'total', label: 'Total Students' },
            ];
            schools.forEach(school => {
                if (school.enrollment && Object.keys(school.enrollment).length > 0) {
                    Object.entries(school.enrollment).forEach(([classLevel, { boys, girls }]) => {
                        data.push({ schoolName: school.name, classLevel, boys, girls, total: (boys || 0) + (girls || 0) });
                    });
                } else {
                    data.push({ schoolName: school.name, classLevel: 'N/A', boys: 0, girls: 0, total: 0 });
                }
            });
            break;
        case 'leave-summary':
            title = 'Leave Summary';
            headers = [
                { key: 'teacherName', label: 'Teacher Name' }, { key: 'leaveType', label: 'Leave Type' },
                { key: 'startDate', label: 'Start Date' }, { key: 'returnDate', label: 'Return Date' }, { key: 'status', label: 'Status' },
            ];
            data = leaveRequests.map(req => ({
                teacherName: getTeacherName(req.teacherId), ...req
            }));
            break;
        case 'general-report':
            title = 'General Institution Report';
            const totalStudents = schools.reduce((sum, school) => sum + Object.values(school.enrollment || {}).reduce((acc, curr) => acc + (curr.boys || 0) + (curr.girls || 0), 0), 0);
            headers = [{ key: 'metric', label: 'Metric' }, { key: 'value', label: 'Value' }];
            data = [
                { metric: 'Total Teachers', value: teachers.length }, { metric: 'Total Schools', value: schools.length },
                { metric: 'Total Students', value: totalStudents }, { metric: 'Total Leave Requests', value: leaveRequests.length },
                { metric: 'Approved Leave Requests', value: leaveRequests.filter(r => r.status === 'Approved').length },
            ];
            break;
        default:
            toast({ variant: 'destructive', title: 'Error', description: 'Unknown report type.' });
            return;
    }

    const fileName = `${reportType}-${new Date().toISOString().split('T')[0]}.${reportFormat}`;

    if (reportFormat === 'csv') {
        const csvContent = arrayToCSV(data, headers);
        downloadCSV(csvContent, fileName);
    } else if (reportFormat === 'pdf') {
        generatePdf(data, headers, title, fileName);
    } else if (reportFormat === 'docx') {
        generateDocx(data, headers, title, fileName);
    }

    toast({ title: 'Report Generated', description: `${title} has been successfully exported as a ${reportFormat.toUpperCase()} file.` });
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
    saveAs(blob, `teacher-management-backup-${new Date().toISOString().split('T')[0]}.json`);
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
      event.target.value = '';
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
    event.target.value = '';
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
