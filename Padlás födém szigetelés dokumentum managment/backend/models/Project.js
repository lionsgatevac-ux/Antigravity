const { query } = require('../config/database');

class Project {
    // Create new project
    static async create(data) {
        const { contract_number, status = 'draft' } = data;

        const result = await query(
            'INSERT INTO projects (contract_number, status) VALUES ($1, $2) RETURNING *',
            [contract_number, status]
        );

        return result.rows[0];
    }

    // Get all projects
    static async findAll(filters = {}) {
        let sql = `SELECT p.*, c.full_name as customer_name, pd.net_area, pd.energy_saving_gj, pr.address_city as property_city 
                   FROM projects p 
                   LEFT JOIN project_details pd ON p.id = pd.project_id 
                   LEFT JOIN customers c ON pd.customer_id = c.id
                   LEFT JOIN properties pr ON pd.property_id = pr.id`;

        const conditions = [];
        const params = [];

        if (filters.status) {
            conditions.push(`p.status = $${params.length + 1}`);
            params.push(filters.status);
        }

        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }

        sql += ' ORDER BY p.created_at DESC';

        const result = await query(sql, params);
        return result.rows;
    }

    // Get project by ID
    static async findById(id) {
        const result = await query(
            `SELECT p.*, 
              pd.*, 
              c.full_name, c.phone, c.email, 
              c.birth_name, c.mother_name, c.id_number,
              c.address_postal_code as customer_postal_code,
              c.address_city as customer_city, c.address_street as customer_street,
              c.address_house_number as customer_house_number,
              pr.address_postal_code as property_postal_code, pr.address_city as property_city,
              pr.address_street as property_street, pr.address_house_number as property_house_number,
              pr.hrsz, pr.building_year, pr.building_type,
              pr.structure_type, pr.structure_thickness,
              pr.unheated_space_type, pr.unheated_space_area, pr.unheated_space_name,
              p.customer_signature_data, p.contractor_signature_data,
              p.customer_signed_at, p.contractor_signed_at,
              (SELECT file_url FROM photos WHERE project_id = p.id AND photo_type = 'floor_plan' ORDER BY taken_at DESC LIMIT 1) as floor_plan_url
       FROM projects p
        INNER JOIN project_details pd ON p.id = pd.project_id
        LEFT JOIN customers c ON pd.customer_id = c.id
        LEFT JOIN properties pr ON pd.property_id = pr.id
        WHERE p.id = $1`,
            [id]
        );

        return result.rows[0];
    }

    // Update project
    static async update(id, data) {
        const fields = [];
        const params = [];

        Object.entries(data).forEach(([key, value], index) => {
            fields.push(`${key} = $${index + 1}`);
            params.push(value);
        });

        if (fields.length === 0) return null;

        params.push(id);
        const result = await query(
            `UPDATE projects SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${params.length} RETURNING *`,
            params
        );

        return result.rows[0];
    }

    // Bulk update statuses
    static async bulkUpdateStatus(ids, status) {
        if (!ids || ids.length === 0) return { success: true, count: 0 };

        const result = await query(
            'UPDATE projects SET status = $1, updated_at = NOW() WHERE id = ANY($2) RETURNING id',
            [status, ids]
        );

        return { success: true, count: result.rows.length };
    }

    // Delete project
    static async delete(id) {
        await query('DELETE FROM projects WHERE id = $1', [id]);
        return { success: true };
    }

    // Generate contract number
    static async generateContractNumber() {
        const year = new Date().getFullYear();
        const result = await query(
            "SELECT contract_number FROM projects WHERE contract_number LIKE $1 ORDER BY created_at DESC LIMIT 1",
            [`BOZSO-${year}-%`]
        );

        let nextNumber = 100;
        if (result.rows.length > 0) {
            const lastNumber = parseInt(result.rows[0].contract_number.split('-')[2]);
            nextNumber = lastNumber + 1;
        }

        return `BOZSO-${year}-${String(nextNumber).padStart(4, '0')}`;
    }
}

module.exports = Project;
