const PDFDocument = require('pdfkit');
const fs = require('fs');

function generateWorksheetPDF(worksheet, dataCallback, endCallback) {
    const doc = new PDFDocument({ margin: 50 });

    doc.on('data', dataCallback);
    doc.on('end', endCallback);

    // --- Header ---
    doc.fontSize(20).text('MUNKALAP', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Munkalap szám: ${worksheet.id}`, { align: 'right' });
    doc.text(`Dátum: ${worksheet.workDate}`, { align: 'right' });
    doc.moveDown();

    // --- Client Info ---
    doc.rect(50, 130, 500, 85).stroke();
    doc.fontSize(14).text('Ügyfél Adatok', 60, 140);
    doc.fontSize(10)
        .text(`Név: ${worksheet.clientName}`, 60, 160)
        .text(`Cím: ${worksheet.clientAddress}`, 60, 175)
        .text(`Telefon: ${worksheet.clientPhone}`, 60, 190)
        .text(`Email: ${worksheet.clientEmail || '-'}`, 60, 205);

    // --- Device Info ---
    doc.rect(50, 230, 500, 85).stroke();
    doc.fontSize(14).text('Készülék Adatok', 60, 240);
    doc.fontSize(10)
        .text(`Gyártó: ${worksheet.deviceManufacturer}`, 60, 260)
        .text(`Típus: ${worksheet.deviceType}`, 250, 260)
        .text(`Sorozatszám: ${worksheet.deviceSerial || '-'}`, 60, 280)
        .text(`Hűtőközeg: ${worksheet.refrigerantType || '-'}`, 250, 280);

    // --- Work Details ---
    doc.moveDown(8);
    doc.fontSize(14).text('Elvégzett Munka');
    doc.fontSize(10).text(`Típus: ${translateWorkType(worksheet.workType)}`);
    doc.moveDown();
    if (worksheet.workDescription) {
        doc.text(`Leírás: ${worksheet.workDescription}`);
    }
    doc.moveDown();

    // --- Financials ---
    doc.fontSize(14).text('Költségek');
    const tableTop = doc.y + 10;

    doc.fontSize(10);
    doc.text('Tétel', 50, tableTop);
    doc.text('Összeg', 450, tableTop, { width: 90, align: 'right' });
    doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

    let position = tableTop + 25;

    // Labor
    doc.text('Munkadíj', 50, position);
    doc.text(`${formatCurrency(worksheet.laborFee)}`, 450, position, { width: 90, align: 'right' });
    position += 20;

    // Materials
    doc.text('Anyagköltség', 50, position);
    doc.text(`${formatCurrency(worksheet.materialCost)}`, 450, position, { width: 90, align: 'right' });
    position += 20;

    // Total
    doc.moveTo(50, position).lineTo(550, position).stroke();
    position += 10;
    doc.font('Helvetica-Bold').text('ÖSSZESEN FIZETENDŐ:', 50, position);
    doc.text(`${formatCurrency((worksheet.laborFee || 0) + (worksheet.materialCost || 0))}`, 450, position, { width: 90, align: 'right' });

    // --- Signature ---
    if (worksheet.clientSignature) {
        doc.moveDown(5);
        doc.text('Aláírás:', 50);
        try {
            // The signature is a data URL (base64)
            const base64Data = worksheet.clientSignature.split(',')[1];
            const imgBuffer = Buffer.from(base64Data, 'base64');
            doc.image(imgBuffer, 50, doc.y + 10, { width: 150 });
            doc.text('Ügyfél aláírása', 50, doc.y + 70);
        } catch (e) {
            doc.text('(Aláírás hiba)', 50, doc.y + 20);
            console.error('Signature error:', e);
        }
    }

    doc.end();
}

function translateWorkType(type) {
    const map = {
        'installation': 'Telepítés',
        'maintenance': 'Karbantartás',
        'repair': 'Javítás',
        'service': 'Szerviz'
    };
    return map[type] || type;
}

function formatCurrency(amount) {
    if (!amount) return '0 Ft';
    return new Intl.NumberFormat('hu-HU', { style: 'currency', currency: 'HUF', maximumFractionDigits: 0 }).format(amount);
}


function createWorksheetPDFBuffer(worksheet) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        try {
            generateWorksheetPDF(worksheet,
                (chunk) => chunks.push(chunk),
                () => resolve(Buffer.concat(chunks))
            );
        } catch (err) {
            reject(err);
        }
    });
}

module.exports = { generateWorksheetPDF, createWorksheetPDFBuffer };
