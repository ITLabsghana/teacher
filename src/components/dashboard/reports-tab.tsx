
"use client";

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Download, Upload, FileText, FileWarning } from 'lucide-react';
import { useDataContext } from '@/context/data-context';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function ReportsTab() {
  const { teachers, schools, leaveRequests, users, setTeachers, setSchools, setLeaveRequests, setUsers } = useDataContext();
  const { toast } = useToast();
  const [reportType, setReportType] = useState('');
  const [reportFormat, setReportFormat] = useState('pdf');
  const [importError, setImportError] = useState('');

  const handleExport = () => {
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
    toast({ title: "Export Successful", description: "All data has been exported." });
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportError('');
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data = JSON.parse(text);

        // Basic validation
        if (!data.teachers || !data.schools || !data.leaveRequests || !data.users) {
          throw new Error("Invalid backup file format. Missing required data keys.");
        }

        // We can add more robust validation with Zod here in a real-world scenario.

        setTeachers(data.teachers);
        setSchools(data.schools);
        setLeaveRequests(data.leaveRequests);
        setUsers(data.users);

        toast({ title: "Import Successful", description: "All data has been restored from the backup file." });
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
    // In a real application, this would trigger a report generation service.
  }

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
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 space-y-2">
              <Label htmlFor="report-format">Format</Label>
              <Select value={reportFormat} onValueChange={setReportFormat}>
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
        <CardContent className="grid sm:grid-cols-2 gap-8">
          {/* Export Section */}
          <div className="space-y-4 p-6 border rounded-lg">
            <h3 className="text-lg font-medium flex items-center gap-2"><Download /> Export Data</h3>
            <p className="text-sm text-muted-foreground">Download a full backup of all application data (teachers, schools, users, etc.) as a single JSON file.</p>
            <Button onClick={handleExport} variant="secondary">Export All Data</Button>
          </div>

          {/* Import Section */}
          <div className="space-y-4 p-6 border rounded-lg">
            <h3 className="text-lg font-medium flex items-center gap-2"><Upload /> Import Data</h3>
            <p className="text-sm text-muted-foreground">Restore data from a JSON backup file. This will overwrite all existing data in the application.</p>
            <div className="flex flex-col gap-2">
                 <Button asChild variant="outline">
                    <label htmlFor="import-file" className="cursor-pointer">
                        <Upload className="mr-2 h-4 w-4" />
                        Choose Backup File
                        <Input id="import-file" type="file" accept=".json" className="hidden" onChange={handleImport} />
                    </label>
                </Button>
                {importError && (
                    <Alert variant="destructive" className="mt-2">
                        <FileWarning className="h-4 w-4" />
                        <AlertDescription>{importError}</AlertDescription>
                    </Alert>
                )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
