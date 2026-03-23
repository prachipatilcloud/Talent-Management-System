import { getGoogleDriveInstance } from '../config/googleDrive.js';

// Get authorization URL
export const getAuthUrl = (req, res) => {
  try {
    const gdrive = getGoogleDriveInstance();
    const authUrl = gdrive.getAuthUrl();
    
    res.status(200).json({
      success: true,
      authUrl,
      message: 'Visit this URL to authorize the application'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// OAuth2 callback handler
export const handleOAuthCallback = async (req, res) => {
  try {
    const { code } = req.query;
    
    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Authorization code not found'
      });
    }

    const gdrive = getGoogleDriveInstance();
    await gdrive.getTokenFromCode(code);
    
    // Redirect to frontend success page or send success response
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Authorization Successful</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            .container {
              background: white;
              padding: 40px;
              border-radius: 10px;
              box-shadow: 0 10px 40px rgba(0,0,0,0.1);
              text-align: center;
            }
            h1 {
              color: #4CAF50;
              margin-bottom: 20px;
            }
            p {
              color: #666;
              margin-bottom: 30px;
            }
            .success-icon {
              font-size: 64px;
              color: #4CAF50;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="success-icon">✓</div>
            <h1>Authorization Successful!</h1>
            <p>You have successfully authorized the application to access Google Drive.</p>
            <p>You can now close this window and return to the application.</p>
          </div>
          <script>
            setTimeout(() => {
              window.close();
            }, 3000);
          </script>
        </body>
      </html>
    `);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Check authentication status
export const checkAuthStatus = (req, res) => {
  try {
    const gdrive = getGoogleDriveInstance();
    const isAuthenticated = gdrive.isAuthenticated();
    
    res.status(200).json({
      success: true,
      isAuthenticated
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Upload file
export const uploadFile = async (req, res) => {
  try {
    const gdrive = getGoogleDriveInstance();
    
    if (!gdrive.isAuthenticated()) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated. Please complete OAuth flow first.'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file provided'
      });
    }

    const { folderId } = req.body;
    
    let result;
    if (folderId) {
      result = await gdrive.uploadFileToFolder(
        req.file.buffer,
        req.file.originalname,
        folderId,
        req.file.mimetype
      );
    } else {
      result = await gdrive.uploadFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );
    }

    res.status(200).json({
      success: true,
      data: result,
      message: 'File uploaded successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// List files
export const listFiles = async (req, res) => {
  try {
    const gdrive = getGoogleDriveInstance();
    
    if (!gdrive.isAuthenticated()) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated. Please complete OAuth flow first.'
      });
    }

    const { pageSize = 10, pageToken } = req.query;
    const result = await gdrive.listFiles(parseInt(pageSize), pageToken);

    res.status(200).json({
      success: true,
      data: result,
      message: 'Files retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get file metadata
export const getFileMetadata = async (req, res) => {
  try {
    const gdrive = getGoogleDriveInstance();
    
    if (!gdrive.isAuthenticated()) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated. Please complete OAuth flow first.'
      });
    }

    const { fileId } = req.params;
    
    if (!fileId) {
      return res.status(400).json({
        success: false,
        message: 'File ID is required'
      });
    }

    const metadata = await gdrive.getFileMetadata(fileId);

    res.status(200).json({
      success: true,
      data: metadata,
      message: 'File metadata retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete file
export const deleteFile = async (req, res) => {
  try {
    const gdrive = getGoogleDriveInstance();
    
    if (!gdrive.isAuthenticated()) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated. Please complete OAuth flow first.'
      });
    }

    const { fileId } = req.params;
    
    if (!fileId) {
      return res.status(400).json({
        success: false,
        message: 'File ID is required'
      });
    }

    await gdrive.deleteFile(fileId);

    res.status(200).json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Create folder
export const createFolder = async (req, res) => {
  try {
    const gdrive = getGoogleDriveInstance();
    
    if (!gdrive.isAuthenticated()) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated. Please complete OAuth flow first.'
      });
    }

    const { folderName } = req.body;
    
    if (!folderName) {
      return res.status(400).json({
        success: false,
        message: 'Folder name is required'
      });
    }

    const result = await gdrive.createFolder(folderName);

    res.status(200).json({
      success: true,
      data: result,
      message: 'Folder created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Download file
export const downloadFile = async (req, res) => {
  try {
    const gdrive = getGoogleDriveInstance();
    
    if (!gdrive.isAuthenticated()) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated. Please complete OAuth flow first.'
      });
    }

    const { fileId } = req.params;
    
    if (!fileId) {
      return res.status(400).json({
        success: false,
        message: 'File ID is required'
      });
    }

    // Get file metadata first to get the filename
    const metadata = await gdrive.getFileMetadata(fileId);
    
    // Get file content as stream
    const response = await gdrive.drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'stream' }
    );

    // Set headers for file download
    res.setHeader('Content-Type', metadata.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${metadata.name}"`);
    
    // Pipe the stream to response
    response.data.pipe(res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
