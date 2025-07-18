
"use client";

import { useParams, useRouter } from 'next/navigation';
import { useDataContext } from '@/context/data-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { useMemo, useState } from 'react';
import EnrollmentTab from '@/components/dashboard/enrollment-tab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function SchoolDetailPage() {
    const router = useRouter();
    const params = useParams();
    const { schools } = useDataContext(); // No longer need setSchools here
    const [activeTab, setActiveTab] = useState('overview');

    const schoolId = params.id as string;
    const school = schools.find(s => s.id === schoolId);

    const enrollmentData = useMemo(() => {
        const data = school?.enrollment || {};
        const classLevels = Object.keys(data).sort(); // Sort the existing class levels

        const details = classLevels.map(level => {
            const boys = data[level]?.boys || 0;
            const girls = data[level]?.girls || 0;
            return {
                level,
                boys,
                girls,
                total: boys + girls,
            };
        });

        const totals = details.reduce((acc, item) => {
            acc.totalBoys += item.boys;
            acc.totalGirls += item.girls;
            acc.grandTotal += item.total;
            return acc;
        }, { totalBoys: 0, totalGirls: 0, grandTotal: 0 });

        return { details, ...totals };
    }, [school]);

    if (!school) {
        return <div className="text-center py-10">School not found.</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Schools
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-4xl">{school.name}</CardTitle>
                    <CardDescription>Enrollment Information</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="overview">
                        <TabsList className="mb-4">
                            <TabsTrigger value="overview">Enrollment Overview</TabsTrigger>
                            <TabsTrigger value="manage">Manage Enrollment</TabsTrigger>
                        </TabsList>
                        <TabsContent value="overview">
                            {enrollmentData.details.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Class</TableHead>
                                            <TableHead>Boys</TableHead>
                                            <TableHead>Girls</TableHead>
                                            <TableHead>Total Students</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {enrollmentData.details.map(item => (
                                            <TableRow key={item.level}>
                                                <TableCell className="font-medium">{item.level}</TableCell>
                                                <TableCell>{item.boys}</TableCell>
                                                <TableCell>{item.girls}</TableCell>
                                                <TableCell>{item.total}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                    <TableFooter>
                                        <TableRow>
                                            <TableCell colSpan={4} className="p-0">
                                                <div className="flex justify-end gap-8 font-bold bg-muted p-4 mt-4 rounded-b-lg">
                                                    <span>Total Boys: {enrollmentData.totalBoys}</span>
                                                    <span>Total Girls: {enrollmentData.totalGirls}</span>
                                                    <span>Grand Total: {enrollmentData.grandTotal}</span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    </TableFooter>
                                </Table>
                            ) : (
                                <div className="text-center py-10 text-muted-foreground">
                                    No enrollment data has been added for this school.
                                </div>
                            )}
                        </TabsContent>
                        <TabsContent value="manage">
                            <EnrollmentTab 
                                schools={schools} 
                                selectedSchoolId={schoolId} 
                                onSave={() => setActiveTab('overview')} 
                            />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}
