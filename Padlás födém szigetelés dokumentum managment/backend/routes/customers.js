const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');

// GET all customers
router.get('/', async (req, res, next) => {
    try {
        const customers = await Customer.findAll();
        res.json({ success: true, data: customers });
    } catch (error) {
        next(error);
    }
});

// GET customer by ID
router.get('/:id', async (req, res, next) => {
    try {
        const customer = await Customer.findById(req.params.id);
        if (!customer) {
            return res.status(404).json({ success: false, error: 'Customer not found' });
        }
        res.json({ success: true, data: customer });
    } catch (error) {
        next(error);
    }
});

// POST create customer
router.post('/', async (req, res, next) => {
    try {
        const customer = await Customer.create(req.body);
        res.status(201).json({ success: true, data: customer });
    } catch (error) {
        next(error);
    }
});

// PUT update customer
router.put('/:id', async (req, res, next) => {
    try {
        const customer = await Customer.update(req.params.id, req.body);
        res.json({ success: true, data: customer });
    } catch (error) {
        next(error);
    }
});

// DELETE customer
router.delete('/:id', async (req, res, next) => {
    try {
        await Customer.delete(req.params.id);
        res.json({ success: true, message: 'Customer deleted' });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
