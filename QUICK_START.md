# 🚀 Quick Start - Deploy to Appetize.io

## Step-by-Step (5 minutes)

### 1. Install EAS CLI (one-time)
```bash
npm install -g eas-cli
```

### 2. Login to Expo
```bash
cd myhealth-mobile
eas login
```
*(Create free account at expo.dev if needed)*

### 3. Initialize EAS (one-time)
```bash
eas init
```
*(Follow prompts, select your Expo account)*

### 4. Build Android APK
```bash
npm run build:android
```
⏱️ *Takes 10-20 minutes first time*

### 5. Download APK
- Visit the build URL shown in terminal
- OR go to [expo.dev](https://expo.dev) → Your Project → Builds
- Download the APK file

### 6. Upload to Appetize.io
1. Sign up at [appetize.io](https://appetize.io) (free)
2. Click "Upload" → Drag & drop your APK
3. Wait 2-5 minutes for processing
4. Copy your demo URL! 🎉

### 7. Add to Portfolio
- Link: `https://appetize.io/app/your-app-id`
- Works on any device with a browser!

---

## Alternative: Quick Expo Go Demo (2 minutes)

```bash
cd myhealth-mobile
npm start -- --tunnel
```

Share the QR code or URL that appears!

---

## Need Help?
See `DEPLOYMENT_GUIDE.md` for detailed instructions and troubleshooting.

