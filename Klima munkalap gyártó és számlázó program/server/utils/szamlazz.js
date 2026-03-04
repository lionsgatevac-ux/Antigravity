const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { create } = require('xmlbuilder2');
const PDFDocument = require('pdfkit');

const SZAMLAZZ_API_URL = 'https://www.szamlazz.hu/szamla/';
const SETTINGS_PATH = path.join(__dirname, '../data/settings.json');

function getApiKey(provider = 'kft') {
    try {
        if (fs.existsSync(SETTINGS_PATH)) {
            const settings = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'));
            if (provider === 'ev' && settings.evSzamlazzKey) return settings.evSzamlazzKey.trim();
            if (provider === 'kft' && settings.szamlazzKey) return settings.szamlazzKey.trim();
        }
    } catch (e) {
        console.error('Error reading settings:', e);
    }
    // Fallback for dev/env
    return process.env.SZAMLAZZ_KEY ? process.env.SZAMLAZZ_KEY.trim() : null;
}

async function createInvoice(worksheet, provider = 'kft') {
    const apiKey = getApiKey(provider);

    // Check if key is present and not the placeholder
    if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
        console.warn(`Számlázz.hu API key missing for ${provider}, generating DEMO invoice locally.`);
        return createDemoInvoice(worksheet, provider);
    }

    try {
        return await sendToSzamlazzHu(worksheet, apiKey, provider);
    } catch (error) {
        // Log error but throw it so the controller knows it failed
        console.error('Invoice generation failed:', error.message);
        throw error;
    }
}

async function sendToSzamlazzHu(worksheet, apiKey, provider) {
    // 1. Construct XML
    const xmlObj = {
        'xmlszamla': {
            '@xmlns': 'http://www.szamlazz.hu/xmlszamla',
            '@version': '2021.06.01',
            'beallitasok': {
                'szamlaagentkulcs': apiKey,
                'eszamla': 'true',
                'szamlaLetoltes': 'true',
                'valaszVerzio': '2'
            },
            'fejlec': {
                'keltDatum': new Date().toISOString().split('T')[0],
                'teljesitesDatum': worksheet.workDate,
                'fizetesiHataridoDatum': new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                'fizmod': 'Átutalás',
                'penznem': 'HUF',
                'szamlaNyelve': 'hu',
                'megjegyzes': `Munkalap száma: ${worksheet.id} (${provider === 'ev' ? 'Munkadíj' : 'Eszköz'})`,
                'rendelesSzam': `${worksheet.id}-${provider}-${Date.now().toString(36)}`,
                'dijbekero': 'false'
            },
            'elado': {
                'bank': 'OTP Bank',
                'bankszamlaszam': '11700000-00000000'
            },
            'vevo': {
                'nev': worksheet.clientName,
                'irsz': '1000',
                'telepules': 'Budapest',
                'cim': worksheet.clientAddress,
                'email': worksheet.clientEmail || '',
                'sendEmail': !!worksheet.clientEmail
            },
            'tetelek': []
        }
    };

    if (provider === 'ev') {
        // Individual Entrepreneur - Labor & Material (AAM - 0% VAT)
        if (parseInt(worksheet.laborFee) > 0) {
            xmlObj.xmlszamla.tetelek.push({
                'tetel': {
                    'megnevezes': 'Munkadíj',
                    'mennyiseg': '1',
                    'mennyisegiEgyseg': 'db',
                    'nettoEgysegar': worksheet.laborFee,
                    'afakulcs': 'AAM',
                    'nettoErtek': worksheet.laborFee,
                    'afaErtek': '0',
                    'bruttoErtek': worksheet.laborFee
                }
            });
        }

        if (parseInt(worksheet.materialCost) > 0) {
            xmlObj.xmlszamla.tetelek.push({
                'tetel': {
                    'megnevezes': 'Anyagköltség',
                    'mennyiseg': '1',
                    'mennyisegiEgyseg': 'db',
                    'nettoEgysegar': worksheet.materialCost,
                    'afakulcs': 'AAM',
                    'nettoErtek': worksheet.materialCost,
                    'afaErtek': '0',
                    'bruttoErtek': worksheet.materialCost
                }
            });
        }
    } else if (provider === 'kft') {
        // Kft - Device (27% VAT)
        if (parseInt(worksheet.devicePrice) > 0) {
            const netPrice = Math.round(worksheet.devicePrice / 1.27);
            const vatAmount = worksheet.devicePrice - netPrice;

            xmlObj.xmlszamla.tetelek.push({
                'tetel': {
                    'megnevezes': `${worksheet.deviceManufacturer || 'Klíma'} ${worksheet.deviceType || 'Készülék'}`,
                    'mennyiseg': '1',
                    'mennyisegiEgyseg': 'db',
                    'nettoEgysegar': netPrice,
                    'afakulcs': '27',
                    'nettoErtek': netPrice,
                    'afaErtek': vatAmount,
                    'bruttoErtek': worksheet.devicePrice
                }
            });
        }
    }

    if (xmlObj.xmlszamla.tetelek.length === 0) {
        throw new Error('Nincs számlázható tétel ehhez a szolgáltatóhoz.');
    }

    const doc = create(xmlObj);
    const xmlString = doc.end({ prettyPrint: true });

    try {
        console.log(`Using API Key: ${apiKey.substring(0, 5)}...${apiKey.substring(apiKey.length - 5)}`);

        const boundary = '--------------------------' + Date.now().toString(16);
        const postData = `--${boundary}\r\nContent-Disposition: form-data; name="action-xmlagentxmlfile"; filename="invoice.xml"\r\nContent-Type: text/xml\r\n\r\n${xmlString}\r\n--${boundary}--`;

        // Convert to Buffer to parse UTF-8 characters correctly (byte length vs char length)
        const payloadBuffer = Buffer.from(postData, 'utf8');

        console.log('Sending request to Számlázz.hu. Payload size:', payloadBuffer.length);

        const response = await axios.post(SZAMLAZZ_API_URL, payloadBuffer, {
            headers: {
                'Content-Type': `multipart/form-data; boundary=${boundary}`,
                'Content-Length': payloadBuffer.length
            },
            responseType: 'arraybuffer'
        });

        // Debug: Log all headers to find the correct error message header
        // console.log('Számlázz.hu Response Headers:', response.headers);

        if (response.headers['szlahu_error_code']) {
            const errCode = response.headers['szlahu_error_code'];

            // Try different casing or specific headers regarding error message
            const errMsgRaw = response.headers['szlahu_error'] || response.headers['szlahu_error_msg'] || response.headers['szlahu-error-msg'];
            const errMsg = errMsgRaw ? decodeURIComponent(errMsgRaw).replace(/\+/g, ' ') : 'Unknown Error';

            throw new Error(`Számlázz.hu Hiba (${errCode}): ${errMsg}`);
        }

        // Check for XML response (common with valaszVerzio: 2)
        const responseString = response.data.toString('utf8');
        if (responseString.includes('<xmlszamlavalasz')) {
            // Check for success
            if (responseString.includes('<sikeres>true</sikeres>')) {
                // Extract PDF base64
                const pdfMatch = responseString.match(/<pdf>(.*?)<\/pdf>/s);
                if (pdfMatch && pdfMatch[1]) {
                    const pdfBuffer = Buffer.from(pdfMatch[1], 'base64');
                    return pdfBuffer;
                } else {
                    console.warn('Success XML received but no PDF tag found:', responseString.substring(0, 200));
                }
            } else {
                // Try to extract error message from XML
                const errMatch = responseString.match(/<hibauzenet>(.*?)<\/hibauzenet>/s);
                const errMsg = errMatch ? errMatch[1] : 'Unknown Számlázz.hu XML Error';
                throw new Error(`Számlázz.hu Hiba: ${errMsg}`);
            }
        }

        return response.data;
    } catch (error) {
        if (error.response) {
            console.error('Számlázz.hu Error Response Headers:', error.response.headers);
            // Also try to read data if it's not binary or if it helps
            console.error('Számlázz.hu Status:', error.response.status);
            if (error.response.data) {
                const errorData = Buffer.isBuffer(error.response.data)
                    ? error.response.data.toString('utf8')
                    : error.response.data;
                console.error('Számlázz.hu Error Body:', errorData);
            }
        } else {
            console.error('Számlázz.hu Error (No Response):', error.message);
        }
        throw error;
    }
}

function createDemoInvoice(worksheet, provider) {
    return new Promise((resolve) => {
        const doc = new PDFDocument({ margin: 50 });
        let buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));

        const title = provider === 'kft' ? 'BO-ZSO Hungary Kft. (DEMO)' : 'Egyéni Vállalkozó (DEMO)';
        doc.fontSize(25).text(title, { align: 'center', color: 'red' });
        doc.moveDown();
        doc.fontSize(12).text('Ez egy nem hivatalos számlakép, mivel hiányzik az API kulcs.');
        doc.moveDown();

        doc.fontSize(14).text('Vevő adatai:');
        doc.fillColor('black').text(worksheet.clientName);
        doc.text(worksheet.clientAddress);

        doc.moveDown();
        doc.fontSize(14).text('Tételek:');

        let total = 0;

        if (provider === 'ev') {
            if (worksheet.laborFee > 0) {
                doc.text(`Munkadíj: ${worksheet.laborFee} Ft (AAM)`);
                total += Number(worksheet.laborFee);
            }
            if (worksheet.materialCost > 0) {
                doc.text(`Anyagköltség: ${worksheet.materialCost} Ft (AAM)`);
                total += Number(worksheet.materialCost);
            }
        } else if (provider === 'kft') {
            if (worksheet.devicePrice > 0) {
                doc.text(`${worksheet.deviceManufacturer} ${worksheet.deviceType}: ${worksheet.devicePrice} Ft (27% ÁFA)`);
                total += Number(worksheet.devicePrice);
            }
        }

        doc.moveDown();
        doc.fontSize(14).font('Helvetica-Bold').text(`Összesen: ${total} Ft`);

        doc.end();
    });
}

module.exports = { createInvoice };
