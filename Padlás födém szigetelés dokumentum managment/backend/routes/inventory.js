const express = require('express');
const router = express.Router();
const { query, transaction } = require('../config/database');

const authMiddleware = require('../middleware/authMiddleware');

// Valid categories
const VALID_CATEGORIES = ['insulation', 'vapor_barrier', 'breathable_membrane'];

// GET / - List all materials with stock info
// Public/Protected? Let's protect it.
router.get('/', authMiddleware, async (req, res, next) => {
    try {
        const result = await query(
            'SELECT id, category, name, stock_quantity_current, unit, coverage FROM materials ORDER BY category, name'
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        next(error);
    }
});

// PUT /:id - Update material details (coverage, etc.)
router.put('/:id', authMiddleware, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { coverage, unit, name, category } = req.body;

        // Validation
        if (category && !VALID_CATEGORIES.includes(category)) {
            return res.status(400).json({ success: false, error: 'Invalid category' });
        }

        const fields = [];
        const values = [];
        let idx = 1;

        if (coverage !== undefined) {
            fields.push(`coverage = $${idx++}`);
            values.push(coverage);
        }
        if (unit !== undefined) {
            fields.push(`unit = $${idx++}`);
            values.push(unit);
        }
        if (name !== undefined) {
            fields.push(`name = $${idx++}`);
            values.push(name);
        }
        if (category !== undefined) {
            fields.push(`category = $${idx++}`);
            values.push(category);
        }

        if (fields.length === 0) {
            return res.status(400).json({ success: false, error: 'No fields to update' });
        }

        values.push(id);
        const queryText = `UPDATE materials SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`;

        const result = await query(queryText, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Material not found' });
        }

        res.json({ success: true, data: result.rows[0], message: 'Material updated successfully' });

    } catch (error) {
        next(error);
    }
});

// POST /restock - Add stock
router.post('/restock', authMiddleware, async (req, res, next) => {
    try {
        const { items, notes } = req.body; // items: [{ material_id, quantity }]

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ success: false, error: 'Items array is required' });
        }

        await transaction(async (client) => {
            for (const item of items) {
                const { material_id, quantity } = item;

                // Update stock
                await client.query(
                    'UPDATE materials SET stock_quantity_current = stock_quantity_current + $1 WHERE id = $2',
                    [quantity, material_id]
                );

                // Log transaction
                await client.query(
                    `INSERT INTO material_transactions 
                    (material_id, quantity_change, quantity, transaction_type, notes, created_by) 
                    VALUES ($1, $2, $3, 'RESTOCK', $4, $5)`,
                    [material_id, quantity, quantity, notes, req.user ? req.user.id : null] // quantity_change is +quantity, quantity is absolute quantity
                );
            }
        });

        res.json({ success: true, message: 'Stock updated successfully' });

    } catch (error) {
        next(error);
    }
});

// POST /handover - Deduct stock for project or transfer to user
router.post('/handover', authMiddleware, async (req, res, next) => {
    try {
        const { project_id, recipient_id, items, signature, notes } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ success: false, error: 'Items array is required' });
        }

        // Prevent self-handover
        if (Number(recipient_id) === Number(req.user.id)) {
            return res.status(400).json({ success: false, error: 'Self-handover is not allowed. Use Usage/Consumption instead.' });
        }

        // Determine status
        // If project_id is present, it's a direct usage -> COMPLETED (requires signature immediately, which is separate flow or same?)
        // The plan says: Project Mode -> Signed immediately -> COMPLETED.
        // User Mode -> "Send Request" -> PENDING.

        let status = 'COMPLETED';
        if (!project_id && recipient_id && !signature) {
            status = 'PENDING';
        }

        await transaction(async (client) => {
            for (const item of items) {
                const { material_id, quantity } = item;

                // 1. Deduct from Central Stock (Physical movement happened or is happening)
                // Even for PENDING, we reserve/move it out of available stock.
                await client.query(
                    'UPDATE materials SET stock_quantity_current = stock_quantity_current - $1 WHERE id = $2',
                    [quantity, material_id]
                );

                // 2. Create Transaction
                await client.query(
                    `INSERT INTO material_transactions 
                    (material_id, quantity_change, quantity, transaction_type, project_id, recipient_user_id, signature_data, status, notes, created_by) 
                    VALUES ($1, $2, $3, 'HANDOVER', $4, $5, $6, $7, $8, $9)`,
                    [
                        material_id,
                        -quantity,
                        quantity,
                        project_id,
                        recipient_id,
                        signature || null,
                        status,
                        notes,
                        req.user ? req.user.id : null
                    ]
                );
            }
        });

        res.json({ success: true, message: 'Handover recorded successfully', status });

    } catch (error) {
        next(error);
    }
});

// GET /pending - List pending handovers for the current user
router.get('/pending', authMiddleware, async (req, res, next) => {
    try {
        // Find transactions where recipient is current user and status is PENDING
        // Group by creation time or batch? 
        // For now, listing individual items or grouping by created_at/notes might be better.
        // Let's return raw list for now, frontend can group.

        const result = await query(
            `SELECT t.id, t.material_id, m.name as material_name, m.unit, t.quantity_change, t.created_at, u.full_name as sender_name
             FROM material_transactions t
             JOIN materials m ON t.material_id = m.id
             LEFT JOIN users u ON t.created_by = u.id
             WHERE t.recipient_user_id = $1 AND t.status = 'PENDING'
             ORDER BY t.created_at DESC`,
            [req.user.id]
        );

        res.json({ success: true, data: result.rows });
    } catch (error) {
        next(error);
    }
});

// POST /accept - Accept pending items
router.post('/accept', authMiddleware, async (req, res, next) => {
    try {
        const { transactionIds, signature } = req.body;

        if (!transactionIds || !Array.isArray(transactionIds) || transactionIds.length === 0) {
            return res.status(400).json({ success: false, error: 'No transactions selected' });
        }
        if (!signature) {
            return res.status(400).json({ success: false, error: 'Signature required' });
        }

        await transaction(async (client) => {
            // Update status to COMPLETED and add signature
            // Verify that these transactions belong to the user!
            const placeholders = transactionIds.map((_, i) => `$${i + 2}`).join(',');

            await client.query(
                `UPDATE material_transactions 
                  SET status = 'COMPLETED', signature_data = $1, created_at = NOW() 
                  WHERE id IN (${placeholders}) AND recipient_user_id = $${transactionIds.length + 2} AND status = 'PENDING'`,
                [signature, ...transactionIds, req.user.id]
            );
        });

        res.json({ success: true, message: 'Items accepted successfully' });

    } catch (error) {
        next(error);
    }
});

// GET /calculate-needs/:projectId
router.get('/calculate-needs/:projectId', authMiddleware, async (req, res, next) => {
    try {
        const { projectId } = req.params;

        // 1. Get Project Details
        const projectRes = await query(
            `SELECT pd.net_area, pd.insulation_type, pd.vapor_barrier_type, pd.breathable_membrane_type 
             FROM project_details pd 
             JOIN projects p ON pd.project_id = p.id 
             WHERE p.id = $1`,
            [projectId]
        );

        if (projectRes.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Project details not found' });
        }

        const details = projectRes.rows[0];
        const netArea = parseFloat(details.net_area) || 0;
        const suggestions = [];

        // Helper to find material and calc quantity
        const addSuggestion = async (materialName, category) => {
            if (!materialName) return;

            // Find material by name (fuzzy match or exact?) 
            // The project_details stores the *exact name* string selected from dropdown.
            const matRes = await query(
                'SELECT id, name, coverage, unit, stock_quantity_current FROM materials WHERE name = $1',
                [materialName]
            );

            if (matRes.rows.length > 0) {
                const mat = matRes.rows[0];
                let quantity = 0;
                let reason = '';

                if (mat.coverage && mat.coverage > 0) {
                    quantity = Math.ceil(netArea / mat.coverage);
                    reason = `${netArea}m2 / ${mat.coverage}m2 per ${mat.unit}`;
                } else {
                    // Fallback if no coverage set
                    quantity = netArea; // Assuming 1:1 if unknown? Or just 0.
                    reason = 'Coverage not set, defaulting to area logic?';
                }

                suggestions.push({
                    material_id: mat.id,
                    name: mat.name,
                    category: category,
                    suggested_quantity: quantity,
                    unit: mat.unit,
                    current_stock: mat.stock_quantity_current,
                    reason: reason
                });
            }
        };

        await addSuggestion(details.insulation_type, 'insulation');
        await addSuggestion(details.vapor_barrier_type, 'vapor_barrier');
        await addSuggestion(details.breathable_membrane_type, 'breathable_membrane');

        res.json({ success: true, data: { net_area: netArea, suggestions } });

    } catch (error) {
        next(error);
    }
});

// GET /my-stock - List current user's stock
router.get('/my-stock', authMiddleware, async (req, res, next) => {
    try {
        const userId = req.user.id;

        const result = await query(`
            SELECT 
                m.id, 
                m.name, 
                m.unit, 
                COALESCE(SUM(CASE 
                    WHEN t.recipient_user_id = $1 AND t.status = 'COMPLETED' AND t.project_id IS NULL THEN t.quantity 
                    WHEN t.created_by = $1 AND t.transaction_type = 'USAGE' THEN -t.quantity 
                    ELSE 0 
                END), 0) as stock
            FROM materials m
            LEFT JOIN material_transactions t ON m.id = t.material_id
            GROUP BY m.id, m.name, m.unit
            HAVING 
                COALESCE(SUM(CASE 
                    WHEN t.recipient_user_id = $1 AND t.status = 'COMPLETED' AND t.project_id IS NULL THEN t.quantity 
                    WHEN t.created_by = $1 AND t.transaction_type = 'USAGE' THEN -t.quantity 
                    ELSE 0 
                END), 0) > 0
            ORDER BY m.name
        `, [userId]);

        res.json({ success: true, data: result.rows });
    } catch (error) {
        next(error);
    }
});

// POST /usage - Record material usage on a project (User -> Project)
router.post('/usage', authMiddleware, async (req, res, next) => {
    try {
        const { project_id, items, notes } = req.body; // items: [{ material_id, quantity }]

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ success: false, error: 'Items array is required' });
        }
        if (!project_id) {
            return res.status(400).json({ success: false, error: 'Project ID is required' });
        }

        await transaction(async (client) => {
            for (const item of items) {
                const { material_id, quantity } = item;

                // 1. Check User Stock
                const stockRes = await client.query(`
                    SELECT 
                        COALESCE(SUM(CASE 
                            WHEN t.recipient_user_id = $1 AND t.status = 'COMPLETED' AND t.project_id IS NULL THEN t.quantity 
                            WHEN t.created_by = $1 AND t.transaction_type = 'USAGE' THEN -t.quantity 
                            ELSE 0 
                        END), 0) as current_stock
                    FROM material_transactions t
                    WHERE t.material_id = $2
                `, [req.user.id, material_id]);

                const currentStock = parseInt(stockRes.rows[0]?.current_stock || 0);

                if (currentStock < quantity) {
                    console.warn(`[Usage] Negative stock warning for ${material_id}: Need ${quantity}, have ${currentStock}. Proceeding anyway.`);
                    // throw new Error(...) - Removed per user request
                }

                // 2. Record Usage (quantity_change = 0 for central stock, quantity = amount used)
                await client.query(
                    `INSERT INTO material_transactions 
                    (material_id, quantity_change, quantity, transaction_type, project_id, status, notes, created_by) 
                    VALUES ($1, 0, $2, 'USAGE', $3, 'COMPLETED', $4, $5)`,
                    [material_id, quantity, project_id, notes, req.user.id]
                );
            }
        });

        res.json({ success: true, message: 'Anyagfelhasználás rögzítve.' });

    } catch (error) {
        if (error.message.includes('Nincs elég készlet')) {
            return res.status(400).json({ success: false, error: error.message });
        }
        next(error);
    }
});

// GET /history - List past handovers (Completed with Signature)
router.get('/history', authMiddleware, async (req, res, next) => {
    try {
        // Fetch COMPLETED HANDOVER transactions
        // We need to group them by "event" (same time, same people).
        // Since we don't have a BatchID, we'll fetch all and group on frontend OR group here.
        // Let's fetch flat list and group on frontend for flexibility, or simple grouping here.
        // Returning flat list with enough info to group.

        const result = await query(
            `SELECT 
                t.id, 
                t.created_at, 
                t.notes, 
                t.signature_data,
                m.name as material_name, 
                m.unit, 
                t.quantity,
                p.contract_number, 
                p.customer_name,
                sender.full_name as sender_name,
                recipient.full_name as recipient_name
             FROM material_transactions t
             JOIN materials m ON t.material_id = m.id
             LEFT JOIN projects p ON t.project_id = p.id
             LEFT JOIN users sender ON t.created_by = sender.id
             LEFT JOIN users recipient ON t.recipient_user_id = recipient.id
             WHERE t.transaction_type = 'HANDOVER' AND t.status = 'COMPLETED'
             ORDER BY t.created_at DESC`
        );

        res.json({ success: true, data: result.rows });

    } catch (error) {
        next(error);
    }
});

// GET /transactions - Full stock movement history
router.get('/transactions', authMiddleware, async (req, res, next) => {
    try {
        const isAdmin = req.user.role === 'admin';
        const userId = req.user.id;

        let queryText = `
            SELECT 
                t.id, 
                t.created_at, 
                t.transaction_type,
                t.quantity,
                t.quantity_change,
                t.status,
                t.notes,
                m.name as material_name, 
                m.unit, 
                p.contract_number, 
                c.full_name as customer_name,
                sender.full_name as sender_name,
                recipient.full_name as recipient_name
            FROM material_transactions t
            LEFT JOIN materials m ON t.material_id = m.id
            LEFT JOIN projects p ON t.project_id = p.id
            LEFT JOIN project_details pd ON p.id = pd.project_id
            LEFT JOIN customers c ON pd.customer_id = c.id
            LEFT JOIN users sender ON t.created_by = sender.id
            LEFT JOIN users recipient ON t.recipient_user_id = recipient.id
        `;

        const values = [];

        // Filter for non-admins: Only show transactions relevant to them
        if (!isAdmin) {
            queryText += ` WHERE (t.created_by = $1 OR t.recipient_user_id = $1) `;
            values.push(userId);
        }

        queryText += ` ORDER BY t.created_at DESC`;

        const result = await query(queryText, values);

        res.json({ success: true, data: result.rows });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
