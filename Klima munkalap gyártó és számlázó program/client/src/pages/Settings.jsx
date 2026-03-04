import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Settings() {
    const [settings, setSettings] = useState({
        companyName: '',
        taxNumber: '',
        szamlazzKey: ''
    });

    useEffect(() => {
        fetch('http://localhost:5000/api/worksheets/settings')
            .then(res => res.json())
            .then(data => setSettings(prev => ({ ...prev, ...data })))
            .catch(console.error);
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/worksheets/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });
            if (res.ok) alert('Beállítások mentve!');
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Beállítások</h1>
                <p className="text-gray-500 mt-1">Szervezd a fiókod és a számlázási adataidat.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Cégadatok</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="companyName">Cégnév</Label>
                        <Input
                            id="companyName"
                            name="companyName"
                            value={settings.companyName}
                            onChange={handleChange}
                            placeholder="Pl. KlimaMester Kft."
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="taxNumber">Adószám</Label>
                        <Input
                            id="taxNumber"
                            name="taxNumber"
                            value={settings.taxNumber}
                            onChange={handleChange}
                            placeholder="12345678-2-42"
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Számlázz.hu Integráció</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="p-4 bg-blue-50 text-blue-800 rounded-md text-sm border border-blue-100">
                        A számlázás automatizálásához a Számla Agent kulcs szükséges.
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="szamlazzKey">Számla Agent Kulcs</Label>
                        <div className="flex gap-2">
                            <Input
                                id="szamlazzKey"
                                name="szamlazzKey"
                                value={settings.szamlazzKey}
                                onChange={handleChange}
                                type="password"
                                placeholder="npcw..."
                                className="flex-1"
                            />
                        </div>
                    </div>

                    <div className="flex justify-between items-center pt-2">
                        <Button variant="outline" onClick={() => window.open('https://www.szamlazz.hu/szamla/?oldal=szamla_agent_szerkesztes', '_blank')}>
                            Kulcs igénylése (Számlázz.hu)
                        </Button>
                        <Button onClick={handleSave}>Beállítások Mentése</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
