import { google } from 'googleapis';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import { Readable } from 'stream';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class GoogleDriveManager {
  constructor(clientId, clientSecret, redirectUri = 'http://localhost:5000/api/gdrive/oauth2callback') {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.redirectUri = redirectUri;
    this.oAuth2Client = null;
    this.drive = null;
    this.tokenPath = path.join(__dirname, '../../token.json');
  }

  // Initialize OAuth2 client
  async initialize() {
    this.oAuth2Client = new google.auth.OAuth2(
      this.clientId,
      this.clientSecret,
      this.redirectUri
    );

    //Auto save refreshed tokens whenever Google renews them
    this.oAuth2Client.on('tokens', async(tokens)=>{
      try {
        const existing = JSON.parse(await fs.readFile(this.tokenPath, 'utf8').catch(() => '{}'));
        const updated = {...existing, ...tokens};
        await fs.writeFile(this.tokenPath, JSON.stringify(updated));
        console.log('✓ Token refreshed and saved');
      } catch (error) {
        console.error('Error saving refreshed token:', error.message);
      }
    })

    // Try to load existing token
    try {
      const token = await fs.readFile(this.tokenPath, 'utf8');
      this.oAuth2Client.setCredentials(JSON.parse(token));
      console.log('✓ Loaded existing token');
    } catch (error) {
      console.log('⚠ No existing token found. OAuth flow required.');
    }

    this.drive = google.drive({ version: 'v3', auth: this.oAuth2Client });
  }

  // Generate authorization URL
  getAuthUrl() {
    return this.oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/drive.file'],
      prompt: 'consent'
    });
  }

  // Exchange code for token
  async getTokenFromCode(code) {
    try {
      const { tokens } = await this.oAuth2Client.getToken(code);
      this.oAuth2Client.setCredentials(tokens);
      
      // Save token for future use
      await fs.writeFile(this.tokenPath, JSON.stringify(tokens));
      console.log('✓ Token stored successfully');
      
      return tokens;
    } catch (error) {
      console.error('Error getting token:', error.message);
      throw error;
    }
  }

  // Check if authenticated
  isAuthenticated() {
    return this.oAuth2Client && this.oAuth2Client.credentials && this.oAuth2Client.credentials.access_token;
  }

  // Helper function to convert Buffer to Readable stream
  bufferToStream(buffer) {
    const readable = new Readable();
    readable._read = () => {}; // _read is required but you can noop it
    readable.push(buffer);
    readable.push(null);
    return readable;
  }

  // Upload file to Google Drive
  async uploadFile(fileBuffer, fileName, mimeType = 'application/octet-stream') {
    try {
      if (!this.isAuthenticated()) {
        throw new Error('Not authenticated. Please complete OAuth flow first.');
      }

      // Convert Buffer to stream
      const bufferStream = this.bufferToStream(fileBuffer);

      const response = await this.drive.files.create({
        requestBody: {
          name: fileName,
          mimeType: mimeType,
        },
        media: {
          mimeType: mimeType,
          body: bufferStream,
        },
      });

      console.log(`✓ File uploaded: ${fileName} (ID: ${response.data.id})`);
      return response.data;
    } catch (error) {
      console.error('Error uploading file:', error.message);
      throw error;
    }
  }

  // Upload file from path
  async uploadFileFromPath(filePath, mimeType = 'application/octet-stream') {
    try {
      if (!this.isAuthenticated()) {
        throw new Error('Not authenticated. Please complete OAuth flow first.');
      }

      const fileContent = await fs.readFile(filePath);
      const fileName = path.basename(filePath);

      return await this.uploadFile(fileContent, fileName, mimeType);
    } catch (error) {
      console.error('Error uploading file:', error.message);
      throw error;
    }
  }

  // Download file from Google Drive
  async downloadFile(fileId, destinationPath) {
    try {
      if (!this.isAuthenticated()) {
        throw new Error('Not authenticated. Please complete OAuth flow first.');
      }

      const response = await this.drive.files.get(
        { fileId, alt: 'media' },
        { responseType: 'stream' }
      );

      const dest = await fs.open(destinationPath, 'w');
      
      return new Promise((resolve, reject) => {
        response.data
          .on('end', async () => {
            await dest.close();
            console.log(`✓ File downloaded to: ${destinationPath}`);
            resolve();
          })
          .on('error', (err) => {
            reject(err);
          })
          .pipe(dest.createWriteStream());
      });
    } catch (error) {
      console.error('Error downloading file:', error.message);
      throw error;
    }
  }

  // Get file metadata
  async getFileMetadata(fileId) {
    try {
      if (!this.isAuthenticated()) {
        throw new Error('Not authenticated. Please complete OAuth flow first.');
      }

      const response = await this.drive.files.get({
        fileId,
        fields: 'id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink'
      });

      return response.data;
    } catch (error) {
      console.error('Error getting file metadata:', error.message);
      throw error;
    }
  }

  // List files in Google Drive
  async listFiles(pageSize = 10, pageToken = null) {
    try {
      if (!this.isAuthenticated()) {
        throw new Error('Not authenticated. Please complete OAuth flow first.');
      }

      const params = {
        pageSize: pageSize,
        fields: 'nextPageToken, files(id, name, mimeType, size, createdTime, modifiedTime)',
      };

      if (pageToken) {
        params.pageToken = pageToken;
      }

      const response = await this.drive.files.list(params);

      return {
        files: response.data.files || [],
        nextPageToken: response.data.nextPageToken
      };
    } catch (error) {
      console.error('Error listing files:', error.message);
      throw error;
    }
  }

  // Delete file from Google Drive
  async deleteFile(fileId) {
    try {
      if (!this.isAuthenticated()) {
        throw new Error('Not authenticated. Please complete OAuth flow first.');
      }

      await this.drive.files.delete({ fileId });
      console.log(`✓ File deleted (ID: ${fileId})`);
      return { success: true, message: 'File deleted successfully' };
    } catch (error) {
      console.error('Error deleting file:', error.message);
      throw error;
    }
  }

  // Create folder in Google Drive
  async createFolder(folderName) {
    try {
      if (!this.isAuthenticated()) {
        throw new Error('Not authenticated. Please complete OAuth flow first.');
      }

      const response = await this.drive.files.create({
        requestBody: {
          name: folderName,
          mimeType: 'application/vnd.google-apps.folder',
        },
        fields: 'id, name',
      });

      console.log(`✓ Folder created: ${folderName} (ID: ${response.data.id})`);
      return response.data;
    } catch (error) {
      console.error('Error creating folder:', error.message);
      throw error;
    }
  }

  // Upload file to specific folder
  async uploadFileToFolder(fileBuffer, fileName, folderId, mimeType = 'application/octet-stream') {
    try {
      if (!this.isAuthenticated()) {
        throw new Error('Not authenticated. Please complete OAuth flow first.');
      }

      // Convert Buffer to stream
      const bufferStream = this.bufferToStream(fileBuffer);

      const response = await this.drive.files.create({
        requestBody: {
          name: fileName,
          mimeType: mimeType,
          parents: [folderId],
        },
        media: {
          mimeType: mimeType,
          body: bufferStream,
        },
      });

      console.log(`✓ File uploaded to folder: ${fileName} (ID: ${response.data.id})`);
      return response.data;
    } catch (error) {
      console.error('Error uploading file to folder:', error.message);
      throw error;
    }
  }
}

export default GoogleDriveManager;
