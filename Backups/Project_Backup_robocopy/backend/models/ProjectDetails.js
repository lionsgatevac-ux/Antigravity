const { query } = require('../config/database');

class ProjectDetails {
    // Create project details
    static async create(data) {
        const {
            project_id, customer_id, property_id,
            gross_area, chimney_area, attic_door_area, other_deducted_area, net_area,
            insulation_thickness = 25, r_value = 6.25,
            work_start_date, work_end_date, handover_date,
            net_amount, net_amount_words, labor_cost,
            energy_saving_gj, hem_value, government_support,
            attic_door_insulated = false
        } = data;

        const result = await query(
            `INSERT INTO project_details (
        project_id, customer_id, property_id,
        gross_area, chimney_area, attic_door_area, other_deducted_area, net_area,
        insulation_thickness, r_value,
        work_start_date, work_end_date, handover_date,
        net_amount, net_amount_words, labor_cost,
        energy_saving_gj, hem_value, government_support,
        attic_door_insulated
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      RETURNING *`,
            [project_id, customer_id, property_id,
                gross_area, chimney_area, attic_door_area, other_deducted_area, net_area,
                insulation_thickness, r_value,
                work_start_date, work_end_date, handover_date,
                net_amount, net_amount_words, labor_cost,
                energy_saving_gj, hem_value, government_support,
                attic_door_insulated]
        );

        return result.rows[0];
    }

    // Find by project ID
    static async findByProjectId(project_id) {
        const result = await query(
            'SELECT * FROM project_details WHERE project_id = $1',
            [project_id]
        );
        return result.rows[0];
    }

    // Update project details
    static async update(project_id, data) {
        const {
            gross_area, chimney_area, attic_door_area, other_deducted_area, net_area,
            insulation_thickness, r_value,
            work_start_date, work_end_date, handover_date,
            net_amount, net_amount_words, labor_cost,
            energy_saving_gj, hem_value, government_support,
            attic_door_insulated
        } = data;

        const result = await query(
            `UPDATE project_details SET
        gross_area = $1, chimney_area = $2, attic_door_area = $3, 
        other_deducted_area = $4, net_area = $5,
        insulation_thickness = $6, r_value = $7,
        work_start_date = $8, work_end_date = $9, handover_date = $10,
        net_amount = $11, net_amount_words = $12, labor_cost = $13,
        energy_saving_gj = $14, hem_value = $15, government_support = $16,
        attic_door_insulated = $17,
        updated_at = NOW()
       WHERE project_id = $18 RETURNING *`,
            [gross_area, chimney_area, attic_door_area, other_deducted_area, net_area,
                insulation_thickness, r_value,
                work_start_date, work_end_date, handover_date,
                net_amount, net_amount_words, labor_cost,
                energy_saving_gj, hem_value, government_support,
                attic_door_insulated, project_id]
        );

        return result.rows[0];
    }
}

module.exports = ProjectDetails;
