const { query } = require('../config/database');

class Project {
    // Create new project
    static async create(data) {
        const { contract_number, status = 'draft', user_id } = data; // user_id passed from controller (req.user)

        // We need to fetch the user to get their organization_id? 
        // Better: Controller passes the full user object or extra params.
        // Assuming controller passes user_id, we might need a separate query or rely on controller passing organization_id.
        // Update: Controller (projects.js) creates project. We should pass organization_id there.
        // But here we signature is create(data). 
        // Let's assume data includes { ..., organization_id, created_by }

        const { organization_id, created_by } = data;

        const result = await query(
            'INSERT INTO projects (contract_number, status, organization_id, created_by) VALUES ($1, $2, $3, $4) RETURNING *',
            [contract_number, status, organization_id, created_by]
        );

        return result.rows[0];
    }

    // Get all projects (filtered by user role)
    static async findAll(filters = {}, user = null) {
        let sql = `SELECT p.*, c.full_name as customer_name, pd.net_area, pd.energy_saving_gj, pr.address_city as property_city,
                   u.company_name as owner_company
                   FROM projects p 
                   LEFT JOIN project_details pd ON p.id = pd.project_id 
                   LEFT JOIN customers c ON pd.customer_id = c.id
                   LEFT JOIN properties pr ON pd.property_id = pr.id
                   LEFT JOIN users u ON p.created_by = u.id`; // Joined on created_by

        const conditions = [];
        const params = [];

        // Role-based filtering
        if (user) {
            // Everyone is scoped to their Organization first
            conditions.push(`p.organization_id = $${params.length + 1}`);
            params.push(user.organization_id);

            if (user.role === 'admin') {
                // Admin sees EVERYTHING in their organization.
                // No extra filter needed beyond organization_id.
            } else {
                // Contractor sees only their own projects
                conditions.push(`p.created_by = $${params.length + 1}`);
                params.push(user.id);
            }
        }

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

    // Get project by ID (secured)
    static async findById(id, user = null) {
        // ... (we should add security check here too, but can do in route)

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
              u.company_name as owner_company_name,
              u.company_address as owner_company_address,
              u.company_tax_number as owner_company_tax_number,
              u.company_reg_number as owner_company_reg_number,
              u.full_name as owner_name,
              u.role as owner_role,
              (SELECT file_url FROM photos WHERE project_id = p.id AND photo_type = 'floor_plan' ORDER BY taken_at DESC LIMIT 1) as floor_plan_url
       FROM projects p
        INNER JOIN project_details pd ON p.id = pd.project_id
        LEFT JOIN customers c ON pd.customer_id = c.id
        LEFT JOIN properties pr ON pd.property_id = pr.id
        LEFT JOIN users u ON p.created_by = u.id
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
