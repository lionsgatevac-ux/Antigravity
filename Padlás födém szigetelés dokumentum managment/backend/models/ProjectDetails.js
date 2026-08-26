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
            attic_door_insulated = false,
            insulation_type, vapor_barrier_type, breathable_membrane_type,
            pf_kivul_fodemen = false, pf_kivul_oromfal = false, pf_kivul_bonthato = false,
            pf_kivul_egyeb = false, pf_kivul_egyeb_szoveg = ''
        } = data;

        const result = await query(
            `INSERT INTO project_details (
        project_id, customer_id, property_id,
        gross_area, chimney_area, attic_door_area, other_deducted_area, net_area,
        insulation_thickness, r_value,
        work_start_date, work_end_date, handover_date,
        net_amount, net_amount_words, labor_cost,
        energy_saving_gj, hem_value, government_support,
        attic_door_insulated,
        insulation_type, vapor_barrier_type, breathable_membrane_type,
        pf_kivul_fodemen, pf_kivul_oromfal, pf_kivul_bonthato, pf_kivul_egyeb, pf_kivul_egyeb_szoveg
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28)
      RETURNING *`,
            [project_id, customer_id, property_id,
                gross_area, chimney_area, attic_door_area, other_deducted_area, net_area,
                insulation_thickness, r_value,
                work_start_date, work_end_date, handover_date,
                net_amount, net_amount_words, labor_cost,
                energy_saving_gj, hem_value, government_support,
                attic_door_insulated,
                insulation_type, vapor_barrier_type, breathable_membrane_type,
                pf_kivul_fodemen, pf_kivul_oromfal, pf_kivul_bonthato, pf_kivul_egyeb, pf_kivul_egyeb_szoveg]
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
            attic_door_insulated,
            insulation_type, vapor_barrier_type, breathable_membrane_type,
            pf_kivul_fodemen, pf_kivul_oromfal, pf_kivul_bonthato, pf_kivul_egyeb, pf_kivul_egyeb_szoveg
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
        insulation_type = $18, vapor_barrier_type = $19, breathable_membrane_type = $20,
        pf_kivul_fodemen = $21, pf_kivul_oromfal = $22, pf_kivul_bonthato = $23,
        pf_kivul_egyeb = $24, pf_kivul_egyeb_szoveg = $25,
        updated_at = NOW()
       WHERE project_id = $26 RETURNING *`,
            [gross_area, chimney_area, attic_door_area, other_deducted_area, net_area,
                insulation_thickness, r_value,
                work_start_date, work_end_date, handover_date,
                net_amount, net_amount_words, labor_cost,
                energy_saving_gj, hem_value, government_support,
                attic_door_insulated,
                insulation_type, vapor_barrier_type, breathable_membrane_type,
                pf_kivul_fodemen, pf_kivul_oromfal, pf_kivul_bonthato, pf_kivul_egyeb, pf_kivul_egyeb_szoveg,
                project_id]
        );

        return result.rows[0];
    }
}

module.exports = ProjectDetails;
