# Pre-Deployment Checklist

Use this checklist before deploying to ensure everything is ready.

## ✅ Files Review

- [x] Dockerfile - Contains SquirrelScan installation
- [x] server.js - Main API application
- [x] package.json - Node dependencies
- [x] railway.toml - Railway configuration
- [x] .gitignore - Excludes sensitive files
- [x] .env.example - Environment variable template
- [x] README.md - Full documentation
- [x] DEPLOYMENT.md - Step-by-step deploy guide
- [x] QUICKSTART.md - 10-minute setup guide
- [x] n8n-workflow-example.json - Ready-to-import workflow
- [x] test.js - Testing script
- [x] generate-api-key.sh - Key generation script

## ✅ Pre-Deploy Tasks

- [ ] Review all files above
- [ ] Generate API key: `bash generate-api-key.sh`
- [ ] Save API key securely (password manager)
- [ ] Create GitHub repository
- [ ] (Optional) Set up Google Cloud service account
- [ ] (Optional) Create Google Drive folder for reports

## ✅ Deployment Tasks

- [ ] Push code to GitHub
- [ ] Create Railway project
- [ ] Deploy from GitHub to Railway
- [ ] Wait for build to complete (~3-5 minutes)
- [ ] Set `API_KEY` environment variable in Railway
- [ ] (Optional) Set `GOOGLE_SERVICE_ACCOUNT_KEY` in Railway
- [ ] (Optional) Set `GOOGLE_DRIVE_FOLDER_ID` in Railway
- [ ] Redeploy after adding environment variables
- [ ] Copy Railway URL

## ✅ Testing Tasks

- [ ] Test health endpoint: `curl https://your-url.up.railway.app/`
- [ ] Test auth: `curl https://your-url.up.railway.app/test -H "x-api-key: YOUR_KEY"`
- [ ] Test single audit (optional): See QUICKSTART.md
- [ ] Check Railway logs for any errors

## ✅ n8n Integration Tasks

- [ ] Create n8n credential (Header Auth)
- [ ] Import workflow from `n8n-workflow-example.json`
- [ ] Update HTTP Request node with your Railway URL
- [ ] Connect Google Sheets credential
- [ ] Create Google Sheet with required columns
- [ ] Test workflow manually
- [ ] Activate workflow for scheduled runs

## ✅ Google Drive Setup (Optional)

- [ ] Create Google Cloud project
- [ ] Enable Google Drive API
- [ ] Create service account
- [ ] Download JSON key
- [ ] Create "Website Audits" folder in Drive
- [ ] Share folder with service account email
- [ ] Copy folder ID from URL
- [ ] Add credentials to Railway
- [ ] Test Drive upload

## ✅ Post-Deployment

- [ ] Add 5-10 test URLs to Google Sheet
- [ ] Run manual workflow test
- [ ] Verify results appear in sheet
- [ ] Verify Drive uploads (if configured)
- [ ] Check for qualified leads in second sheet
- [ ] Monitor Railway logs during first few runs
- [ ] Set up alerts/notifications (optional)

## ✅ Production Ready

- [ ] Document Railway URL internally
- [ ] Document API key location
- [ ] Add prospects to audit queue
- [ ] Schedule daily runs (2 AM recommended)
- [ ] Set up cold outreach workflow
- [ ] Monitor costs in Railway dashboard

## Estimated Time

- **Minimum setup** (no Drive): 10 minutes
- **Full setup** (with Drive): 20 minutes
- **First audit test**: 5 minutes
- **Total to production**: 35 minutes

## Common Issues

**Build fails:**
- Check Railway build logs
- Verify all files are committed to GitHub
- Ensure Dockerfile syntax is correct

**API doesn't respond:**
- Wait 2-3 minutes after deploy
- Check environment variables are set
- View Railway logs for errors

**SquirrelScan not found:**
- Check Dockerfile installation logs
- Verify curl command ran successfully
- May need to redeploy

**Google Drive errors:**
- Validate JSON format (single line, no line breaks)
- Check service account has folder access
- Verify folder ID is correct

## Support Resources

- Railway Docs: https://docs.railway.app
- SquirrelScan Docs: https://docs.squirrelscan.com
- n8n Docs: https://docs.n8n.io
- Google Drive API: https://developers.google.com/drive

---

Ready to deploy? Start with QUICKSTART.md! 🚀
