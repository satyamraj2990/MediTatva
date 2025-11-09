const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');

// Finalize invoice (create and update inventory)
router.post('/finalize', invoiceController.finalizeInvoice);

// Get invoice statistics
router.get('/stats', invoiceController.getInvoiceStats);

// Get all invoices
router.get('/', invoiceController.getAllInvoices);

// Get single invoice
router.get('/:id', invoiceController.getInvoice);

module.exports = router;
