# Railway Deployment Guide

Deploy your Zoho Inventory MCP server to Railway for ChatGPT integration.

## Prerequisites

- Railway account (free tier available)
- GitHub repository with your code
- Zoho API credentials

## Deployment Steps

### 1. Push to GitHub

Make sure your code is pushed to GitHub:

```bash
git add .
git commit -m "Add Railway deployment configuration"
git push origin main
```

### 2. Deploy to Railway

#### Option A: Railway CLI
```bash
# Login to Railway
railway login

# Initialize project
railway init

# Deploy
railway up
```

#### Option B: Railway Dashboard
1. Go to [railway.app](https://railway.app)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your repository
5. Railway will auto-detect Node.js and deploy

### 3. Configure Environment Variables

In Railway dashboard, go to your project → Variables tab and add:

```bash
# Required Zoho API credentials
ZOHO_CLIENT_ID=your_client_id
ZOHO_CLIENT_SECRET=your_client_secret
ZOHO_REFRESH_TOKEN=your_refresh_token
ZOHO_ORGANIZATION_ID=your_org_id

# Optional settings
ZOHO_DC_BASE=https://accounts.zoho.com
ZOHO_API_BASE=https://www.zohoapis.com
ZOHO_MIN_GAP_MS=300
MCP_AUTH_TOKEN=your-super-secure-random-token

# Railway will set these automatically
NODE_ENV=production
PORT=${{PORT}}
```

### 4. Get Your Railway URL

After deployment, Railway will provide:
- **Production URL**: `https://your-app-name.up.railway.app`
- **Custom Domain**: You can add a custom domain in settings

### 5. Configure ChatGPT

1. Go to **ChatGPT → Settings → Connectors**
2. Click **Custom Connectors (MCP) → Add**
3. Enter:
   - **Server URL**: `https://your-app-name.up.railway.app`
   - **Authorization**: `Bearer your-super-secure-random-token`
4. Click **Save**

### 6. Test the Deployment

```bash
# Test health endpoint
curl https://your-app-name.up.railway.app/health

# Test tools endpoint (with auth)
curl -H "Authorization: Bearer your-super-secure-random-token" \
     https://your-app-name.up.railway.app/mcp/list_tools
```

## Railway Configuration Files

### `railway.toml`
```toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "npm run start:http"
healthcheckPath = "/health"
healthcheckTimeout = 100
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
```

### `Procfile`
```
web: npm run start:http
```

## Monitoring & Logs

- **Logs**: Available in Railway dashboard → Deployments → Logs
- **Metrics**: CPU, Memory, Network usage
- **Health Checks**: Automatic health monitoring
- **Restart Policy**: Auto-restart on failures

## Security Best Practices

1. **Generate Secure Token**:
   ```bash
   # Generate a secure random token
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **Environment Variables**: Never commit secrets to Git

3. **HTTPS**: Railway provides HTTPS by default

4. **Rate Limiting**: Built into the server

## Troubleshooting

### Deployment Issues
- Check Railway logs for error messages
- Ensure all environment variables are set
- Verify Node.js version compatibility (>=18)

### Connection Issues
- Confirm Railway URL is accessible
- Check authorization token matches
- Verify HTTPS is working

### Zoho API Issues
- Check Zoho credentials are correct
- Ensure refresh token has proper scopes
- Monitor rate limiting in logs

## Cost

- **Free Tier**: $5 credit monthly (usually enough for development)
- **Pro Plan**: $5/month for production use
- **Usage**: Based on compute time and bandwidth

## Custom Domain (Optional)

1. Go to Railway dashboard → Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Update ChatGPT connector with new URL

## Updates & Maintenance

To update your deployment:
```bash
git add .
git commit -m "Update server"
git push origin main
```

Railway will automatically redeploy with the latest changes.
