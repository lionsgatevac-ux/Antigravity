const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

// GET monthly statistics
router.get('/monthly', async (req, res, next) => {
    try {
        const result = await query(`
      SELECT 
        DATE_TRUNC('month', p.created_at) as month,
        COUNT(p.id) as project_count,
        SUM(pd.net_area) as total_area,
        SUM(pd.net_amount) as total_revenue,
        SUM(pd.energy_saving_gj) as total_gj,
        AVG(pd.net_area) as avg_area
      FROM projects p
      LEFT JOIN project_details pd ON p.id = pd.project_id
      WHERE p.created_at >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', p.created_at)
      ORDER BY month DESC
    `);

        res.json({ success: true, data: result.rows });
    } catch (error) {
        next(error);
    }
});

// GET overview statistics
router.get('/overview', async (req, res, next) => {
    try {
        const totalProjects = await query('SELECT COUNT(*) as count FROM projects');
        const activeProjects = await query("SELECT COUNT(*) as count FROM projects WHERE status = 'in_progress'");
        const completedProjects = await query("SELECT COUNT(*) as count FROM projects WHERE status = 'completed'");
        const auditedProjects = await query("SELECT COUNT(*) as count FROM projects WHERE status = 'audited'");
        const soldProjects = await query("SELECT COUNT(*) as count FROM projects WHERE status = 'sold'");

        const stats = await query(`
            SELECT 
                SUM(net_area) as total_area,
                SUM(net_amount) as total_revenue,
                SUM(energy_saving_gj) as total_gj
            FROM project_details
        `);

        const totalGJ = parseFloat(stats.rows[0].total_gj) || 0;
        const profitRate = 16000;
        const totalProfit = totalGJ * profitRate;

        res.json({
            success: true,
            data: {
                totalProjects: parseInt(totalProjects.rows[0].count),
                activeProjects: parseInt(activeProjects.rows[0].count),
                completedProjects: parseInt(completedProjects.rows[0].count),
                auditedProjects: parseInt(auditedProjects.rows[0].count),
                soldProjects: parseInt(soldProjects.rows[0].count),
                totalArea: parseFloat(stats.rows[0].total_area) || 0,
                totalRevenue: parseFloat(stats.rows[0].total_revenue) || 0,
                totalGJ: totalGJ,
                totalProfit: totalProfit
            }
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
