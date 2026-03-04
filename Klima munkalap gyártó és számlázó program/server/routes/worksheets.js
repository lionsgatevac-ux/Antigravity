const express = require('express');
const router = express.Router();
const worksheetController = require('../controllers/worksheetController');

router.get('/', worksheetController.getAllWorksheets);
router.get('/stats', worksheetController.getDashboardStats);
router.post('/', worksheetController.createWorksheet);
router.get('/:id', worksheetController.getWorksheetById);
router.get('/:id/pdf', worksheetController.downloadPDF);
router.get('/stats', worksheetController.getDashboardStats);
router.post('/:id/invoice', worksheetController.createInvoice);
router.post('/:id/email', worksheetController.sendInvoiceEmail);

router.get('/settings', worksheetController.getSettings);
router.post('/settings', worksheetController.updateSettings);

module.exports = router;
