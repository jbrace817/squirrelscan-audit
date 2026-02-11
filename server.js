// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const { exec } = require('child_process');
const util = require('util');
const fs = require('fs').promises;
const path = require('path');
const { google } = require('googleapis');
const cors = require('cors');
const execPromise = util.promisify(exec);

const app = express();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(cors());

// Environment validation
const requiredEnvVars = ['API_KEY'];
const missingEnvVars = requiredEnvVars.filter(key => !process.env[key]);
if (missingEnvVars.length > 0) {
  console.error('ERROR: Missing required environment variables:', missingEnvVars.join(', '));
  console.error('Please set these in your Railway dashboard');
  process.exit(1);
}

// Authentication middleware
const authenticate = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'x-api-key header is required' 
    });
  }
  
  if (apiKey !== process.env.API_KEY) {
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'Invalid API key' 
    });
  }
  
  next();
};

// Google Drive setup with service account
const setupGoogleDrive = () => {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    console.log('Google Drive not configured - skipping Drive uploads');
    return null;
  }

  try {
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/drive.file']
    });
    return google.drive({ version: 'v3', auth });
  } catch (error) {
    console.error('Google Drive setup failed:', error.message);
    return null;
  }
};

// Upload file to Google Drive
async function uploadToDrive(filePath, fileName, folderId) {
  const drive = setupGoogleDrive();
  
  if (!drive) {
    throw new Error('Google Drive not configured');
  }

  const fileMetadata = {
    name: fileName,
    parents: folderId ? [folderId] : []
  };

  const media = {
    mimeType: 'application/json',
    body: require('fs').createReadStream(filePath)
  };

  try {
    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, webViewLink, webContentLink'
    });

    return {
      id: response.data.id,
      viewLink: response.data.webViewLink,
      downloadLink: response.data.webContentLink
    };
  } catch (error) {
    console.error('Drive upload error:', error.message);
    throw error;
  }
}

// Detect which SquirrelScan command is available
let SQUIRREL_COMMAND = null;
async function getSquirrelCommand() {
  if (SQUIRREL_COMMAND) return SQUIRREL_COMMAND;
  
  // Try 'squirrel' first (Mac local install)
  try {
    await execPromise('squirrel --version', { timeout: 3000 });
    SQUIRREL_COMMAND = 'squirrel';
    return 'squirrel';
  } catch (e) {
    // Try 'squirrelscan' (Docker/Railway install)
    try {
      await execPromise('squirrelscan --version', { timeout: 3000 });
      SQUIRREL_COMMAND = 'squirrelscan';
      return 'squirrelscan';
    } catch (e2) {
      throw new Error('SquirrelScan is not installed. Neither \'squirrel\' nor \'squirrelscan\' command found.');
    }
  }
}

// Extract key metrics from audit report
function extractMetrics(reportContent, format) {
  if (format !== 'json') {
    return null;
  }

  try {
    const data = JSON.parse(reportContent);
    return {
      scores: data.score || {},
      summary: {
        overall: data.score?.overall || 0,
        grade: data.score?.grade || 'N/A',
        passed: data.summary?.passed || 0,
        warnings: data.summary?.warnings || 0,
        failed: data.summary?.failed || 0
      },
      issueCount: {
        error: data.issues?.filter(i => i.severity === 'error').length || 0,
        warning: data.issues?.filter(i => i.severity === 'warning').length || 0,
        info: data.issues?.filter(i => i.severity === 'info').length || 0
      }
    };
  } catch (e) {
    return null;
  }
}

// Routes

// Health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'running',
    service: 'SquirrelScan Audit API',
    version: '1.0.0',
    endpoints: {
      health: 'GET /',
      test: 'GET /test',
      audit: 'POST /audit',
      batch: 'POST /audit/batch'
    },
    authentication: 'Required: x-api-key header',
    readme: 'See README.md for n8n integration examples'
  });
});

// Test endpoint - verify installation
app.get('/test', authenticate, async (req, res) => {
  const tests = {
    node: process.version,
    squirrelscan: false,
    command: null,
    googleDrive: false
  };

  // Test SquirrelScan - try both 'squirrel' and 'squirrelscan' commands
  try {
    const { stdout } = await execPromise('squirrel --version', { timeout: 5000 });
    tests.squirrelscan = stdout.trim();
    tests.command = 'squirrel';
  } catch (error) {
    // Try alternative command
    try {
      const { stdout } = await execPromise('squirrelscan --version', { timeout: 5000 });
      tests.squirrelscan = stdout.trim();
      tests.command = 'squirrelscan';
    } catch (error2) {
      tests.squirrelscan = `Error: Neither 'squirrel' nor 'squirrelscan' command found`;
      tests.command = 'none';
    }
  }

  // Test Google Drive
  try {
    const drive = setupGoogleDrive();
    tests.googleDrive = drive !== null ? 'Configured' : 'Not configured';
  } catch (error) {
    tests.googleDrive = `Error: ${error.message}`;
  }

  res.json({
    success: true,
    tests: tests,
    timestamp: new Date().toISOString()
  });
});

// Single audit endpoint
app.post('/audit', authenticate, async (req, res) => {
  const { 
    url, 
    format = 'json',
    uploadToDrive: shouldUpload = false,
    driveFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID
  } = req.body;

  if (!url) {
    return res.status(400).json({ 
      error: 'Bad Request',
      message: 'URL is required' 
    });
  }

  // Validate URL format
  try {
    new URL(url);
  } catch (e) {
    return res.status(400).json({ 
      error: 'Bad Request',
      message: 'Invalid URL format' 
    });
  }

  const timestamp = Date.now();
  const sanitizedUrl = url
    .replace(/https?:\/\//, '')
    .replace(/[^a-zA-Z0-9]/g, '_')
    .substring(0, 50);
  const outputFileName = `audit_${sanitizedUrl}_${timestamp}.${format}`;
  const outputPath = `/tmp/${outputFileName}`;

  console.log(`[${new Date().toISOString()}] Starting audit for: ${url}`);

  try {
    // Get the correct SquirrelScan command
    const cmd = await getSquirrelCommand();
    
    // Run SquirrelScan command
    const command = `${cmd} audit "${url}" --format ${format} --output ${outputPath}`;
    
    console.log(`Executing: ${command}`);
    
    const { stdout, stderr } = await execPromise(command, {
      maxBuffer: 50 * 1024 * 1024, // 50MB buffer
      timeout: 120000 // 2 minute timeout
    });

    if (stderr) {
      console.log('SquirrelScan stderr:', stderr);
    }

    console.log(`Audit completed for: ${url}`);

    // Read the report
    const reportContent = await fs.readFile(outputPath, 'utf-8');
    
    // Extract metrics if JSON format
    const metrics = extractMetrics(reportContent, format);
    
    let driveData = null;
    
    // Upload to Google Drive if requested
    if (shouldUpload) {
      try {
        if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
          console.log('Skipping Drive upload - not configured');
        } else {
          console.log('Uploading to Google Drive...');
          driveData = await uploadToDrive(outputPath, outputFileName, driveFolderId);
          console.log('Upload successful:', driveData.viewLink);
        }
      } catch (driveError) {
        console.error('Drive upload failed:', driveError.message);
        // Don't fail the whole request if drive upload fails
      }
    }

    // Clean up temp file
    await fs.unlink(outputPath).catch(() => {});

    // Parse JSON reports to return as objects, not strings
    let reportData = reportContent;
    if (format === 'json') {
      try {
        reportData = JSON.parse(reportContent);
      } catch (e) {
        console.warn('Failed to parse JSON report:', e.message);
        // Fall back to string if parsing fails
      }
    }

    res.json({
      success: true,
      url: url,
      format: format,
      report: reportData,
      metrics: metrics,
      drive: driveData ? {
        viewLink: driveData.viewLink,
        downloadLink: driveData.downloadLink,
        fileId: driveData.id
      } : null,
      fileName: outputFileName,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`Audit error for ${url}:`, error.message);
    
    // Clean up on error
    await fs.unlink(outputPath).catch(() => {});
    
    res.status(500).json({
      success: false,
      error: error.message,
      url: url,
      timestamp: new Date().toISOString()
    });
  }
});

// Batch audit endpoint
app.post('/audit/batch', authenticate, async (req, res) => {
  const { 
    urls, 
    format = 'json',
    uploadToDrive: shouldUpload = true,
    driveFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID 
  } = req.body;

  if (!Array.isArray(urls) || urls.length === 0) {
    return res.status(400).json({ 
      error: 'Bad Request',
      message: 'URLs array is required and must not be empty' 
    });
  }

  if (urls.length > 100) {
    return res.status(400).json({ 
      error: 'Bad Request',
      message: `Maximum 100 URLs per batch. Received: ${urls.length}` 
    });
  }

  console.log(`[${new Date().toISOString()}] Starting batch audit for ${urls.length} URLs`);

  const results = [];
  
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    const timestamp = Date.now();
    const sanitizedUrl = url
      .replace(/https?:\/\//, '')
      .replace(/[^a-zA-Z0-9]/g, '_')
      .substring(0, 50);
    const outputFileName = `audit_${sanitizedUrl}_${timestamp}.${format}`;
    const outputPath = `/tmp/${outputFileName}`;

    console.log(`[${i + 1}/${urls.length}] Auditing: ${url}`);

    try {
      // Validate URL
      new URL(url);

      // Get the correct SquirrelScan command
      const cmd = await getSquirrelCommand();
      const command = `${cmd} audit "${url}" --format ${format} --output ${outputPath}`;
      
      await execPromise(command, {
        maxBuffer: 50 * 1024 * 1024,
        timeout: 120000
      });

      const reportContent = await fs.readFile(outputPath, 'utf-8');
      const metrics = extractMetrics(reportContent, format);
      
      let driveData = null;
      
      if (shouldUpload && process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
        try {
          driveData = await uploadToDrive(outputPath, outputFileName, driveFolderId);
        } catch (driveError) {
          console.error(`Drive upload failed for ${url}:`, driveError.message);
        }
      }

      await fs.unlink(outputPath).catch(() => {});

      // Parse JSON reports to return as objects, not strings
      let reportData = reportContent;
      if (format === 'json') {
        try {
          reportData = JSON.parse(reportContent);
        } catch (e) {
          console.warn('Failed to parse JSON report:', e.message);
          // Fall back to string if parsing fails
        }
      }

      results.push({
        url: url,
        success: true,
        report: reportData,
        fileName: outputFileName,
        metrics: metrics,
        drive: driveData ? {
          viewLink: driveData.viewLink,
          downloadLink: driveData.downloadLink,
          fileId: driveData.id
        } : null
      });

      console.log(`✓ Completed: ${url}`);

    } catch (error) {
      console.error(`✗ Failed: ${url} - ${error.message}`);
      
      await fs.unlink(outputPath).catch(() => {});
      
      results.push({
        url: url,
        success: false,
        error: error.message
      });
    }

    // Small delay between audits to avoid overwhelming system
    if (i < urls.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  const successCount = results.filter(r => r.success).length;
  const failCount = results.length - successCount;

  console.log(`[${new Date().toISOString()}] Batch complete: ${successCount} succeeded, ${failCount} failed`);

  res.json({
    success: true,
    summary: {
      total: urls.length,
      succeeded: successCount,
      failed: failCount,
      successRate: `${Math.round((successCount / urls.length) * 100)}%`
    },
    results: results,
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    availableEndpoints: ['GET /', 'GET /test', 'POST /audit', 'POST /audit/batch']
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 SquirrelScan Audit API running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔐 Authentication: API key required (x-api-key header)`);
  console.log(`☁️  Google Drive: ${process.env.GOOGLE_SERVICE_ACCOUNT_KEY ? 'Configured' : 'Not configured'}`);
  console.log(`📁 Drive Folder ID: ${process.env.GOOGLE_DRIVE_FOLDER_ID || 'Not set'}`);
  console.log(`\nReady to process audits! 🎯`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});
