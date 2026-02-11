# Port Configuration Guide

## Understanding Ports in This Project

### Railway (Production) 🚂
**You don't set the port!** Railway handles this automatically.

```bash
# Railway Environment Variables
API_KEY=your-secret-key
# PORT is NOT set - Railway does this automatically!
```

**How it works:**
1. Railway assigns a random port (e.g., 8080, 5000, 3000)
2. Sets `process.env.PORT` automatically
3. Maps it to your public HTTPS URL
4. You never see or care about the actual port number

**Your public URL:**
```
https://squirrelscan-audit-production.up.railway.app
```
(No port number needed!)

---

### Local Development 💻

You have **full control** over the port locally.

#### Method 1: Use .env file (Recommended)

```bash
# Create .env file
cp .env.example .env

# Edit .env
API_KEY=test-key-123
PORT=8080  # ← Your custom port

# Start server
npm start

# Access at:
http://localhost:8080
```

#### Method 2: Command Line

```bash
# Use any port on the fly
PORT=8080 npm start
PORT=5000 npm start
PORT=3333 npm start

# Access at:
http://localhost:[your-port]
```

#### Method 3: Use Pre-configured Scripts

```bash
# Run on port 8080
npm run dev:8080

# Run on port 5000
npm run dev:5000

# Default (port 3000)
npm start
```

---

## Why Different Ports Locally?

### Common Reasons:

**Port 3000 already in use:**
```
Error: listen EADDRINUSE: address already in use :::3000
```
**Solution:** Use different port like 8080 or 5000

**Multiple projects running:**
- Project A: Port 3000
- Project B (this): Port 8080
- Project C: Port 5000

**Match other services:**
- Your n8n runs on 5678
- This API on 8080
- Database on 5432

**Personal preference:**
- Some devs prefer 8080 (common HTTP alternative)
- Some prefer 5000 (Python Flask default)
- Some prefer 3000 (Node/React default)

---

## Port Testing Examples

### Test on Port 3000 (Default)
```bash
# .env
PORT=3000

# Start
npm start

# Test
curl http://localhost:3000/
curl http://localhost:3000/test -H "x-api-key: test-key"
```

### Test on Port 8080
```bash
# .env
PORT=8080

# Start
npm start

# Test
curl http://localhost:8080/
curl http://localhost:8080/test -H "x-api-key: test-key"
```

### Test on Custom Port
```bash
# No .env needed
PORT=9999 npm start

# Test
curl http://localhost:9999/
```

---

## Update test-local.js for Custom Port

If you change the port, update the test file:

```javascript
// test-local.js
const PORT = process.env.PORT || 3000;  // ← Reads from environment
const BASE_URL = `http://localhost:${PORT}`;
```

Or run tests with port specified:
```bash
PORT=8080 node test-local.js
```

---

## Railway Deployment - Port Checklist

When deploying to Railway:

- [ ] ✅ **DON'T** set PORT in Railway dashboard
- [ ] ✅ **DO** set API_KEY in Railway dashboard
- [ ] ✅ **DON'T** hardcode port in server.js
- [ ] ✅ **DO** use `process.env.PORT || 3000` (already done)

**The code is already correct:**
```javascript
// server.js - Line 458
const PORT = process.env.PORT || 3000;
//            ↑ Railway sets this  ↑ Local fallback
```

---

## Common Port Conflicts

### If you get "port already in use":

**Option 1: Use different port**
```bash
PORT=8080 npm start
```

**Option 2: Kill the process using that port**
```bash
# Mac/Linux - Find what's using port 3000
lsof -ti:3000

# Kill it
kill -9 $(lsof -ti:3000)

# Or kill specific port
npx kill-port 3000
```

**Option 3: Find and stop conflicting service**
```bash
# Check what's running
lsof -i :3000

# You might see:
# node    12345  james  23u  IPv6  ...  TCP *:3000
```

---

## Quick Reference

| Environment | Port Setting | How Set |
|-------------|--------------|---------|
| **Railway** | Automatic | Railway sets `PORT` env var |
| **Local (default)** | 3000 | Fallback in code |
| **Local (custom)** | Your choice | `.env` or `PORT=8080 npm start` |
| **Docker local** | 3000 | Map with `-p 8080:3000` |

---

## Examples for Different Scenarios

### Scenario 1: Testing Locally on 8080
```bash
# .env
API_KEY=test-key-123
PORT=8080

# Start
npm start

# Test
curl http://localhost:8080/test -H "x-api-key: test-key-123"
```

### Scenario 2: Running Multiple Projects
```bash
# Project 1 (n8n)
# Running on port 5678

# Project 2 (this API)
PORT=8080 npm start

# Project 3 (another service)
# Running on port 3000
```

### Scenario 3: Deploy to Railway
```bash
# Railway Variables (in dashboard)
API_KEY=actual-secure-key-here
# PORT - NOT SET (Railway handles it)

# Your code automatically works!
```

---

## Testing Different Ports

```bash
# Terminal 1
PORT=3000 npm start

# Terminal 2
curl http://localhost:3000/

# ---

# Terminal 1 (kill previous, start new)
PORT=8080 npm start

# Terminal 2
curl http://localhost:8080/
```

---

## Summary

### For Railway (Production):
✅ **Don't touch PORT** - Railway handles it automatically  
✅ Just set API_KEY  
✅ Access via: `https://your-app.up.railway.app`

### For Local Testing:
✅ **Set PORT in .env** if you want custom port  
✅ Or use: `PORT=8080 npm start`  
✅ Default is 3000 if not specified  
✅ Access via: `http://localhost:[port]`

---

## Need Help?

**Port conflict?**
```bash
# Use different port
PORT=8080 npm start
```

**Want to change default?**
```bash
# Edit .env
PORT=your-preferred-port
```

**Railway deployment?**
```bash
# Don't set PORT in Railway!
# Just set API_KEY
```

That's it! 🎉
