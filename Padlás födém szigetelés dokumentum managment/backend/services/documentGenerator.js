const Docxtemplater = require('docxtemplater');
const PizZip = require('pizzip');
const fs = require('fs');
const path = require('path');

// BO-ZSO Hungary Kft fixed data
const CONTRACTOR_DATA = {
    companyName: "BO-ZSO Hungary Kft",
    address: "2133 Sződliget HRSZ 1225/1",
    registrationNumber: "13 09 201060",
    taxNumber: "27030110213",
    statisticsNumber: "27030110-4100-113-13",
    mkikNumber: "26B96372",
    insurancePolicy: "95595005769188500",
    // v18 - STAMP ADDED
    representative: {
        name: "Dobai Tamás",
        birthPlace: "Budapest",
        birthDate: "1979.10.25",
        motherName: "Szolnoki Györgyi Juditt",
        address: "2613 Rád Kossuth utca 20."
    },
    bank: {
        name: "OTP Bank NYRT",
        accountNumber: "11742104-24309413"
    },
    contact: {
        email: "lionsgatevac@gmail.com"
    }
};

class DocumentGenerator {
    constructor() {
        this.templatesDir = path.join(__dirname, '..', '..', 'templates');
        this.generatedDir = path.join(__dirname, '..', 'generated');

        // Ensure generated directory exists
        if (!fs.existsSync(this.generatedDir)) {
            fs.mkdirSync(this.generatedDir, { recursive: true });
        }
    }

    // Format date to Hungarian format
    formatDate(date) {
        if (!date) return '';
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}.${month}.${day}.`;
    }

    // Format currency
    formatCurrency(amount) {
        if (!amount) return '0 Ft';
        return new Intl.NumberFormat('hu-HU').format(amount) + ' Ft';
    }

    // Helper to download image from URL
    async downloadImage(url) {
        try {
            console.log(`[DocumentGenerator] Downloading image from: ${url}`);
            const axios = require('axios');
            const response = await axios.get(url, { responseType: 'arraybuffer' });
            const buffer = Buffer.from(response.data);
            console.log(`[DocumentGenerator] Downloaded ${buffer.length} bytes`);

            // Convert to data URL for better compatibility with image module
            const base64 = buffer.toString('base64');
            const dataUrl = `data:image/png;base64,${base64}`;
            console.log(`[DocumentGenerator] Converted to data URL (${dataUrl.length} chars)`);
            return dataUrl;
        } catch (error) {
            console.error(`[DocumentGenerator] Error downloading image from ${url}:`, error.message);
            // Return 1x1 transparent PNG as fallback
            return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
        }
    }

    // Process data to download remote images
    async fetchImagesForTemplate(data) {
        const imageFields = ['alairasugyfel', 'alairaskivitelezo', 'alaprajz', 'alaprajzplusz', 'alairas'];

        for (const field of imageFields) {
            if (data[field] && typeof data[field] === 'string' && (data[field].startsWith('http://') || data[field].startsWith('https://'))) {
                console.log(`[DocumentGenerator] Detected remote URL for ${field}, downloading...`);
                data[field] = await this.downloadImage(data[field]);
            }
        }
        return data;
    }

    // Generate document from template
    async generate(templateName, data, format = 'docx') {
        // DEBUG: Redirect console output to file safely
        const util = require('util');
        if (!console._isOverriddenForDebug) {
            const logFile = fs.createWriteStream(path.join(__dirname, '../debug_console.log'), { flags: 'a' });
            const originalLog = console.log;
            const originalError = console.error;
    
            console.log = function (...args) {
                logFile.write(new Date().toISOString() + ' [INFO] ' + util.format(...args) + '\n');
                originalLog.apply(console, args);
            };
            console.error = function (...args) {
                logFile.write(new Date().toISOString() + ' [ERROR] ' + util.format(...args) + '\n');
                originalError.apply(console, args);
            };
            console._isOverriddenForDebug = true;
        }

        console.log('--- START DOCUMENT GENERATION ---');
        console.time('FullGenerationTime'); // MEASURE TIME
        console.log(`Requested Template: ${templateName}`);
        console.log(`Environment: ${process.env.NODE_ENV}`);
        console.log(`User Role: ${data.owner_role}`);

        try {
            // DEBUG LOGGING START
            const debugLogPath = path.join(__dirname, '../debug_investigation.log');
            const appendDebug = (msg) => {
                const timestamp = new Date().toISOString();
                try {
                    fs.appendFileSync(debugLogPath, `${timestamp} - ${msg}\n`);
                } catch (e) { console.error('Failed to write to debug log:', e); }
            };
            appendDebug(`--- NEW REQUEST ---`);
            appendDebug(`Requested Template: ${templateName}`);
            appendDebug(`Data Created At Raw: ${data.created_at}`);

            // Template selection based on role
            let targetTemplate = templateName;

            // MAP NEW TEMPLATES (2026)
            // This mapping allows using friendly names in API but specific filenames on disk
            const templateMap = {
                'kivitelezesi_szerzodes': '2026kivitelezesi_szerzodes',
                'atadas_atveteli': '2026 atadas_atveteli',
                'megallapodas_hem': '2026 megallapodas_hem',
                'kivitelezoi_nyilatkozat': '2026 Kivitelezoi nyil.jk_v2'
            };

            if (templateMap[templateName]) {
                targetTemplate = templateMap[templateName];
                console.log(`[INFO] Mapped ${templateName} to ${targetTemplate}`);
                appendDebug(`Mapped to NEW template: ${targetTemplate}`);
            }

            // DATE-BASED VERSIONING LOGIC
            // If the project was created BEFORE 2026-02-01, use the OLD template for kivitelezoi_nyilatkozat
            const versionCutoffDate = new Date('2026-02-01T00:00:00.000Z');
            let projectCreatedAt = null;

            if (data.created_at) {
                projectCreatedAt = new Date(data.created_at);
                console.log(`[DEBUG] Project created at: ${projectCreatedAt.toISOString()}`);
                appendDebug(`Project Created At Parsed: ${projectCreatedAt.toISOString()}`);
                appendDebug(`Cutoff Date: ${versionCutoffDate.toISOString()}`);
                appendDebug(`Is OLD? ${projectCreatedAt < versionCutoffDate}`);
            } else {
                appendDebug(`No created_at provided - assuming NEW project`);
            }

            // Override for OLD projects: force back to OLD version if conditions met
            if (templateName === 'kivitelezoi_nyilatkozat' && projectCreatedAt && projectCreatedAt < versionCutoffDate) {
                targetTemplate = `${templateName}_OLD`;
                console.log(`[INFO] Old project detected (created before 2026-02-01). Reverting to LEGACY template: ${targetTemplate}`);
                appendDebug(`REVERTING TO OLD TEMPLATE: ${targetTemplate}`);
            } else {
                appendDebug(`Final Template Selected: ${targetTemplate}`);
            }

            // External user overrides
            if (data.owner_role === 'external' && !targetTemplate.includes('_OLD')) {
                const extTemplate = `${targetTemplate}_ext`;
                const extPath = path.join(this.templatesDir, `${extTemplate}.docx`);

                if (fs.existsSync(extPath)) {
                    targetTemplate = extTemplate;
                    console.log(`External user detected. Using extended template: ${targetTemplate}`);
                } else {
                    console.log(`External user detected but ${extTemplate} not found. Falling back to standard: ${targetTemplate}`);
                }
            }

            // Template path
            const templatePath = path.join(this.templatesDir, `${targetTemplate}.docx`);

            if (!fs.existsSync(templatePath)) {
                // Determine if we can fallback to the requested name itself (e.g. if mapping failed)
                const fallbackPath = path.join(this.templatesDir, `${templateName}.docx`);
                if (fs.existsSync(fallbackPath)) {
                    console.warn(`Template ${targetTemplate} not found. Falling back to requested name: ${templateName}`);
                    targetTemplate = templateName;
                } else {
                    console.error(`CRITICAL: Template file not found at ${templatePath}`);
                    throw new Error(`Template not found: ${targetTemplate} (and no fallback)`);
                }
            }
            // Re-resolve path after fallback logic
            const finalTemplatePath = path.join(this.templatesDir, `${targetTemplate}.docx`);

            console.log(`[DEBUG] Loading template from: ${finalTemplatePath}`);
            const stats = fs.statSync(finalTemplatePath);
            console.log(`[DEBUG] Template file size: ${stats.size} bytes`);

            // Load template
            const content = fs.readFileSync(finalTemplatePath, 'binary');
            const zip = new PizZip(content);

            // Create docxtemplater instance
            let doc;
            try {
                // Image module option
                const ImageModule = require('docxtemplater-image-module-free');
                const sizeOf = require('image-size');

                // Define base64 regex - robust matching
                const base64Regex = /^data:image\/(?:png|jpg|jpeg|svg\+xml);base64,/;

                const opts = {};
                opts.centered = false;
                opts.getImage = function (tagValue, tagName) {
                    // console.log(`[ImageModule] getImage called for tag: ${tagName}`); // Too verbose

                    if (Buffer.isBuffer(tagValue)) {
                        return tagValue;
                    }

                    // tagValue is the base64 string
                    if (typeof tagValue === 'string' && base64Regex.test(tagValue)) {
                        // console.log('[ImageModule] Base64 tag detected');
                        const base64Data = tagValue.replace(base64Regex, "").trim();
                        return Buffer.from(base64Data, 'base64');
                    }
                    // console.log('[ImageModule] Not a base64 string, returning binary');
                    return Buffer.from(tagValue, 'binary');
                };
                opts.getSize = function (img, tagValue, tagName) {
                    // console.log(`[ImageModule] getSize called for tag: ${tagName}`);
                    let buffer;
                    if (Buffer.isBuffer(img)) {
                        buffer = img;
                    } else if (typeof tagValue === 'string' && base64Regex.test(tagValue)) {
                        const base64Data = tagValue.replace(base64Regex, "").trim();
                        buffer = Buffer.from(base64Data, 'base64');
                    } else {
                        buffer = Buffer.from(tagValue, 'binary');
                    }

                    try {
                        const dimensions = sizeOf(buffer);
                        // console.log(`[ImageModule] Dimensions: ${dimensions.width}x${dimensions.height}`);

                        // SCALE LOGIC
                        if (tagName.includes('alairas')) {
                            // OPTIMIZED: Wide but short to fit lines
                            const targetWidth = 200;
                            const maxHeight = 40; // Reduced to 40px to ensure it floats ABOVE lines

                            const ratio = dimensions.width / dimensions.height;
                            let newWidth = targetWidth;
                            let newHeight = newWidth / ratio;

                            if (newHeight > maxHeight) {
                                newHeight = maxHeight;
                                newWidth = newHeight * ratio;
                            }
                            return [newWidth, newHeight];
                        }

                        if (tagName === 'belyegzo') {
                            // OPTIMIZED: Keep aspect ratio, strictly limit height
                            const maxWidth = 150;
                            const maxHeight = 40; // Reduced to 40px to match signature line height

                            const ratio = dimensions.width / dimensions.height;
                            let newWidth = maxWidth;
                            let newHeight = newWidth / ratio;

                            if (newHeight > maxHeight) {
                                newHeight = maxHeight;
                                newWidth = newHeight * ratio;
                            }
                            return [newWidth, newHeight];
                        }

                        let maxWidth = 200; // Default for other images
                        const cleanTagName = tagName.replace('%', '');
                        if (cleanTagName === 'alaprajz' || cleanTagName === 'alaprajzplusz') {
                            maxWidth = 600; // Increased size for floor plan and floor plan plus
                            console.log(`[ImageModule] tagName is ${tagName}, using maxWidth 600`);
                        }

                        if (dimensions.width > maxWidth) {
                            const ratio = maxWidth / dimensions.width;
                            return [maxWidth, dimensions.height * ratio];
                        }
                        return [dimensions.width, dimensions.height];
                    } catch (e) {
                        console.error('[ImageModule] Error calculating size:', e);
                        return [150, 50]; // Fallback size
                    }
                };

                const imageModule = new ImageModule(opts);

                doc = new Docxtemplater(zip, {
                    paragraphLoop: true,
                    linebreaks: true,
                    modules: [imageModule],
                    delimiters: { start: '[[', end: ']]' },
                    nullGetter: () => { return ""; }
                });
            } catch (err) {
                console.error('CRITICAL: Image module failed to load:', err);
                console.warn('Image module not loaded (signature/photos will not work in docs):', err.message);
                doc = new Docxtemplater(zip, {
                    paragraphLoop: true,
                    linebreaks: true,
                    delimiters: { start: '[[', end: ']]' },
                    nullGetter: () => { return ""; }
                });
            }

            console.log('Template loaded. Delimiters: [[ ]]');

            // Check for potential tag issues
            const text = zip.files['word/document.xml'].asText();

            // DEBUG: FIND ALL TAGS IN TEMPLATE
            const tagRegex = /\[\[(.*?)\]\]/g;
            const matches = [...text.matchAll(tagRegex)];
            const foundTags = matches.map(m => m[1]);
            console.log('🔍 FOUND TAGS IN TEMPLATE:', foundTags);

            // SPECIAL CHECK for padlas tags
            const padlasTags = foundTags.filter(t => t.includes('padlas') || t.includes('attic') || t.includes('pf_'));
            console.log('🔍 PADLAS RELATED TAGS:', padlasTags);

            // Prepare and format data for template
            const formattedData = this.prepareData(data, targetTemplate);

            // DOWNLOAD REMOTE IMAGES
            await this.fetchImagesForTemplate(formattedData);

            // Render document (DOCX)
            doc.render(formattedData);

            // Generate buffer
            const buf = doc.getZip().generate({
                type: 'nodebuffer',
                compression: 'DEFLATE'
            });

            if (format === 'pdf') {
                try {
                    console.log(`[DocumentGenerator] Starting Puppeteer + Mammoth conversion for ${targetTemplate}...`);
                    const cheerio = require('cheerio');
                    const mammoth = require('mammoth');
                    const puppeteer = require('puppeteer');

                    // 1. Convert DOCX to HTML using mammoth with explicit style mapping
                    const options = {
                        styleMap: [
                            "p[style-name='Title'] => h1:fresh",
                            "p[style-name='Heading 1'] => p:fresh",
                            "p[style-name='Heading 2'] => p:fresh",
                            "p[style-name='Heading 3'] => p:fresh",
                            "p[style-name='Heading 4'] => p:fresh"
                        ]
                    };
                    const result = await mammoth.convertToHtml({ buffer: buf }, options);
                    let htmlContent = result.value;

                    // Post-process HTML with Cheerio
                    htmlContent = htmlContent.replace(/\t/g, '<span style="display:inline-block; width: 30pt;"></span>');
                    const $ = cheerio.load(htmlContent, null, false);

                    // 1. Táblázatok osztályozása és tisztítási logika
                    $('table').each((i, el) => {
                        const text = $(el).text();
                        if (text.includes('Rétegrend') || text.includes('Építőanyag') || text.includes('Megnevezés') || text.includes('Mennyiség') || text.includes('KIINDULÓ ÁLLAPOT')) {
                            // Felhasználói kérés: minden technikai adatot távolítsunk el
                            $(el).remove();
                        } else {
                            $(el).addClass('layout-table');
                        }
                    });

                    // 2. Kis képek eltávolítása (aláírások, bélyegzők) — nagy képek (alaprajz) megtartása
                    $('img').each((i, el) => {
                        const src = $(el).attr('src') || '';
                        // Floor plan images have large base64 data (>10KB), signatures/stamps are small
                        if (src.startsWith('data:image/') && src.length > 10000) {
                            $(el).addClass('floor-plan-img');
                            $(el).css({
                                'max-width': '100%',
                                'height': 'auto',
                                'display': 'block',
                                'margin': '12pt auto'
                            });
                        } else {
                            $(el).remove();
                        }
                    });

                    // 3. Technikai szövegek és üres fejlécek eltávolítása
                    $('p, h1, h2, h3').each((i, el) => {
                        const text = $(el).text().trim();
                        // Aláírási helyek, technikai szekciók és maradék adatok törlése
                        if (
                            text.includes('KIINDULÓ ÁLLAPOT') || 
                            text.includes('ZÁRÓ ÁLLAPOT') || 
                            text.includes('Fűtetlen tér') ||
                            text.includes('Műszaki számítások') ||
                            text.includes('Elvégzett munkálatok és műszaki tartalom') ||
                            text.includes('A beépített anyagokra') ||
                            text.includes('..') || // Aláírási pontsorok
                            text === 'Végeztünk' ||
                            text.includes('Utólagos hőszigetelés vastagsága') ||
                            (text.includes('Becsült megtakarítás') && text.includes('GJ')) ||
                            (text.includes('szolgáltatást kapott') && text.includes('0 Ft'))
                        ) {
                            $(el).remove();
                        }
                    });

                    htmlContent = $.html();

                    // 2. Use Puppeteer to "print" HTML to PDF
                    const browser = await puppeteer.launch({
                        args: ['--no-sandbox', '--disable-setuid-sandbox']
                    });
                    const page = await browser.newPage();

                    // Add premium Times New Roman styling based on XML analysis
                    const styledHtml = `
                        <html>
                            <head>
                                <style>
                                    body { 
                                        font-family: Arial, sans-serif; 
                                        margin: 0;
                                        padding: 0;
                                        line-height: 1.15;
                                        color: #000;
                                        font-size: 11pt; /* XML sz:22 */
                                        -webkit-print-color-adjust: exact;
                                    }
                                    
                                    .content-wrapper {
                                        /* XML Margins: Top:851, Bottom:601, Left:1416, Right:1413 (in TWIPS) */
                                        /* 1pt = 20 twips */
                                        padding-top: 42.5pt;
                                        padding-bottom: 30pt;
                                        padding-left: 70.8pt;
                                        padding-right: 70.6pt;
                                    }
                                    
                                    p { 
                                        margin: 0 0 6pt 0; /* Approximate spacing w:after="118" */
                                    }
                                    
                                    /* Force centering for the main title which might not have a styleId */
                                    .content-wrapper > p:first-of-type {
                                        text-align: center;
                                        font-weight: bold;
                                        font-size: 14pt;
                                        margin-bottom: 12pt;
                                    }
                                    
                                    h1, h2, h3, h4, h5, h6 {
                                        line-height: 1.2;
                                        font-weight: bold;
                                        margin-top: 12pt;
                                        margin-bottom: 6pt;
                                    }
                                    
                                    h1 { 
                                        font-size: 14pt; 
                                    }
                                    
                                    h2 {
                                        font-size: 12pt;
                                    }
                                    
                                    strong { 
                                        font-weight: bold; 
                                    }
                                    
                                    table {
                                        border-collapse: collapse;
                                        width: 100%;
                                        margin: 12pt 0;
                                        table-layout: fixed;
                                    }
                                    table.bordered-table th, table.bordered-table td {
                                        border: 0.5pt solid #000;
                                        padding: 3pt 5pt;
                                        font-size: 10.5pt;
                                        text-align: left;
                                        vertical-align: top;
                                    }
                                    table.layout-table th, table.layout-table td {
                                        border: none;
                                        padding: 2pt;
                                        text-align: left;
                                        vertical-align: top;
                                        font-size: 10.5pt;
                                    }
                                    
                                    /* Handle signatures/stamps */
                                    img { 
                                        display: block;
                                        max-width: 100%; 
                                    }
                                    
                                    .signature-img {
                                        max-height: 60px;
                                        width: auto;
                                        margin: 5pt 0;
                                    }
                                    
                                    .stamp-img {
                                        max-height: 100px;
                                        width: auto;
                                        margin: 5pt 0;
                                    }
                                    
                                    ul { 
                                        margin: 8pt 0; 
                                        padding-left: 30pt; 
                                    }
                                    
                                    li { 
                                        margin-bottom: 4pt; 
                                    }
                                    
                                    @page {
                                        size: A4;
                                        margin: 0; /* Critical: Remove Puppeteer default margins to use CSS margins */
                                    }
                                </style>
                            </head>
                            <body>
                                <div class="content-wrapper">
                                    ${htmlContent}
                                </div>
                            </body>
                        </html>
                    `;

                    await page.setContent(styledHtml, { waitUntil: 'networkidle0' });
                    const pdfBuffer = await page.pdf({
                        format: 'A4',
                        margin: { top: 0, right: 0, bottom: 0, left: 0 },
                        printBackground: true
                    });

                    await browser.close();

                    if (!pdfBuffer || pdfBuffer.length === 0) {
                        throw new Error('Puppeteer generated an empty PDF buffer.');
                    }

                    const safeTemplateName = targetTemplate.replace(/[^a-z0-9]/gi, '_');
                    const fileName = `${safeTemplateName}_${data.contract_number || Date.now()}.pdf`;
                    const filePath = path.join(this.generatedDir, fileName);
                    fs.writeFileSync(filePath, pdfBuffer);

                    console.log('[DocumentGenerator] PDF (Puppeteer) successful:', fileName, `(${pdfBuffer.length} bytes)`);

                    return {
                        fileName,
                        filePath,
                        fileUrl: `/generated/${fileName}`
                    };
                } catch (pdfErr) {
                    console.error('[DocumentGenerator] PDF (Puppeteer) Conversion Failed:', pdfErr);
                    throw new Error(`PDF generálás (Puppeteer) sikertelen: ${pdfErr.message}`);
                }
            }

            // Save file
            // Sanitize filename for safe download
            const safeTemplateName = targetTemplate.replace(/[^a-z0-9]/gi, '_');
            const fileName = `${safeTemplateName}_${data.contract_number || Date.now()}.docx`;
            const filePath = path.join(this.generatedDir, fileName);
            fs.writeFileSync(filePath, buf);

            console.timeEnd('FullGenerationTime'); // END MEASURE
            return {
                fileName,
                filePath,
                fileUrl: `/generated/${fileName}`
            };
        } catch (error) {
            console.error('Document generation error:', error);

            // LOG ALL ERRORS
            const errorLog = {
                message: error.message,
                stack: error.stack,
                properties: error.properties || {},
                rawError: JSON.stringify(error, Object.getOwnPropertyNames(error))
            };

            try {
                fs.writeFileSync(path.join(__dirname, '../backend_error.json'), JSON.stringify(errorLog, null, 2));
            } catch (writeErr) {
                console.error('Failed to write error log:', writeErr);
            }

            if (error.properties && error.properties.errors) {
                error.properties.errors.forEach(function (error, index) {
                    console.error(`Docxtemplater Error #${index + 1}:`, error);
                });
            }
            throw new Error(`Failed to generate document: ${error.message}`);
        }
    }

    // Helper to clean values (remove "undefined" strings)
    cleanValue(val) {
        if (val === undefined || val === null) return '';
        const str = String(val).trim();
        if (str === 'undefined' || str === 'null') return '';
        return val;
    }

    // Number to Hungarian words converter
    numberToHungarianWords(num) {
        if (num === null || num === undefined) return '';
        const n = parseInt(num, 10);
        if (isNaN(n)) return '';
        if (n === 0) return 'nulla';

        const ones = ['', 'egy', 'kettő', 'három', 'négy', 'öt', 'hat', 'hét', 'nyolc', 'kilenc'];
        const tens = ['', 'tíz', 'húsz', 'harminc', 'negyven', 'ötven', 'hatvan', 'hetven', 'nyolcvan', 'kilencven'];
        const tensFull = ['', 'tíz', 'húsz', 'harminc', 'negyven', 'ötven', 'hatvan', 'hetven', 'nyolcvan', 'kilencven'];

        // Helper for 1-999
        const convertHundreds = (num) => {
            let str = '';

            // Hundreds
            if (num >= 100) {
                const h = Math.floor(num / 100);
                str += (h === 1 ? '' : ones[h]) + 'száz';
                num %= 100;
            }

            // tens and ones
            if (num > 0) {
                if (num < 10) {
                    str += ones[num];
                } else if (num < 20) {
                    // 11-19: tizenegy...
                    str += 'tizen' + ones[num - 10];
                } else if (num < 30) {
                    // 21-29: huszonegy...
                    str += 'huszon' + ones[num - 20];
                } else {
                    // 30-99
                    const t = Math.floor(num / 10); // 3
                    const o = num % 10;
                    str += tens[t] + (o > 0 ? ones[o] : '');
                }
            }
            return str;
        };

        let result = '';

        // Millions
        if (n >= 1000000) {
            const m = Math.floor(n / 1000000);
            result += convertHundreds(m) + 'millió';
            const remainder = n % 1000000;
            if (remainder > 0) {
                result += (remainder < 2000 ? '' : '-') + convertHundreds(remainder); // formatting rule simplified
            }
        } else if (n >= 1000) {
            // Thousands
            const th = Math.floor(n / 1000);
            result += convertHundreds(th) + 'ezer';
            const remainder = n % 1000;
            if (remainder > 0) {
                result += (n > 2000 ? '-' : '') + convertHundreds(remainder);
            }
        } else {
            result += convertHundreds(n);
        }

        return result;
    }

    // Format address
    formatAddress(address) {
        if (!address) return '';
        const { postalCode, city, street, houseNumber } = address;
        if (!postalCode && !city && !street && !houseNumber) return typeof address === 'string' ? address : '';
        return `${postalCode || ''} ${city || ''}, ${street || ''} ${houseNumber || ''}`.trim();
    }

    // Helper for checkbox formatting
    formatCheckboxLine(checked, text) {
        // U+2611 (☑) and U+25A1 (□)
        return (checked ? '☑' : '□') + text;
    }

    // Prepare and format data for template
    prepareData(data, templateName) {
        console.log('[DEBUG] prepareData called with:', JSON.stringify({
            attic_door_insulated: data.attic_door_insulated,
            padlasfeljaro_szigetelese: data.padlasfeljaro_szigetelese,
            pf_kivul_egyeb: data.pf_kivul_egyeb,
            pf_kivul_egyeb_szoveg: data.pf_kivul_egyeb_szoveg
        }, null, 2));

        // Calculate labor cost words
        const laborCostWords = this.numberToHungarianWords(data.labor_cost) + ' forint';
        const netAmountWords = data.net_amount_words || (this.numberToHungarianWords(data.net_amount) + ' forint');

        // ENERGY SAVING FALLBACK (Recalculate if 0)
        let energySaving = parseFloat(data.energy_saving_gj || 0);
        if (energySaving <= 0 && data.net_area > 0) {
            console.log(`[DocumentGenerator] GJ is ${energySaving}, recalculating from net_area ${data.net_area}`);
            energySaving = parseFloat((parseFloat(data.net_area) * 0.461).toFixed(2));
        }

        // CALCULATE GJ BASED VALUES
        const szamoltNettoValue = Math.round(energySaving * 9757);
        const szamoltGrossValue = Math.round(szamoltNettoValue * 1.27);

        // DETERMINE CONTRACTOR DATA
        let contractor = CONTRACTOR_DATA;
        if (data.owner_role === 'external') {
            contractor = {
                companyName: data.owner_company_name,
                address: data.owner_company_address, // Assumes full string stored
                registrationNumber: data.owner_company_reg_number,
                taxNumber: data.owner_company_tax_number,
                statisticsNumber: "", // Not stored?
                mkikNumber: "", // Not stored?
                insurancePolicy: "", // Not stored?
                representative: {
                    name: data.owner_name,
                    birthPlace: "", // Not stored
                    birthDate: "", // Not stored
                    motherName: "", // Not stored
                    address: "" // Not stored
                },
                bank: {
                    name: "", // Not stored yet
                    accountNumber: "" // Not stored yet
                },
                contact: {
                    email: data.owner_email // available via JOIN? Need to ensure it is selected
                }
            };
        }

        const result = {
            // --- HUNGARIAN MAPPING FOR TEMPLATE ---
            // Customer
            nev: data.customer_name || '',
            szuletesnev: data.customer_birth_name || '',
            anyjaneve: data.customer_mother_name || '',
            szig: data.customer_id_number || '',
            szemelyi: data.customer_id_number || '', // Added for Handover doc
            lakcim: this.formatAddress(data.customer_address),

            iranyitoszam: this.cleanValue(data.customer_address?.postalCode),
            varos: this.cleanValue(data.customer_address?.city),
            utca: this.cleanValue(data.customer_address?.street),
            hazszam: this.cleanValue(data.customer_address?.houseNumber),

            telefon: data.customer_phone || '',
            telefonszam: data.customer_phone || '',
            email: data.customer_email || '',

            // Property
            cim: this.formatAddress(data.property_address),

            ingatlan_iranyitoszam: this.cleanValue(data.property_address?.postalCode),
            ingatlan_varos: this.cleanValue(data.property_address?.city),
            ingatlan_utca: this.cleanValue(data.property_address?.street),
            ingatlan_hazszam: this.cleanValue(data.property_address?.houseNumber),
            hrsz: this.cleanValue(data.hrsz),
            epiteseve: data.building_year || '',
            epites: data.building_year || '',
            falazat: data.building_type || '',
            ingatlantipusa: data.building_type || '',
            futes: data.futes || data.heating_type || '',
            szelemen: data.roof_type || '',

            // Technical
            bruttoalapterulet: data.gross_area || 0,
            brszig: data.gross_area || 0,
            kemeny: data.chimney_area || 0,
            padlasfeljaro: data.attic_door_area || 0,
            padlasfeljarominusz: data.attic_door_area || 0,
            egyeb: data.other_deducted_area || 0,
            egyeblevonando: data.other_deducted_area || 0,
            nettoalapterulet: data.net_area || 0,
            nettoszigetelt: data.net_area || 0,
            szigetelesvastagsag: data.insulation_thickness || 25,
            lambda: data.r_value || 6.25,

            // Structure types (marking with X)
            fa: data.structure_type === 'fa' ? 'X' : '',
            facm: data.structure_type === 'fa' ? data.structure_thickness : '',
            acel: data.structure_type === 'acel' ? 'X' : '',
            acelcm: data.structure_type === 'acel' ? data.structure_thickness : '',
            vasbeton: data.structure_type === 'vasbeton' ? 'X' : '',
            vasbetoncm: data.structure_type === 'vasbeton' ? data.structure_thickness : '',
            monolit: data.structure_type === 'monolit' ? 'X' : '',
            monolitcm: data.structure_type === 'monolit' ? data.structure_thickness : '',

            // Unheated spaces
            garazs: data.unheated_space_type === 'garázs' ? 'X' : '',
            garazsnm: data.unheated_space_type === 'garázs' ? data.unheated_space_area : '',
            bármi: data.unheated_space_type === 'télikert' ? 'X' : '',
            bárminm: data.unheated_space_type === 'télikert' ? data.unheated_space_area : '',
            egyéb: data.unheated_space_type === 'egyéb' ? 'X' : '',
            egyébnm: data.unheated_space_type === 'egyéb' ? data.unheated_space_area : '',
            egyébnev: data.unheated_space_type === 'egyéb' ? (data.unheated_space_name || '') : '',

            // Dates
            szerzodeskotes: this.formatDate(data.contract_date || new Date()),
            datum: this.formatDate(data.execution_date || data.contract_date || new Date()),
            munka_kezdete: this.formatDate(data.work_start_date),
            kezdes: this.formatDate(data.work_start_date),
            munka_vege: this.formatDate(data.work_end_date),
            vege: this.formatDate(data.work_end_date),
            atadas_datum: this.formatDate(data.handover_date),

            // New time and execution date fields (supporting both space and underscore)
            ora_kezdes: (data.work_hour_start || 9) + " óra",
            "ora kezdes": (data.work_hour_start || 9) + " óra",
            ora_vege: (data.work_hour_end || 16) + " óra",
            "ora vege": (data.work_hour_end || 16) + " óra",
            kivitelezes_datuma: this.formatDate(data.execution_date || data.contract_date || new Date()),
            "kivitelezes datuma": this.formatDate(data.execution_date || data.contract_date || new Date()),
            "kivitelezés dátuma": this.formatDate(data.execution_date || data.contract_date || new Date()),

            // Financial
            szerzodesi_osszeg: this.formatCurrency(data.net_amount),
            // NEW CALCULATIONS
            szamoltnetto: this.formatCurrency(szamoltNettoValue),
            szamoltnettoszövegesen: this.numberToHungarianWords(szamoltNettoValue) + ' forint',
            szamoltosszeg: this.formatCurrency(data.net_amount),

            szerzodesi_osszeg_betuvel: netAmountWords,
            szamoltosszegbetuvel: netAmountWords,
            munkadij: this.formatCurrency(data.labor_cost),
            munkadijbetuvel: laborCostWords, // Added for missing requirement
            munkadij_betuvel: laborCostWords, // Added alias to be safe

            // Attic Declaration
            padlasfeljaro_szigetelese_igen: data.attic_door_insulated ? 'X' : '',
            padlasfeljaro_szigetelese_nem: !data.attic_door_insulated ? 'X' : '',
            pf_kivul_fodemen: data.pf_kivul_fodemen ? 'X' : '',
            pf_kivul_oromfal: data.pf_kivul_oromfal ? 'X' : '',
            pf_kivul_bonthato: data.pf_kivul_bonthato ? 'X' : '',
            pf_kivul_egyeb: data.pf_kivul_egyeb ? 'X' : '',
            pf_kivul_egyeb_szoveg: data.pf_kivul_egyeb_szoveg || '',
            megtakaritas: energySaving,
            gj: energySaving,
            brszamoltertek: this.formatCurrency(szamoltGrossValue), // Updated to use calculated gross value
            hem: this.formatCurrency(data.hem_value),
            tamogatas: this.formatCurrency(data.government_support),

            // Materials
            parazarofolia: data.vapor_barrier_type || '',
            paraateresztofolia: data.breathable_membrane_type || '',
            szigeteles: data.insulation_type || '',

            // Logic
            padlasfeljaro_szigetelve: data.attic_door_insulated ? 'IGEN' : 'NEM',

            // CONTRACTOR DATA (Dynamic)
            vallalkozo_nev: contractor.companyName,
            vallalkozo_cim: contractor.address,
            vallalkozo_adoszam: contractor.taxNumber,
            vallalkozo_bankszamla: contractor.bank.accountNumber || '',
            vallalkozo_kepviselo: contractor.representative.name || '',

            // For new dynamic templates, we expose explicit keys for company info
            company_name: contractor.companyName,
            company_address: contractor.address,
            company_tax_number: contractor.taxNumber,

            // Keep English keys for backward compatibility
            contractor_name: contractor.companyName,
            contract_number: data.contract_number || '',
            szerzodesszama: data.contract_number || '',
            ev: new Date().getFullYear(),
            contract_date: this.formatDate(data.contract_date || new Date()),
            contract_date: this.formatDate(data.contract_date || new Date()),
            location: data.location || 'Sződliget',
        };

        // --- ATTIC DECLARATION VARIABLES (Padlásfeljáró) ---
        const boxChecked = '☑';
        const boxUnchecked = '□';

        // 1. padlasfeljaro_szigetelese (IGEN/NEM) -> Splitted into _igen and _nem tags based on log
        const isAtticInsulated = data.attic_door_insulated === true || data.padlasfeljaro_szigetelese === 'IGEN' || data.padlasfeljaro_szigetelese === true;

        if (isAtticInsulated) {
            result.padlasfeljaro_szigetelese_igen = boxChecked;
            result.padlasfeljaro_szigetelese_nem = boxUnchecked;
            // Legacy/Fallback
            result.padlasfeljaro_szigetelese = '☑IGEN             □NEM';
        } else {
            result.padlasfeljaro_szigetelese_igen = boxUnchecked;
            result.padlasfeljaro_szigetelese_nem = boxChecked;
            // Legacy/Fallback
            result.padlasfeljaro_szigetelese = '□IGEN             ☑NEM';
        }

        // 2. pf_kivul_* variables
        result.pf_kivul_fodemen = data.pf_kivul_fodemen ? boxChecked : boxUnchecked;
        result.pf_kivul_oromfal = data.pf_kivul_oromfal ? boxChecked : boxUnchecked;
        result.pf_kivul_bonthato = data.pf_kivul_bonthato ? boxChecked : boxUnchecked;

        // 3. pf_kivul_egyeb
        // Log shows both pf_kivul_egyeb AND pf_kivul_egyeb_szoveg tags exist
        // So we populate them separately to avoid duplication
        result.pf_kivul_egyeb = data.pf_kivul_egyeb ? boxChecked : boxUnchecked;
        result.pf_kivul_egyeb_szoveg = data.pf_kivul_egyeb_szoveg || '';

        // ALIASING: Map the IGEN/NEM string to other potential keys to catch template mismatch
        result.attic_door_insulated = result.padlasfeljaro_szigetelese;
        result.padlasfeljaro_hoszigetelese = result.padlasfeljaro_szigetelese; // Another potential hungarian name

        console.log('[DEBUG] Final keys passed to template:', Object.keys(result).filter(k => k.includes('padlas') || k.includes('attic') || k.includes('pf_')));

        // CRITICAL FIX: Only add base64 image fields if they have actual data
        // This prevents empty strings or undefined from appearing as garbage text
        const customerSig = this.cleanValue(data.customer_signature_data);
        if (customerSig) {
            result.alairasugyfel = customerSig;
            // Map generic 'alairas' tag to customer signature as well (for Tamogatas doc)
            // SAFEGUARD: Do NOT map alairas for megallapodas_hem to prevent base64 text leakage
            // if the template accidentally contains [[alairas]] (Text) instead of [[%alairas]] (Image)
            // UPDATE: We fixed the templates with the script, so we can now safely map it.
            // But let's keep a check: only map if it's NOT megallapodas_hem OR if we are sure it's fixed.
            // Actually, the plan is to fix the template tags to [%alairas], so we SHOULD map it now.
            // Reverting the safeguard to allow signature in megallapodas_hem.
            result.alairas = customerSig;
        } else {
            result.alairasugyfel = '';
            // Ensure it's not undefined
            result.alairas = '';
        }

        const contractorSig = this.cleanValue(data.contractor_signature_data);
        if (contractorSig) {
            result.alairaskivitelezo = contractorSig;
        } else {
            result.alairaskivitelezo = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
        }

        // Bélyegző betöltése (Stamp logic)
        try {
            const stampPath = path.join(__dirname, '../assets/kivitelezo_belyegzo.jpg');
            if (fs.existsSync(stampPath)) {
                // Read as base64
                const stampBuffer = fs.readFileSync(stampPath);
                result.belyegzo = stampBuffer; // Docxtemplater can handle Buffer directly
                console.log('[DocumentGenerator] Stamp loaded successfully');
            } else {
                console.warn('[DocumentGenerator] Stamp file not found:', stampPath);
                result.belyegzo = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
            }
        } catch (stampErr) {
            console.error('[DocumentGenerator] Error loading stamp:', stampErr);
            result.belyegzo = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
        }

        // Alaprajz logic preserved if needed for other docs, but signature is gone.
        const floorPlan = this.cleanValue(data.alaprajz);
        if (floorPlan) {
            result.alaprajz = floorPlan;
        } else {
            // Provide 1x1 transparent PNG if no floor plan is present to avoid [[alaprajz]] appearing as text
            result.alaprajz = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
        }

        // Alaprajz Plusz logic
        const floorPlanPlus = this.cleanValue(data.alaprajzplusz);
        if (floorPlanPlus) {
            result.alaprajzplusz = floorPlanPlus;
        } else {
            // Provide 1x1 transparent PNG if no second floor plan is present
            result.alaprajzplusz = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
        }

        return result;
    }
}

module.exports = new DocumentGenerator();
