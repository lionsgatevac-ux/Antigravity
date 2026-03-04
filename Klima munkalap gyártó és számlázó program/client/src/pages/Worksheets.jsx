import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, MoreVertical, FileText, Receipt, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { useQuery } from '@tanstack/react-query';

const statusMap = {
    draft: { label: 'Piszkozat', variant: 'secondary' },
    in_progress: { label: 'Folyamatban', variant: 'warning' },
    completed: { label: 'Kész', variant: 'success' },
    pending: { label: 'Függőben', variant: 'default' },
    invoiced: { label: 'Számlázva', variant: 'outline' }
};

export default function Worksheets() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');

    const { data: worksheets, isLoading } = useQuery({
        queryKey: ['worksheets'],
        queryFn: async () => {
            const res = await fetch('http://localhost:5000/api/worksheets');
            if (!res.ok) throw new Error('Network response was not ok');
            return res.json();
        }
    });

    const filteredWorksheets = (worksheets || []).filter(ws =>
        (ws.clientName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (ws.id?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Munkalapok</h1>
                    <p className="text-gray-500 mt-1">Kezeld a telepítéseket és karbantartásokat egy helyen.</p>
                </div>
                <Button className="gap-2" onClick={() => navigate('/worksheets/new')}>
                    <Plus size={16} /> Új munkalap
                </Button>
            </div>

            <Card>
                <CardHeader className="pb-4">
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                            <Input
                                placeholder="Keresés ügyfél vagy azonosító alapján..."
                                className="pl-9"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button variant="outline" className="gap-2">
                            <Filter size={16} /> Szűrés
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border border-gray-100 overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-100">
                                <tr>
                                    <th className="px-2 py-3">Azonosító</th>
                                    <th className="px-2 py-3">Ügyfél</th>
                                    <th className="px-2 py-3">Munka típusa</th>
                                    <th className="px-2 py-3">Dátum</th>
                                    <th className="px-2 py-3">Státusz</th>
                                    <th className="px-2 py-3 text-right">Összeg</th>
                                    <th className="px-2 py-3 mx-auto w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {filteredWorksheets.length > 0 ? (
                                    filteredWorksheets.map((ws) => (
                                        <tr key={ws.id} className="hover:bg-gray-50 transition-colors group">
                                            <td className="px-2 py-3 font-medium text-gray-900 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <FileText size={16} className="text-gray-400" />
                                                    {ws.id}
                                                </div>
                                            </td>
                                            <td className="px-2 py-3 max-w-[200px]">
                                                <div className="font-medium text-gray-900 truncate" title={ws.clientName}>{ws.clientName}</div>
                                                <div className="text-xs text-gray-500 truncate" title={ws.clientAddress}>{ws.clientAddress}</div>
                                            </td>
                                            <td className="px-2 py-3 whitespace-nowrap">{ws.workType === 'installation' ? 'Telepítés' : 'Karbantartás'}</td>
                                            <td className="px-2 py-3 text-gray-500 whitespace-nowrap">{ws.workDate}</td>
                                            <td className="px-2 py-3">
                                                <Badge variant="default" className="whitespace-nowrap">
                                                    Kész
                                                </Badge>
                                            </td>
                                            <td className="px-2 py-3 text-right font-medium whitespace-nowrap">
                                                {((ws.laborFee || 0) + (ws.materialCost || 0)).toLocaleString()} Ft
                                            </td>
                                            <td className="px-2 py-3 text-center">
                                                <div className="flex gap-1 justify-end">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-gray-500 hover:text-blue-600"
                                                        onClick={() => window.open(`http://localhost:5000/api/worksheets/${ws.id}/pdf`, '_blank')}
                                                        title="PDF Letöltés"
                                                    >
                                                        <FileText size={18} />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-gray-500 hover:text-green-600"
                                                        onClick={async () => {
                                                            try {
                                                                const res = await fetch(`http://localhost:5000/api/worksheets/${ws.id}/invoice?provider=kft`, { method: 'POST' });
                                                                if (res.ok) {
                                                                    const blob = await res.blob();
                                                                    const pdfBlob = new Blob([blob], { type: 'application/pdf' });
                                                                    const url = window.URL.createObjectURL(pdfBlob);
                                                                    const a = document.createElement('a');
                                                                    a.href = url;
                                                                    a.download = `szamla_eszkoz_${ws.id}.pdf`;
                                                                    a.click();
                                                                } else {
                                                                    const err = await res.json();
                                                                    alert('Eszköz Számla Hiba: ' + (err.message || 'Ismeretlen hiba'));
                                                                }
                                                            } catch (e) {
                                                                alert('Hiba történt: ' + e.message);
                                                            }
                                                        }}
                                                        title="Eszköz Számla (Kft)"
                                                    >
                                                        <Receipt size={18} />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-gray-500 hover:text-orange-600"
                                                        onClick={async () => {
                                                            try {
                                                                const res = await fetch(`http://localhost:5000/api/worksheets/${ws.id}/invoice?provider=ev`, { method: 'POST' });
                                                                if (res.ok) {
                                                                    const blob = await res.blob();
                                                                    const pdfBlob = new Blob([blob], { type: 'application/pdf' });
                                                                    const url = window.URL.createObjectURL(pdfBlob);
                                                                    const a = document.createElement('a');
                                                                    a.href = url;
                                                                    a.download = `szamla_munkadij_${ws.id}.pdf`;
                                                                    a.click();
                                                                } else {
                                                                    const err = await res.json();
                                                                    alert('Munkadíj Számla Hiba: ' + (err.message || 'Ismeretlen hiba'));
                                                                }
                                                            } catch (e) {
                                                                alert('Hiba történt: ' + e.message);
                                                            }
                                                        }}
                                                        title="Munkadíj Számla (EV)"
                                                    >
                                                        <Receipt size={18} className="text-orange-600" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-gray-500 hover:text-blue-600"
                                                        onClick={async () => {
                                                            const email = prompt('Kérem adja meg az email címet:', ws.clientEmail || '');
                                                            if (!email) return;

                                                            try {
                                                                const res = await fetch(`http://localhost:5000/api/worksheets/${ws.id}/email`, {
                                                                    method: 'POST',
                                                                    headers: { 'Content-Type': 'application/json' },
                                                                    body: JSON.stringify({ email })
                                                                });
                                                                const data = await res.json();
                                                                if (res.ok) {
                                                                    alert(data.message);
                                                                } else {
                                                                    alert('Hiba: ' + data.message);
                                                                }
                                                            } catch (e) {
                                                                alert('Hiba történt: ' + e.message);
                                                            }
                                                        }}
                                                        title="Email Küldése"
                                                    >
                                                        <Mail size={18} />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                                            Nincs találat a keresési feltételekre.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
