
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

type ReportFormat = 'pdf' | 'docx' | 'csv';
type BackupFormat = 'json' | 'csv' | 'sql';

export default function ReportsTab() {
  const { 
    teachers, schools, leaveRequests, users, 
    setTeachers, setSchools, setLeaveRequests, setUsers 
  } = useDataContext();
  const { toast } = useToast();
  
  const [reportType, setReportType] = useState('');
  const [reportFormat, setReportFormat] = useState<ReportFormat>('pdf');
  const [exportFormat, setExportFormat] = useState<BackupFormat>('json');
  const [importFormat, setImportFormat] = useState<BackupFormat>('json');
  const [importError, setImportError] = useState('');

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
        
        // Merge teachers
        setTeachers(prev => {
            const existingIds = new Set(prev.map(t => t.id));
            const newTeachers = (data.teachers as Teacher[]).filter(t => !existingIds.has(t.id));
            return [...prev, ...newTeachers];
        });

        // Merge schools
        setSchools(prev => {
            const existingIds = new Set(prev.map(s => s.id));
            const newSchools = (data.schools as School[]).filter(s => !existingIds.has(s.id));
            return [...prev, ...newSchools];
        });
        
        // Merge leave requests
        setLeaveRequests(prev => {
            const existingIds = new Set(prev.map(l => l.id));
            const newLeaveRequests = (data.leaveRequests as LeaveRequest[]).filter(l => !existingIds.has(l.id));
            return [...prev, ...newLeaveRequests];
        });
        
        // Merge users
        setUsers(prev => {
            const existingIds = new Set(prev.map(u => u.id));
            const newUsers = (data.users as User[]).filter(u => !existingIds.has(u.id));
            return [...prev, ...newUsers];
        });

        toast({ title: "Import Successful", description: "Data has been successfully merged from the backup file." });
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
  
  const handleGenerateReport = () => {
    if (!reportType) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Please select a report type.',
        });
        return;
    }
    toast({
        title: 'Report Generation',
        description: `Generating ${reportType} report as ${reportFormat}. (This is a placeholder action)`,
    });
  };

  const handleClearAllData = () => {
    setTeachers([]);
    setSchools([]);
    setLeaveRequests([]);
    
    // Preserve the default admin user
    const adminUser = users.find(u => u.username === 'Prof' && u.role === 'Admin');
    const adminUserBlueprint: User = {
        id: crypto.randomUUID(),
        username: 'Prof',
        email: 'admin@example.com',
        password: 'Incre@com0248',
        role: 'Admin',
    };
    setUsers(adminUser ? [adminUser] : [adminUserBlueprint]);

    toast({ title: "All Data Cleared", description: "The application data has been reset." });
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
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="docx">DOCX (Word)</SelectItem>
                  <SelectItem value="csv">CSV (Excel)</SelectItem>
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
            <p className="text-sm text-muted-foreground">Merge data from a backup file. Existing records will be ignored.</p>
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
                    <p className="text-sm text-muted-foreground">Permanently delete all teachers, schools, leave requests, and non-admin users.</p>
                </div>
                <AlertDialog>
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
                                This action cannot be undone. This will permanently delete all data in the application except for the default admin user. Are you sure you want to proceed?
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleClearAllData} className="bg-destructive hover:bg-destructive/90">
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
