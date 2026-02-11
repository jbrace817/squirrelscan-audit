# Railway Deployment Checklist

## Pre-Deployment

- [ ] Review all files in this directory
- [ ] Generate API key: `bash generate-api-key.sh`
- [ ] (Optional) Set up Google Service Account for Drive uploads
- [ ] Create GitHub repository for this code

## Deployment Steps

### 1. Push to GitHub

```bash
cd /Users/james/Work/Audits/squirrel-scan/squirrelscan-audit

# Initialize git (if not already)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: SquirrelScan Audit API"

# Add remote (create repo on GitHub first)
git remote add origin https://github.com/yourusername/squirrelscan-audit.git

# Push
git push -u origin main
```

### 2. Deploy to Railway

1. Go to [railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository
5. Railway will auto-detect the Dockerfile and start building

### 3. Configure Environment Variables

In Railway dashboard → Your Project → Variables tab:

**Required:**
```
API_KEY=<paste your generated key here>
```

**Optional (for Google Drive):**
```
GOOGLE_SERVICE_ACCOUNT_KEY=<paste service account JSON here>
GOOGLE_DRIVE_FOLDER_ID=<your folder ID>
```

### 4. Get Your API URL

Railway will generate a URL like:
```
https://squirrelscan-audit-production.up.railway.app
```

Save this URL - you'll need it for n8n!

### 5. Test Your Deployment

```bash
# Test health endpoint
curl https://your-railway-url.up.railway.app/

# Test with auth
curl https://your-railway-url.up.railway.app/test \
  -H "x-api-key: your-api-key"

# Test audit
curl -X POST https://your-railway-url.up.railway.app/audit \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{"url": "https://example.com", "format": "json"}'
```

## Post-Deployment

- [ ] Test all endpoints
- [ ] Verify Google Drive uploads (if configured)
- [ ] Save API URL and API key securely
- [ ] Set up n8n integration
- [ ] Monitor Railway logs for first few runs

## Troubleshooting

**Build fails:**
- Check Railway build logs
- Verify Dockerfile syntax
- Ensure all dependencies are in package.json

**SquirrelScan not found:**
- Check that curl command ran in Dockerfile
- View deployment logs for install errors

**API key errors:**
- Double-check API_KEY is set in Railway
- Ensure no extra spaces or quotes in the key
- Verify header name is exactly: x-api-key

**Google Drive fails:**
- Validate JSON is properly formatted (single line)
- Check service account has access to folder
- Verify folder ID is correct

## Next Steps

Once deployed and tested:

1. **Set up n8n workflow** (see README.md)
2. **Create Google Sheet** with prospect URLs
3. **Schedule daily audit runs**
4. **Monitor results** in Google Drive

---

Need help? Check Railway logs:
```bash
railway logs --project your-project-name
```

Or view in Railway dashboard → Deployments → View Logs
