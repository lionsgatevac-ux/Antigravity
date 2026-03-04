const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/worksheets.json');

// Helper to read data
const getWorksheets = () => {
    try {
        if (!fs.existsSync(DB_PATH)) {
            fs.writeFileSync(DB_PATH, '[]');
            return [];
        }
        const data = fs.readFileSync(DB_PATH, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Error reading DB:', err);
        return [];
    }
};

// Helper to write data
const saveWorksheets = (worksheets) => {
    try {
        fs.writeFileSync(DB_PATH, JSON.stringify(worksheets, null, 2));
    } catch (err) {
        console.error('Error writing DB:', err);
    }
};

exports.getAllWorksheets = (req, res) => {
    const worksheets = getWorksheets();
    res.json(worksheets);
};

exports.createWorksheet = (req, res) => {
    const worksheets = getWorksheets();
    const newWorksheet = {
        id: `WL-${Date.now()}`,
        ...req.body,
        status: 'draft',
        createdAt: new Date().toISOString()
    };
    worksheets.push(newWorksheet);
    saveWorksheets(worksheets);
    res.status(201).json(newWorksheet);
};

exports.getDashboardStats = (req, res) => {
    const stats = {
        activeCount: worksheets.filter(w => w.status === 'in_progress' || w.status === 'pending').length,
        monthlyRevenue: worksheets
            .filter(w => w.status === 'completed' || w.status === 'invoiced')
            .reduce((sum, w) => sum + (w.laborFee || 0) + (w.materialCost || 0), 0),
        pendingReports: worksheets.filter(w => w.status === 'completed').length
    };
    res.json(stats);
};

const { generateWorksheetPDF } = require('../utils/pdfGenerator');

// ... existing code ...

exports.downloadPDF = (req, res) => {
    const worksheets = getWorksheets();
    const worksheet = worksheets.find(w => w.id === req.params.id);
    if (!worksheet) {
        return res.status(404).json({ message: 'Munkalap nem található' });
    }

    const stream = res.writeHead(200, {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment;filename=munkalap_${worksheet.id}.pdf`,
    });

    generateWorksheetPDF(
        worksheet,
        (chunk) => stream.write(chunk),
        () => stream.end()
    );
};

const { createInvoice } = require('../utils/szamlazz');

exports.getDashboardStats = (req, res) => {
    const worksheets = getWorksheets();
    const totalRevenue = worksheets.reduce((sum, ws) => sum + (Number(ws.laborFee) || 0) + (Number(ws.materialCost) || 0), 0);
    const activeWorksheets = worksheets.filter(ws => ws.status !== 'completed' && ws.status !== 'invoiced').length;
    //...
    const completedWorksheets = worksheets.filter(ws => ws.status === 'completed' || ws.status === 'invoiced').length;

    // Calculate monthly revenue (simple current month for now)
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const monthlyRevenue = worksheets
        .filter(ws => ws.workDate && ws.workDate.startsWith(currentMonth))
        .reduce((sum, ws) => sum + (Number(ws.laborFee) || 0) + (Number(ws.materialCost) || 0), 0);

    // Mock trend (randomized for liveliness if needed, or 0)
    const trend = '+12%';

    res.json({
        totalRevenue,
        monthlyRevenue,
        activeWorksheets,
        completedWorksheets,
        trend
    });
};

exports.createInvoice = async (req, res) => {
    const worksheets = getWorksheets();
    const worksheet = worksheets.find(w => w.id === req.params.id);
    if (!worksheet) {
        return res.status(404).json({ message: 'Munkalap nem található' });
    }

    const provider = req.query.provider || 'kft'; // 'kft' or 'ev'

    try {
        const pdfBuffer = await createInvoice(worksheet, provider);

        console.log(`Invoice PDF generated for ${provider}. Type:`, typeof pdfBuffer, 'IsBuffer:', Buffer.isBuffer(pdfBuffer), 'Length:', pdfBuffer ? pdfBuffer.length : 'N/A');

        // Check for PDF signature
        if (!Buffer.isBuffer(pdfBuffer) || pdfBuffer.toString('utf8', 0, 4) !== '%PDF') {
            console.error('Invalid PDF content (not %PDF):', pdfBuffer.toString('utf8', 0, 100));
            throw new Error('A Számlázz.hu nem PDF-et küldött vissza. Valószínűleg hiba történt az adatokban.');
        }

        const filename = provider === 'ev' ? `szamla_munkadij_${worksheet.id}.pdf` : `szamla_eszkoz_${worksheet.id}.pdf`;

        res.writeHead(200, {
            'Content-Type': 'application/pdf',
            'Content-Length': pdfBuffer.length,
            'Content-Disposition': `attachment;filename=${filename}`,
            'szlahu_szamlaszam': 'DEMO' // In header
        });
        res.end(pdfBuffer);
    } catch (error) {
        console.error('Invoice Error:', error);
        res.status(500).json({ message: error.message || 'Számla készítése sikertelen' });
    }
};

exports.getWorksheetById = (req, res) => {
    const worksheets = getWorksheets();
    const worksheet = worksheets.find(w => w.id === req.params.id);
    if (!worksheet) {
        return res.status(404).json({ message: 'Munkalap nem található' });
    }
    res.json(worksheet);
};

const SETTINGS_PATH = path.join(__dirname, '../data/settings.json');

exports.getSettings = (req, res) => {
    try {
        if (!fs.existsSync(SETTINGS_PATH)) {
            return res.json({});
        }
        const data = fs.readFileSync(SETTINGS_PATH, 'utf8');
        res.json(JSON.parse(data));
    } catch (err) {
        console.error('Error reading settings:', err);
        res.json({});
    }
};

exports.updateSettings = (req, res) => {
    try {
        fs.writeFileSync(SETTINGS_PATH, JSON.stringify(req.body, null, 2));
        res.json({ message: 'Beállítások mentve' });
    } catch (err) {
        console.error('Error saving settings:', err);
        res.status(500).json({ message: 'Mentés sikertelen' });
    }
};

const { sendEmail } = require('../utils/emailService');
const { createWorksheetPDFBuffer } = require('../utils/pdfGenerator');

exports.sendInvoiceEmail = async (req, res) => {
    const { email } = req.body;
    const worksheetId = req.params.id;

    if (!email) {
        return res.status(400).json({ message: 'Email cím megadása kötelező' });
    }

    const worksheets = getWorksheets();
    const worksheet = worksheets.find(w => w.id === worksheetId);

    if (!worksheet) {
        return res.status(404).json({ message: 'Munkalap nem található' });
    }

    try {
        const attachments = [];

        // 1. Worksheet PDF
        try {
            const worksheetPdf = await createWorksheetPDFBuffer(worksheet);
            attachments.push({
                filename: `munkalap_${worksheetId}.pdf`,
                content: worksheetPdf
            });
        } catch (e) {
            console.error('Worksheet PDF gen error:', e);
        }

        // 2. Kft Invoice
        try {
            const kftPdf = await createInvoice(worksheet, 'kft');
            if (Buffer.isBuffer(kftPdf) && kftPdf.toString('utf8', 0, 4) === '%PDF') {
                attachments.push({
                    filename: `szamla_eszkoz_${worksheetId}.pdf`,
                    content: kftPdf
                });
            }
        } catch (e) {
            console.log('Skipping Kft invoice:', e.message);
        }

        // 3. EV Invoice
        try {
            const evPdf = await createInvoice(worksheet, 'ev');
            if (Buffer.isBuffer(evPdf) && evPdf.toString('utf8', 0, 4) === '%PDF') {
                attachments.push({
                    filename: `szamla_munkadij_${worksheetId}.pdf`,
                    content: evPdf
                });
            }
        } catch (e) {
            console.log('Skipping EV invoice:', e.message);
        }

        if (attachments.length === 0) {
            return res.status(400).json({ message: 'Nem sikerült dokumentumokat generálni.' });
        }

        await sendEmail({
            to: email,
            subject: `Munkalap és Számlák - ${worksheetId}`,
            html: `
                <h1>Tisztelt Ügyfelünk!</h1>
                <p>Mellékelten küldjük a(z) <strong>${worksheetId}</strong> azonosítójú munkalaphoz tartozó dokumentumokat (Munkalap, Számlák).</p>
                <p>Üdvözlettel,<br>Klíma Munkalap Csapat</p>
            `,
            attachments
        });

        res.json({ message: 'Email sikeresen elküldve!' });

    } catch (error) {
        console.error('Email sending error:', error);
        res.status(500).json({ message: 'Email küldése sikertelen: ' + error.message });
    }
};
