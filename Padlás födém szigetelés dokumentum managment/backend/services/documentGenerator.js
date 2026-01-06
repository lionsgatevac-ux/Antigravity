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

    // Generate document from template
    async generate(templateName, data) {
        // DEBUG: Redirect console output to file
        const logFile = fs.createWriteStream(path.join(__dirname, '../debug_console.log'), { flags: 'a' });
        const originalLog = console.log;
        const originalError = console.error;

        console.log = function (...args) {
            logFile.write(new Date().toISOString() + ' [INFO] ' + args.join(' ') + '\n');
            originalLog.apply(console, args);
        };
        console.error = function (...args) {
            logFile.write(new Date().toISOString() + ' [ERROR] ' + args.join(' ') + '\n');
            originalError.apply(console, args);
        };

        console.log('--- START DOCUMENT GENERATION ---');
        console.log(`Requested Template: ${templateName}`);
        console.log(`User Role: ${data.owner_role}`);

        try {
            // Template selection based on role
            let targetTemplate = templateName;
            if (data.owner_role === 'external') {
                targetTemplate = `${templateName}_ext`;
                console.log(`External user detected. Using template: ${targetTemplate}`);
            }

            // Template path
            const templatePath = path.join(this.templatesDir, `${targetTemplate}.docx`);

            if (!fs.existsSync(templatePath)) {
                // Fallback to default if external template missing? Or error?
                // User said "csinálj az új regisztrálónak új sablonokat".
                // I will try to fallback to default if _ext missing, but log warning.
                if (data.owner_role === 'external' && fs.existsSync(path.join(this.templatesDir, `${templateName}.docx`))) {
                    console.warn(`External template ${targetTemplate} not found. Falling back to ${templateName}`);
                    targetTemplate = templateName;
                } else {
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
                    console.log(`[ImageModule] getImage called for tag: ${tagName}`);
                    // tagValue is the base64 string
                    if (base64Regex.test(tagValue)) {
                        console.log('[ImageModule] Base64 tag detected');
                        const base64Data = tagValue.replace(base64Regex, "").trim();
                        return Buffer.from(base64Data, 'base64');
                    }
                    console.log('[ImageModule] Not a base64 string, returning binary');
                    return Buffer.from(tagValue, 'binary');
                };
                opts.getSize = function (img, tagValue, tagName) {
                    console.log(`[ImageModule] getSize called for tag: ${tagName}`);
                    if (base64Regex.test(tagValue)) {
                        // Try to get size from image
                        try {
                            const base64Data = tagValue.replace(base64Regex, "").trim();
                            const buffer = Buffer.from(base64Data, 'base64');
                            const dimensions = sizeOf(buffer);
                            console.log(`[ImageModule] Dimensions: ${dimensions.width}x${dimensions.height}`);

                            // SCALE LOGIC
                            let maxWidth = 200; // Default for signatures
                            if (tagName === 'alaprajz') {
                                maxWidth = 600; // Increased by another 15%
                                console.log('[ImageModule] tagName is alaprajz, using maxWidth 600');
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
                    }
                    return [150, 50];
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
            const debugInfo = {
                templateContainsImageTag: text.includes('[[%alairasugyfel]]'),
                templateContainsTextTag: text.includes('[[alairasugyfel]]'),
                imageModuleLoaded: !!doc.modules.find(m => m.name === 'ImageModule' || m.options), // simplistic check
                moduleError: null
            };

            try {
                fs.writeFileSync(path.join(__dirname, '../debug_log.txt'), JSON.stringify(debugInfo, null, 2));
            } catch (e) { console.error(e); }

            // Prepare data with formatting
            const formattedData = this.prepareData(data);

            // Render document
            doc.render(formattedData);

            // Generate buffer
            const buf = doc.getZip().generate({
                type: 'nodebuffer',
                compression: 'DEFLATE'
            });

            // Save file
            const fileName = `${targetTemplate}_${data.contract_number || Date.now()}.docx`;
            const filePath = path.join(this.generatedDir, fileName);
            fs.writeFileSync(filePath, buf);

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

    // Prepare and format data for template
    prepareData(data) {
        // Calculate labor cost words
        const laborCostWords = this.numberToHungarianWords(data.labor_cost) + ' forint';
        const netAmountWords = data.net_amount_words || (this.numberToHungarianWords(data.net_amount) + ' forint');

        // ENERGY SAVING FALLBACK (Recalculate if 0)
        let energySaving = parseFloat(data.energy_saving_gj || 0);
        if (energySaving <= 0 && data.net_area > 0) {
            console.log(`[DocumentGenerator] GJ is ${energySaving}, recalculating from net_area ${data.net_area}`);
            energySaving = parseFloat((parseFloat(data.net_area) * 0.461).toFixed(2));
        }

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
            futes: data.heating_type || '',
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
            datum: this.formatDate(data.contract_date || new Date()),
            munka_kezdete: this.formatDate(data.work_start_date),
            kezdes: this.formatDate(data.work_start_date),
            munka_vege: this.formatDate(data.work_end_date),
            vege: this.formatDate(data.work_end_date),
            atadas_datum: this.formatDate(data.handover_date),

            // Financial
            szerzodesi_osszeg: this.formatCurrency(data.net_amount),
            szamoltosszeg: this.formatCurrency(data.net_amount),
            szerzodesi_osszeg_betuvel: netAmountWords,
            szamoltosszegbetuvel: netAmountWords,
            munkadij: this.formatCurrency(data.labor_cost),
            munkadijbetuvel: laborCostWords, // Added for missing requirement
            munkadij_betuvel: laborCostWords, // Added alias to be safe
            megtakaritas: energySaving,
            gj: energySaving,
            brszamoltertek: this.formatCurrency(data.net_amount), // Added for HEM doc
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
            location: data.location || 'Sződliget',
        };

        // CRITICAL FIX: Only add base64 image fields if they have actual data
        // This prevents empty strings or undefined from appearing as garbage text
        const customerSig = this.cleanValue(data.customer_signature_data);
        if (customerSig) {
            result.alairasugyfel = customerSig;
        }

        const contractorSig = this.cleanValue(data.contractor_signature_data);
        if (contractorSig) {
            result.alairaskivitelezo = contractorSig;
        } else {
            // CRITICAL: Provide empty 1x1 transparent PNG if no contractor signature
            // This prevents the tag from appearing as text in the document
            result.alairaskivitelezo = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
        }

        // Alaprajz logic preserved if needed for other docs, but signature is gone.
        const floorPlan = this.cleanValue(data.alaprajz);
        if (floorPlan) {
            result.alaprajz = floorPlan;
        } else {
            // Provide 1x1 transparent PNG if no floor plan is present to avoid [[alaprajz]] appearing as text
            result.alaprajz = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
        }

        return result;
    }
}

module.exports = new DocumentGenerator();
