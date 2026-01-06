const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: false
});

async function listUsers() {
    try {
        await sequelize.authenticate();
        console.log('Connected to DB.');
        const [users] = await sequelize.query("SELECT id, email, role, organization_id, created_at FROM users");
        console.log('Users found:', users);
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

listUsers();
