const { query } = require('../config/database');

class Customer {
    // Create new customer
    static async create(data) {
        const {
            full_name, birth_name, mother_name, id_number,
            address_postal_code, address_city, address_street, address_house_number,
            phone, email
        } = data;

        const result = await query(
            `INSERT INTO customers (
        full_name, birth_name, mother_name, id_number,
        address_postal_code, address_city, address_street, address_house_number,
        phone, email
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
            [full_name, birth_name, mother_name, id_number,
                address_postal_code, address_city, address_street, address_house_number,
                phone, email]
        );

        return result.rows[0];
    }

    // Find all customers
    static async findAll() {
        const result = await query('SELECT * FROM customers ORDER BY created_at DESC');
        return result.rows;
    }

    // Find customer by ID
    static async findById(id) {
        const result = await query('SELECT * FROM customers WHERE id = $1', [id]);
        return result.rows[0];
    }

    // Find by email
    static async findByEmail(email) {
        const result = await query('SELECT * FROM customers WHERE email = $1', [email]);
        return result.rows[0];
    }

    // Update customer
    static async update(id, data) {
        const {
            full_name, birth_name, mother_name, id_number,
            address_postal_code, address_city, address_street, address_house_number,
            phone, email
        } = data;

        const result = await query(
            `UPDATE customers SET
        full_name = $1, birth_name = $2, mother_name = $3, id_number = $4,
        address_postal_code = $5, address_city = $6, address_street = $7, 
        address_house_number = $8, phone = $9, email = $10
       WHERE id = $11 RETURNING *`,
            [full_name, birth_name, mother_name, id_number,
                address_postal_code, address_city, address_street, address_house_number,
                phone, email, id]
        );

        return result.rows[0];
    }

    // Delete customer
    static async delete(id) {
        await query('DELETE FROM customers WHERE id = $1', [id]);
        return { success: true };
    }
}

module.exports = Customer;
