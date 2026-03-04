import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import SignaturePad from '@/components/SignaturePad';

// Form schema definition
const worksheetSchema = z.object({
    clientName: z.string().min(2, "Név megadása kötelező"),
    clientAddress: z.string().min(5, "Cím megadása kötelező"),
    clientPhone: z.string().min(1, "Telefonszám kötelező"),
    clientEmail: z.string().email("Érvénytelen email cím").optional().or(z.literal('')),

    workType: z.enum(['installation', 'maintenance', 'repair', 'service']),
    workDate: z.string(),

    deviceManufacturer: z.string().min(1, "Gyártó megadása kötelező"),
    deviceType: z.string().min(1, "Típus megadása kötelező"),
    deviceSerial: z.string().optional(),
    refrigerantType: z.string().optional(),

    workDescription: z.string().optional(),
    materials: z.array(z.object({
        name: z.string(),
        quantity: z.number(),
        price: z.number()
    })).optional(),

    laborFee: z.number().min(0),
    materialCost: z.number().min(0),
    devicePrice: z.number().min(0).optional(),
});

export default function CreateWorksheet() {
    const navigate = useNavigate();
    const [signatureData, setSignatureData] = useState(null);
    const form = useForm({
        resolver: zodResolver(worksheetSchema),
        defaultValues: {
            workType: 'installation',
            workDate: new Date().toISOString().split('T')[0],
            laborFee: 0,
            materialCost: 0,
            devicePrice: 0,
            materials: []
        }
    });

    const fillTestData = () => {
        form.setValue('clientName', 'Teszt Elek');
        form.setValue('clientAddress', '1134 Budapest, Váci út 99.');
        form.setValue('clientPhone', '+36 30 123 4567');
        form.setValue('clientEmail', 'teszt@elek.hu');
        form.setValue('workType', 'installation');
        form.setValue('workDate', new Date().toISOString().split('T')[0]);
        form.setValue('deviceManufacturer', 'Gree');
        form.setValue('deviceType', 'Pulse 3.5kW');
        form.setValue('deviceSerial', 'SN-' + Math.floor(Math.random() * 1000000));
        form.setValue('refrigerantType', 'R32');
        form.setValue('laborFee', 45000);
        form.setValue('materialCost', 12500);
        form.setValue('devicePrice', 250000);
    };

    const onSubmit = async (data) => {
        try {
            const payload = { ...data, clientSignature: signatureData };
            const response = await fetch('http://localhost:5000/api/worksheets', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error('Hiba történt a mentés során');
            }

            await response.json();
            navigate('/worksheets');
        } catch (error) {
            console.error('Mentési hiba:', error);
            alert('Sikertelen mentés: ' + error.message);
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/worksheets')}>
                        <ArrowLeft size={20} />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Új Munkalap</h1>
                        <p className="text-gray-500 mt-1">Hozz létre egy új munkalapot a helyszíni munkavégzéshez.</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={fillTestData} type="button" className="gap-2">
                        <Wand2 size={16} /> Teszt adat
                    </Button>
                    <Button onClick={form.handleSubmit(onSubmit)} className="gap-2">
                        <Save size={16} /> Mentés
                    </Button>
                </div>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Ügyfél Adatok */}
                <Card>
                    <CardHeader>
                        <CardTitle>Ügyfél adatok</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Név</label>
                            <Input {...form.register('clientName')} placeholder="Kovács János" />
                            {form.formState.errors.clientName && <p className="text-red-500 text-xs">{form.formState.errors.clientName.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Cím</label>
                            <Input {...form.register('clientAddress')} placeholder="1052 Budapest..." />
                            {form.formState.errors.clientAddress && <p className="text-red-500 text-xs">{form.formState.errors.clientAddress.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Telefonszám</label>
                            <Input {...form.register('clientPhone')} placeholder="+36 30 123 4567" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Email</label>
                            <Input {...form.register('clientEmail')} placeholder="pelda@email.hu" />
                        </div>
                    </CardContent>
                </Card>

                {/* Munka Részletei */}
                <Card>
                    <CardHeader>
                        <CardTitle>Munka részletei</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Munka típusa</label>
                            <select
                                {...form.register('workType')}
                                className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 border-input"
                            >
                                <option value="installation">Telepítés</option>
                                <option value="maintenance">Karbantartás</option>
                                <option value="repair">Javítás</option>
                                <option value="service">Szerviz</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Dátum</label>
                            <Input type="date" {...form.register('workDate')} />
                        </div>
                    </CardContent>
                </Card>

                {/* Készülék Adatok */}
                <Card>
                    <CardHeader>
                        <CardTitle>Készülék adatok</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Gyártó</label>
                            <Input {...form.register('deviceManufacturer')} placeholder="Gree, Daikin..." />
                            {form.formState.errors.deviceManufacturer && <p className="text-red-500 text-xs">{form.formState.errors.deviceManufacturer.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Típus</label>
                            <Input {...form.register('deviceType')} placeholder="GWH12..." />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Sorozatszám</label>
                            <Input {...form.register('deviceSerial')} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Hűtőközeg</label>
                            <Input {...form.register('refrigerantType')} placeholder="R32" />
                        </div>
                    </CardContent>
                </Card>

                {/* Pénzügyek */}
                <Card>
                    <CardHeader>
                        <CardTitle>Költségek</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Készülék ár (Kft - 27% ÁFA)</label>
                            <Input type="number" {...form.register('devicePrice', { valueAsNumber: true })} placeholder="0" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Munkadíj (EV - 0% ÁFA)</label>
                            <Input type="number" {...form.register('laborFee', { valueAsNumber: true })} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Anyagköltség (EV - 0% ÁFA)</label>
                            <Input type="number" {...form.register('materialCost', { valueAsNumber: true })} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Összesen (Ft)</label>
                            <div className="flex h-10 w-full items-center rounded-md border border-gray-200 bg-gray-50 px-3 text-sm font-semibold">
                                {(form.watch('laborFee') || 0) + (form.watch('materialCost') || 0) + (form.watch('devicePrice') || 0)} Ft
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Aláírás */}
                <Card>
                    <CardHeader>
                        <CardTitle>Aláírás</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {signatureData ? (
                            <div className="space-y-4">
                                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                    <img src={signatureData} alt="Ügyfél aláírása" className="max-h-40" />
                                </div>
                                <Button variant="outline" onClick={() => setSignatureData(null)} type="button">
                                    Új aláírás
                                </Button>
                            </div>
                        ) : (
                            <div className="border border-gray-200 rounded-lg overflow-hidden">
                                <SignaturePad
                                    onSave={(data) => setSignatureData(data)}
                                    onCancel={() => { }}
                                />
                            </div>
                        )}
                    </CardContent>
                </Card>
            </form>
        </div>
    );
}
