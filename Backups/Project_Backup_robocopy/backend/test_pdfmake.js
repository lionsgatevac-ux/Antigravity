try {
    console.log('Attempting to require pdfmake...');
    const PdfPrinter = require('pdfmake');
    console.log('PDFMake loaded successfully');
} catch (e) {
    console.error('Error loading pdfmake:', e);
    console.error(e.stack);
}
