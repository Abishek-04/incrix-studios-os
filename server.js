import app from './api/index.js';
import process from 'process';
import dotenv from 'dotenv';
dotenv.config();

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
