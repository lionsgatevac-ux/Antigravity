const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const worksheetRoutes = require('./routes/worksheets');

app.use(cors());
app.use(express.json());

app.use('/api/worksheets', worksheetRoutes);

app.get('/', (req, res) => {
    res.send('HVAC System API is running');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
