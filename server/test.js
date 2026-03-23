// import GoogleDriveManager from './gDrive.cjs';
// import fs from 'fs/promises';
// import path from 'path';

// async function test() {
//   // Load credentials
//   const credentialsFile = await fs.readFile('./client_secret.json', 'utf8');
//   const credentials = JSON.parse(credentialsFile);
  
//   const clientId = credentials.installed?.client_id || credentials.web?.client_id;
//   const clientSecret = credentials.installed?.client_secret || credentials.web?.client_secret;

//   const gdrive = new GoogleDriveManager(clientId, clientSecret);
//   await gdrive.initialize();

//   // Example: Upload a test file
//   const testFilePath = path.join(__dirname, 'test.txt');
//   await fs.writeFile(testFilePath, 'Hello Google Drive!');
  
//   console.log('Uploading test file...');
//   const uploaded = await gdrive.uploadFile(testFilePath, 'text/plain');
  
//   console.log('Listing files...');
//   await gdrive.listFiles();
  
//   // Clean up
//   await fs.unlink(testFilePath);
// }

// // Uncomment to run test
// // test().catch(console.error);