# SquirrelScan Audit API

Automated website auditing service using SquirrelScan, designed for n8n integration with optional Google Drive storage.

## 🚀 Features

- **SquirrelScan Integration**: Full website audits (SEO, Performance, Accessibility, Best Practices)
- **Batch Processing**: Audit up to 100 websites in one request
- **Google Drive Storage**: Automatic report uploads with shareable links
- **n8n Ready**: Built for workflow automation
- **Secure**: API key authentication
- **Docker**: Containerized for easy deployment

## 📋 Prerequisites

- Railway account (or any Docker hosting)
- Google Cloud Project (optional, for Drive uploads)
- n8n instance (for automation)

## 🛠️ Quick Start

### 1. Deploy to Railway

#### Option A: Deploy from GitHub

1. Create a new GitHub repository
2. Push this code to your repo
3. In Railway dashboard:
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Railway will auto-detect the Dockerfile and deploy

#### Option B: Deploy from CLI

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login to Railway
railway login

# Initialize in this directory
cd /Users/james/Work/Audits/squirrel-scan/squirrelscan-audit
railway init

# Deploy
railway up
```

### 2. Set Environment Variables

In Railway dashboard, go to your project → Variables:

**Required:**
```bash
API_KEY=<generate with: openssl rand -hex 32>
```

**Optional (for Google Drive uploads):**
```bash
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
GOOGLE_DRIVE_FOLDER_ID=your-folder-id-here
```

### 3. Get Your API URL

Railway will provide a URL like: `https://squirrelscan-audit-production.up.railway.app`

## 🔐 Google Drive Setup (Optional)

### Create Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create or select a project
3. Enable **Google Drive API**
4. Go to **IAM & Admin → Service Accounts → Create**
   - Name: `squirrelscan-uploader`
   - Skip roles (no project permissions needed)
5. Click on the service account → **Keys → Add Key → JSON**
6. Download the JSON file

### Share Drive Folder

1. Create a folder in Google Drive called "Website Audits"
2. Right-click → Share
3. Add the service account email (from JSON: `client_email`)
4. Give "Editor" permission
5. Copy the folder ID from URL: `drive.google.com/drive/folders/FOLDER_ID_HERE`

### Add to Railway

Copy the entire JSON file content and paste as one line in Railway:
```bash
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"your-project",...}
GOOGLE_DRIVE_FOLDER_ID=1a2b3c4d5e6f7g8h9i0j
```

## 🧪 Testing

### Generate API Key

```bash
# Mac/Linux
openssl rand -hex 32

# Output example:
# 4f8a3d2e1b9c7f6a5e4d3c2b1a0f9e8d7c6b5a4e3d2c1b0a9f8e7d6c5b4a3e2d1
```

### Test Endpoints

```bash
# 1. Health check (no auth required)
curl https://your-railway-url.up.railway.app/

# 2. Test installation (requires auth)
curl https://your-railway-url.up.railway.app/test \
  -H "x-api-key: your-api-key-here"

# 3. Single audit
curl -X POST https://your-railway-url.up.railway.app/audit \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key-here" \
  -d '{
    "url": "https://example.com",
    "format": "html",
    "uploadToDrive": true
  }'

# 4. Batch audit
curl -X POST https://your-railway-url.up.railway.app/audit/batch \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key-here" \
  -d '{
    "urls": [
      "https://example.com",
      "https://google.com"
    ],
    "format": "json",
    "uploadToDrive": true
  }'
```

## 📡 API Endpoints

### GET /
Health check - returns service status

### GET /test
Test SquirrelScan installation and Google Drive connection
- **Auth**: Required
- **Response**: Installation status

### POST /audit
Run a single audit
- **Auth**: Required
- **Body**:
  ```json
  {
    "url": "https://example.com",
    "format": "html|json|text",
    "uploadToDrive": true|false,
    "driveFolderId": "optional-folder-id"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "url": "https://example.com",
    "format": "html",
    "report": "...",
    "metrics": {...},
    "drive": {
      "viewLink": "https://drive.google.com/...",
      "downloadLink": "https://drive.google.com/...",
      "fileId": "..."
    },
    "timestamp": "2024-02-07T..."
  }
  ```

### POST /audit/batch
Run multiple audits
- **Auth**: Required
- **Body**:
  ```json
  {
    "urls": ["https://example.com", "https://google.com"],
    "format": "html|json|text",
    "uploadToDrive": true|false
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "summary": {
      "total": 2,
      "succeeded": 2,
      "failed": 0,
      "successRate": "100%"
    },
    "results": [...]
  }
  ```

## 🔄 n8n Integration

### Workflow Nodes

1. **Schedule Trigger** - Run daily at 2 AM
2. **Google Sheets** - Read pending audits
3. **HTTP Request** - Call `/audit/batch` endpoint
   ```
   Method: POST
   URL: https://your-railway-url.up.railway.app/audit/batch
   Headers:
     x-api-key: {{ $credentials.railwayApiKey }}
     Content-Type: application/json
   Body:
     {
       "urls": {{ $json.urls }},
       "format": "html",
       "uploadToDrive": true
     }
   ```
4. **Set** - Extract results
5. **Google Sheets** - Update with results

### Example n8n Credentials

Name: `Railway API Key`
Type: `Header Auth`
Header Name: `x-api-key`
Header Value: `your-api-key-here`

## 📊 Usage Limits

- **Single audit**: ~30-60 seconds per site
- **Batch audit**: Up to 100 URLs per request
- **Timeout**: 2 minutes per audit
- **Buffer**: 50MB per report

## 🐛 Troubleshooting

### SquirrelScan not found
Check logs in Railway dashboard. The installer should run during Docker build.

### Google Drive upload fails
1. Verify service account JSON is valid
2. Check folder is shared with service account email
3. Ensure folder ID is correct

### Timeout errors
Increase timeout for slow sites:
```javascript
timeout: 180000 // 3 minutes
```

### Memory issues
Railway automatically scales, but for very large batches consider:
- Reduce batch size to 50 URLs
- Add delay between audits (currently 2 seconds)

## 💰 Cost Estimate

**Railway:**
- Hobby plan: $5/month
- Pro plan: $20/month (recommended for production)

**Google Drive:**
- Free tier: 15GB
- Workspace: Unlimited storage

**Processing:**
- ~50-100 audits/day easily within free tier
- Scales automatically with usage

## 🔒 Security

- API key authentication for all endpoints
- Service account limited to one Drive folder
- Environment variables encrypted at rest
- No logging of sensitive credentials

## 📝 License

MIT

## 👤 Author

OneUp Digital Studio  
Built for cold outreach automation

## 🤝 Support

Issues? Check Railway logs:
```bash
railway logs
```

Or contact through GitHub issues.
