# Loxra Landing Page

Deploy this directory to Render as a static site.

## Files
- `index.html` - Landing page
- `styles.css` - Stylesheet
- `downloads/` - Installer files
  - `ISO20022-Translator-Setup-2.0.0.exe` (81.21 MB) - Windows installer
  - `latest.yml` - Auto-update manifest

## Deploy to Render

### Option 1: Render Dashboard (Recommended)
1. Go to https://dashboard.render.com
2. Click **New** → **Static Site**
3. Connect your GitHub repository (Somli/Loxra)
4. Configure:
   - **Name:** loxra-landing
   - **Root Directory:** `landing`
   - **Publish Directory:** `.` (current directory)
5. Click **Create Static Site**

Your site will be available at: `https://loxra-landing.onrender.com`

### Option 2: Using Render CLI
```bash
npm install -g render-cli
cd landing
render deploy
```

### Option 3: Manual Deploy with Git
1. Create a new branch for the landing page:
```bash
git checkout -b landing-deploy
git add landing/
git commit -m "Add landing page with installers"
git push origin landing-deploy
```

2. In Render dashboard, create static site and point to the `landing/` directory

## Auto-Updates
The `latest.yml` file enables automatic updates for the Electron app. When users have the app installed, it will check for new versions at:
```
https://your-render-site.onrender.com/downloads/latest.yml
```

## File Size Note
The Windows installer (81.21 MB) will be served directly from Render's CDN. For faster downloads, consider using Render's global CDN or adding Cloudflare in front.

## Update Process
When you release a new version:
1. Build new installer: `npm run build` (use temp directory outside OneDrive)
2. Copy to landing: `cp release/*.exe landing/downloads/`
3. Update `latest.yml`
4. Git commit and push
5. Render auto-deploys (or manually trigger)
