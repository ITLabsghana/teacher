
"use client";

import { useParams, useRouter } from 'next/navigation';
import { useDataContext } from '@/context/data-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { useMemo } from 'react';
import EnrollmentTab from '@/components/dashboard/enrollment-tab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const allClassLevels = [
  'KG1', 'KG2', 
  'Basic 1', 'Basic 2', 'Basic 3', 'Basic 4', 'Basic 5', 'Basic 6',
  'J.H.S 1', 'J.H.S 2', 'J.H.S 3',
  'S.H.S 1', 'S.H.S 2', 'S.H.S 3'
];

export default function SchoolDetailPage() {
    const router = useRouter();
    const params = useParams();
    const { schools, setSchools } = useDataContext();

    const schoolId = params.id as string;
    const school = schools.find(s => s.id === schoolId);

    const enrollmentData = useMemo(() => {
        const data = school?.enrollment || {};
        const totals = allClassLevels.reduce((acc, level) => {
            const boys = data[level]?.boys || 0;
            const girls = data[level]?.girls || 0;
            acc.totalBoys += boys;
            acc.totalGirls += girls;
            acc.grandTotal += boys + girls;
            return acc;
        }, { totalBoys: 0, totalGirls: 0, grandTotal: 0 });

        return {
            details: allClassLevels.map(level => {
                const boys = data[level]?.boys || 0;
                const girls = data[level]?.girls || 0;
                return {
                    level,
                    boys,
                    girls,
                    total: boys + girls,
                };
            }),
            ...totals,
        };
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
                    <Tabs defaultValue="overview">
                        <TabsList className="mb-4">
                            <TabsTrigger value="overview">Enrollment Overview</TabsTrigger>
                            <TabsTrigger value="manage">Manage Enrollment</TabsTrigger>
                        </TabsList>
                        <TabsContent value="overview">
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
                        </TabsContent>
                        <TabsContent value="manage">
                            <EnrollmentTab schools={schools} setSchools={setSchools} />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}