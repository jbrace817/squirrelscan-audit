# Quick Start Guide

Get your SquirrelScan Audit API running in 10 minutes!

## Step 1: Generate API Key (1 minute)

```bash
cd /Users/james/Work/Audits/squirrel-scan/squirrelscan-audit
bash generate-api-key.sh
```

Save the output - you'll need it!

## Step 2: Deploy to Railway (3 minutes)

### Option A: GitHub Deploy (Recommended)

```bash
# Initialize git repo
git init
git add .
git commit -m "Initial commit"

# Create repo on GitHub, then:
git remote add origin https://github.com/YOUR-USERNAME/squirrelscan-audit.git
git push -u origin main
```

Then:
1. Go to [railway.app](https://railway.app)
2. New Project → Deploy from GitHub
3. Select your repo
4. Wait for build (~3 minutes)

### Option B: Railway CLI

```bash
npm i -g @railway/cli
railway login
railway init
railway up
```

## Step 3: Set Environment Variables (1 minute)

In Railway dashboard → Variables:

**Required:**
```
API_KEY=<paste the key you generated>
```

**Optional (skip for now, add later):**
```
GOOGLE_SERVICE_ACCOUNT_KEY=...
GOOGLE_DRIVE_FOLDER_ID=...
```

Click "Redeploy" after adding variables.

## Step 4: Test Your API (2 minutes)

Get your Railway URL (looks like: `https://squirrelscan-audit-production.up.railway.app`)

```bash
# Test health
curl https://YOUR-RAILWAY-URL.up.railway.app/

# Test with auth
curl https://YOUR-RAILWAY-URL.up.railway.app/test \
  -H "x-api-key: YOUR-API-KEY"

# Test audit (this takes ~30 seconds)
curl -X POST https://YOUR-RAILWAY-URL.up.railway.app/audit \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR-API-KEY" \
  -d '{"url": "https://example.com", "format": "json"}'
```

## Step 5: Set Up n8n (3 minutes)

### 5.1 Create Credential in n8n

1. Go to n8n → Credentials
2. Create new credential → "Header Auth"
3. Name: `Railway API Key`
4. Header Name: `x-api-key`
5. Header Value: `YOUR-API-KEY`
6. Save

### 5.2 Import Workflow

1. Download `n8n-workflow-example.json` from this repo
2. In n8n: Import from File
3. Update the HTTP Request node URL to your Railway URL
4. Connect your Google Sheets credential
5. Activate workflow

## Step 6: Create Google Sheet (2 minutes)

Create a sheet with these columns:

| Company Name | Website URL | Status | SEO Score | Performance Score | Overall Score | Report Link | Last Audit |
|--------------|-------------|--------|-----------|-------------------|---------------|-------------|------------|
| Test Co | https://example.com | Pending | | | | | |

Sheet names:
- "Audit Queue" - for pending audits
- "Qualified Leads" - for good prospects (auto-populated)

## You're Done! 🎉

### Test the Full Flow

1. Add a row with `Status = "Pending"` to your Google Sheet
2. Manually trigger the n8n workflow (or wait for scheduled run)
3. Watch the magic happen!

### Expected Results

- Status changes to "Completed"
- Scores populate
- Report link appears (if Drive configured)
- If score < 75, row copies to "Qualified Leads"

## Next Steps

- Add more prospects to your sheet
- Schedule workflow to run nightly
- Set up Google Drive (see README.md)
- Start cold outreach with the data!

## Troubleshooting

**API not responding:**
- Check Railway logs
- Verify environment variables are set
- Wait 2-3 minutes after deploy

**n8n workflow fails:**
- Check API key is correct
- Verify Railway URL is correct
- Look at n8n execution logs

**No results in sheet:**
- Check if URLs are valid
- Verify Google Sheets credential is connected
- Test API endpoint manually first

## Need Help?

Check these files:
- `README.md` - Full documentation
- `DEPLOYMENT.md` - Detailed deployment guide
- Railway logs - View in dashboard

## Cost Summary

- Railway: $0-5/month (free tier available)
- Google Drive: Free (15GB)
- n8n: Free (self-hosted) or $20/month (cloud)

**Total: $0-25/month** to audit unlimited prospects!

---

Built by OneUp Digital Studio for contractor cold outreach automation 🚀
