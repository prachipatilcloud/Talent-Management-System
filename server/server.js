import dotenv from 'dotenv';
dotenv.config();

import app from './src/app.js';
import connectDB from './src/config/db.js';
import { initializeGoogleDrive } from './src/config/googleDrive.js';

connectDB();

// Initialize Google Drive (non-blocking)
initializeGoogleDrive().catch((error) => {
    console.error('Warning: Google Drive initialization failed:', error.message);
    console.log('Server will continue running. Google Drive features may not be available.');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, ()=> {
    console.log(`Server running on port ${PORT}`);
    
})