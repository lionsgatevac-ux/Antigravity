import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, CreditCard, Users, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { hu } from 'date-fns/locale';

export default function Dashboard() {
    const { data: stats, isLoading } = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: async () => {
            const res = await fetch('http://localhost:5000/api/worksheets/stats');
            if (!res.ok) throw new Error('Failed to fetch stats');
            return res.json();
        }
    });

    if (isLoading) {
        return <div className="p-8">Betöltés...</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Vezérlőpult</h1>
                <p className="text-gray-500 mt-1">Áttekintés a vállalkozásod állapotáról.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Összes Bevétel</CardTitle>
                        <CreditCard className="h-4 w-4 text-gray-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{(stats?.totalRevenue || 0).toLocaleString()} Ft</div>
                        <p className="text-xs text-gray-500">{stats?.trend || '0%'} az elmúlt hónaphoz képest</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Aktív Munkalapok</CardTitle>
                        <Activity className="h-4 w-4 text-gray-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.activeWorksheets || 0}</div>
                        <p className="text-xs text-gray-500">Jelenleg folyamatban</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Havi Bevétel</CardTitle>
                        <CreditCard className="h-4 w-4 text-gray-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{(stats?.monthlyRevenue || 0).toLocaleString()} Ft</div>
                        <p className="text-xs text-gray-500">{format(new Date(), 'MMMM', { locale: hu })} hónapban</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Lezárt Munkák</CardTitle>
                        <FileText className="h-4 w-4 text-gray-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.completedWorksheets || 0}</div>
                        <p className="text-xs text-gray-500">Összesen befejezve</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
