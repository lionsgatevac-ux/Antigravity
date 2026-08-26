const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

// GET all materials grouped by category
router.get('/', async (req, res, next) => {
    try {
        const result = await query(
            'SELECT id, category, name, is_default, coverage, unit FROM materials ORDER BY category, name'
        );

        // Group by category
        const grouped = {
            insulation: [],
            vapor_barrier: [],
            breathable_membrane: []
        };

        result.rows.forEach(row => {
            if (grouped[row.category]) {
                grouped[row.category].push(row);
            }
        });

        res.json({ success: true, data: grouped });
    } catch (error) {
        next(error);
    }
});

const authMiddleware = require('../middleware/authMiddleware');

// POST new material
router.post('/', authMiddleware, async (req, res, next) => {
    try {
        const { category, name } = req.body;

        // Validate category
        const validCategories = ['insulation', 'vapor_barrier', 'breathable_membrane'];
        if (!validCategories.includes(category)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid category. Must be one of: insulation, vapor_barrier, breathable_membrane'
            });
        }

        // Validate name
        if (!name || !name.trim()) {
            return res.status(400).json({
                success: false,
                error: 'Material name is required'
            });
        }

        // Insert new material
        const result = await query(
            'INSERT INTO materials (category, name) VALUES ($1, $2) RETURNING *',
            [category, name.trim()]
        );

        res.status(201).json({
            success: true,
            data: result.rows[0],
            message: 'Material added successfully'
        });
    } catch (error) {
        // Handle unique constraint violation
        if (error.code === '23505') {
            return res.status(409).json({
                success: false,
                error: 'This material already exists'
            });
        }
        next(error);
    }
});

// DELETE material by ID
router.delete('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;

        // Check if it's a default material
        const checkResult = await query(
            'SELECT is_default FROM materials WHERE id = $1',
            [id]
        );

        if (checkResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Material not found'
            });
        }

        if (checkResult.rows[0].is_default) {
            return res.status(403).json({
                success: false,
                error: 'Cannot delete default materials'
            });
        }

        await query('DELETE FROM materials WHERE id = $1', [id]);

        res.json({
            success: true,
            message: 'Material deleted successfully'
        });
    } catch (error) {
        next(error);
    }
});

// TEMP: Setup database table
router.get('/setup-table', async (req, res, next) => {
    try {
        await query('DROP TABLE IF EXISTS materials CASCADE');
        await query(`
            CREATE TABLE IF NOT EXISTS materials (
                id SERIAL PRIMARY KEY,
                category VARCHAR(50) NOT NULL,
                name VARCHAR(255) NOT NULL,
                is_default BOOLEAN DEFAULT false,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(category, name)
            );
        `);

        // Fix missing column (if exists from old migration)
        await query('ALTER TABLE materials ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false');

        // Seed if empty
        const count = await query('SELECT COUNT(*) FROM materials');
        if (parseInt(count.rows[0].count) === 0) {
            const materials = [
                { category: 'insulation', name: 'Thermowool Basic üveggyapot tekercs (0.039)', is_default: true },
                { category: 'vapor_barrier', name: 'Kingspan Nilvent ALU 150' },
                { category: 'vapor_barrier', name: 'Kingspan Nilvent 150' },
                { category: 'vapor_barrier', name: 'Delta Reflex' },
                { category: 'vapor_barrier', name: 'Tyvek VCL SD5' },
                { category: 'breathable_membrane', name: 'Kingspan Nilvent Plus 170' },
                { category: 'breathable_membrane', name: 'Delta Vent N' },
                { category: 'breathable_membrane', name: 'Tyvek Solid' },
                { category: 'breathable_membrane', name: 'Jutadach 135' }
            ];
            for (const m of materials) {
                await query('INSERT INTO materials (category, name, is_default) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING', [m.category, m.name, m.is_default || false]);
            }
            res.json({ success: true, message: 'Table created and seeded' });
        } else {
            res.json({ success: true, message: 'Table already exists and has data' });
        }
    } catch (error) {
        next(error);
    }
});

module.exports = router;
