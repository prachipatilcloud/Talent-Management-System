// const { google } = require('googleapis');
// const fs = require('fs').promises;
// const path = require('path');
// const readline = require('readline');
// const open = require('open');
// const express = require('express');

// class GoogleDriveManager {
//   constructor(clientId, clientSecret, redirectUri = 'http://localhost:3000/oauth2callback') {
//     this.clientId = clientId;
//     this.clientSecret = clientSecret;
//     this.redirectUri = redirectUri;
//     this.oAuth2Client = null;
//     this.drive = null;
//     this.tokenPath = path.join(__dirname, 'token.json');
//   }

//   // Initialize OAuth2 client
//   async initialize() {
//     this.oAuth2Client = new google.auth.OAuth2(
//       this.clientId,
//       this.clientSecret,
//       this.redirectUri
//     );

//     // Try to load existing token
//     try {
//       const token = await fs.readFile(this.tokenPath, 'utf8');
//       this.oAuth2Client.setCredentials(JSON.parse(token));
//       console.log('✓ Loaded existing token');
//     } catch (error) {
//       console.log('No existing token found, starting OAuth flow...');
//       await this.getNewToken();
//     }

//     this.drive = google.drive({ version: 'v3', auth: this.oAuth2Client });
//   }

//   // Get new token via OAuth flow
//   async getNewToken() {
//     const authUrl = this.oAuth2Client.generateAuthUrl({
//       access_type: 'offline',
//       scope: ['https://www.googleapis.com/auth/drive.file']
//     });

//     console.log('Authorize this app by visiting this url:', authUrl);
    
//     // Start local server to handle OAuth callback
//     const token = await this.startOAuthServer();
//     this.oAuth2Client.setCredentials(token);
    
//     // Save token for future use
//     await fs.writeFile(this.tokenPath, JSON.stringify(token));
//     console.log('✓ Token stored successfully');
//   }

//   // Start local server for OAuth callback
//   startOAuthServer() {
//     return new Promise((resolve, reject) => {
//       const app = express();
//       let server;

//       app.get('/oauth2callback', async (req, res) => {
//         const { code } = req.query;
        
//         if (!code) {
//           res.send('Error: No code received');
//           reject(new Error('No code received'));
//           return;
//         }

//         try {
//           const { tokens } = await this.oAuth2Client.getToken(code);
//           res.send('Authorization successful! You can close this window.');
//           server.close();
//           resolve(tokens);
//         } catch (error) {
//           res.send('Error during authorization');
//           reject(error);
//         }
//       });

//       server = app.listen(3000, () => {
//         console.log('✓ OAuth callback server listening on port 3000');
//         // open(this.oAuth2Client.generateAuthUrl({
//         //   access_type: 'offline',
//         //   scope: ['https://www.googleapis.com/auth/drive.file']
//         // }));
//       });
//     });
//   }

//   // Upload file to Google Drive
//   async uploadFile(filePath, mimeType = 'application/octet-stream') {
//     try {
//       const fileContent = await fs.readFile(filePath);
//       const fileName = path.basename(filePath);

//       const response = await this.drive.files.create({
//         requestBody: {
//           name: fileName,
//           mimeType: mimeType,
//         },
//         media: {
//           mimeType: mimeType,
//           body: fileContent,
//         },
//       });

//       console.log(`✓ File uploaded: ${fileName} (ID: ${response.data.id})`);
//       return response.data;
//     } catch (error) {
//       console.error('Error uploading file:', error.message);
//       throw error;
//     }
//   }

//   // Download file from Google Drive
//   async downloadFile(fileId, destinationPath) {
//     try {
//       const response = await this.drive.files.get(
//         { fileId, alt: 'media' },
//         { responseType: 'stream' }
//       );

//       const dest = await fs.open(destinationPath, 'w');
      
//       return new Promise((resolve, reject) => {
//         response.data
//           .on('end', async () => {
//             await dest.close();
//             console.log(`✓ File downloaded to: ${destinationPath}`);
//             resolve();
//           })
//           .on('error', (err) => {
//             reject(err);
//           })
//           .pipe(dest.createWriteStream());
//       });
//     } catch (error) {
//       console.error('Error downloading file:', error.message);
//       throw error;
//     }
//   }

//   // List files in Google Drive
//   async listFiles(pageSize = 10) {
//     try {
//       const response = await this.drive.files.list({
//         pageSize: pageSize,
//         fields: 'files(id, name, mimeType, size, createdTime)',
//       });

//       const files = response.data.files;
//       if (files.length === 0) {
//         console.log('No files found.');
//       } else {
//         console.log('\nFiles in Google Drive:');
//         console.log('-----------------------');
//         files.forEach(file => {
//           console.log(`${file.name} (${file.mimeType})`);
//           console.log(`  ID: ${file.id}`);
//           console.log(`  Created: ${file.createdTime}`);
//           if (file.size) console.log(`  Size: ${(file.size / 1024).toFixed(2)} KB`);
//           console.log('---');
//         });
//       }
//       return files;
//     } catch (error) {
//       console.error('Error listing files:', error.message);
//       throw error;
//     }
//   }

//   // Delete file from Google Drive
//   async deleteFile(fileId) {
//     try {
//       await this.drive.files.delete({ fileId });
//       console.log(`✓ File deleted (ID: ${fileId})`);
//     } catch (error) {
//       console.error('Error deleting file:', error.message);
//       throw error;
//     }
//   }
// }

// // Main program
// async function main() {
//   // Load credentials from client_secret.json
//   try {
//     const credentialsFile = await fs.readFile('./client_secret_.json', 'utf8');
//     const credentials = JSON.parse(credentialsFile);
    
//     // Extract client ID and secret (adjust based on your JSON structure)
//     const clientId = credentials.installed?.client_id || credentials.web?.client_id;
//     const clientSecret = credentials.installed?.client_secret || credentials.web?.client_secret;

//     if (!clientId || !clientSecret) {
//       throw new Error('Could not find client ID or secret in client_secret.json');
//     }

//     const gdrive = new GoogleDriveManager(clientId, clientSecret);
//     await gdrive.initialize();

//     // Simple command-line interface
//     const rl = readline.createInterface({
//       input: process.stdin,
//       output: process.stdout
//     });

//     const question = (query) => new Promise(resolve => rl.question(query, resolve));

//     while (true) {
//       console.log('\n=== Google Drive Manager ===');
//       console.log('1. List files');
//       console.log('2. Upload file');
//       console.log('3. Download file');
//       console.log('4. Delete file');
//       console.log('5. Exit');
      
//       const choice = await question('\nEnter your choice (1-5): ');

//       try {
//         switch (choice) {
//           case '1':
//             await gdrive.listFiles();
//             break;

//           case '2':
//             const uploadPath = await question('Enter file path to upload: ');
//             const mimeType = await question('Enter MIME type (press Enter for default): ');
//             await gdrive.uploadFile(uploadPath, mimeType || undefined);
//             break;

//           case '3':
//             const listFiles = await gdrive.listFiles(20);
//             if (listFiles.length > 0) {
//               const fileId = await question('Enter file ID to download: ');
//               const destPath = await question('Enter destination path: ');
//               await gdrive.downloadFile(fileId, destPath);
//             }
//             break;

//           case '4':
//             const deleteId = await question('Enter file ID to delete: ');
//             await gdrive.deleteFile(deleteId);
//             break;

//           case '5':
//             console.log('Goodbye!');
//             rl.close();
//             process.exit(0);

//           default:
//             console.log('Invalid choice');
//         }
//       } catch (error) {
//         console.error('Operation failed:', error.message);
//       }
//     }
//   } catch (error) {
//     console.error('Error loading credentials:', error.message);
//     process.exit(1);
//   }
// }

// // Run the program if called directly
// if (require.main === module) {
//   main();
// }

// module.exports = GoogleDriveManager;