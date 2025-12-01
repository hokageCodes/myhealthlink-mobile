# 📱 Mobile App Deployment Guide for Portfolio

This guide covers multiple deployment options for showcasing your MyHealth Link mobile app in your portfolio.

## 🚀 Quick Start - Choose Your Option

### Option 1: EAS Build + Appetize.io (Recommended for Portfolio) ⭐
**Best for:** Professional web-based demos that work on any device
**Time:** ~15-20 minutes setup + build time

### Option 2: Expo Go (Fastest) ⚡
**Best for:** Quick demos, testing, development
**Time:** ~2 minutes

### Option 3: EAS Build + Direct Download
**Best for:** Sharing APK/IPA files directly
**Time:** ~15-20 minutes setup + build time

---

## 📋 Prerequisites

1. **Expo Account** (free): Sign up at [expo.dev](https://expo.dev)
2. **EAS CLI** (install globally):
   ```bash
   npm install -g eas-cli
   ```
3. **Login to Expo**:
   ```bash
   eas login
   ```

---

## 🎯 Option 1: EAS Build + Appetize.io (Recommended)

### Step 1: Build Your App

Navigate to the mobile app directory:
```bash
cd myhealth-mobile
```

Build for Android (APK):
```bash
npm run build:android
# OR
eas build --platform android --profile preview
```

Build for iOS (if you have an Apple Developer account):
```bash
npm run build:ios
# OR
eas build --platform ios --profile preview
```

**Note:** The first build will take 10-20 minutes. Subsequent builds are faster.

### Step 2: Download Your Build

1. After the build completes, you'll get a URL in the terminal
2. Visit the URL or go to [expo.dev](https://expo.dev) → Your Project → Builds
3. Download the APK (Android) or IPA (iOS) file

### Step 3: Upload to Appetize.io

1. **Sign up** at [appetize.io](https://appetize.io) (free tier available)
2. **Upload your APK/IPA**:
   - Go to "Apps" → "Upload"
   - Drag and drop your APK/IPA file
   - Wait for processing (2-5 minutes)
3. **Get your demo link**:
   - Once processed, you'll get a shareable URL
   - Example: `https://appetize.io/app/your-app-id`
   - This link works on any device with a browser!

### Step 4: Embed in Portfolio

You can:
- **Direct link**: Share the Appetize.io URL
- **Embed iframe** (if Appetize supports it):
  ```html
  <iframe src="https://appetize.io/embed/your-app-id" width="375" height="667"></iframe>
  ```
- **Screenshot + Link**: Add a screenshot with "Try Demo" button linking to Appetize

### Appetize.io Pricing:
- **Free tier**: 100 minutes/month (perfect for portfolio demos!)
- **Paid plans**: Start at $40/month for more minutes

---

## ⚡ Option 2: Expo Go (Fastest Demo)

### Step 1: Start Development Server

```bash
cd myhealth-mobile
npm start
```

### Step 2: Share QR Code

1. A QR code will appear in your terminal
2. **For iOS**: Open Camera app → Scan QR code → Opens in Expo Go
3. **For Android**: Open Expo Go app → Scan QR code

### Step 3: Share with Others

**Option A: Expo Go Link**
- The terminal will show a URL like: `exp://192.168.x.x:8081`
- Share this URL (works on same network)

**Option B: Expo Go + Tunnel** (works anywhere)
```bash
npm start -- --tunnel
```
- This creates a public URL that works anywhere
- Share the QR code or URL

### Limitations:
- Requires Expo Go app installed
- Some native modules might not work
- Best for quick demos, not production showcases

---

## 📦 Option 3: EAS Build + Direct Download

### Step 1: Build (same as Option 1)

```bash
npm run build:android
```

### Step 2: Host APK/IPA

**Option A: GitHub Releases** (Free)
1. Create a GitHub release
2. Upload APK/IPA as release asset
3. Share download link

**Option B: Google Drive / Dropbox**
1. Upload APK/IPA to cloud storage
2. Get shareable link
3. Share with portfolio viewers

**Option C: Your Portfolio Website**
1. Host APK/IPA on your website
2. Add download button
3. Users can download and install

### Step 3: Add to Portfolio

Create a section like:
```markdown
## 📱 Mobile App Demo

[Download Android APK](./downloads/myhealth-mobile.apk)

*Note: Enable "Install from Unknown Sources" on Android*
```

---

## 🎨 Portfolio Integration Examples

### Example 1: Appetize.io Embed

```html
<div class="demo-section">
  <h2>Try the App</h2>
  <p>Experience the mobile app directly in your browser:</p>
  <a href="https://appetize.io/app/your-app-id" target="_blank">
    <button>Launch Demo</button>
  </a>
</div>
```

### Example 2: Screenshot + Link

```markdown
## MyHealth Link Mobile App

![App Screenshot](./screenshots/app-home.png)

[Try Live Demo on Appetize.io](https://appetize.io/app/your-app-id) | 
[Download APK](./downloads/app.apk)
```

### Example 3: Video Demo

1. Record screen while using Appetize.io demo
2. Upload to YouTube (unlisted)
3. Embed in portfolio

---

## 🔧 Troubleshooting

### Build Fails
- **Error: "No EAS project found"**
  ```bash
  eas init
  ```
- **Error: "Build timeout"**
  - Free tier has limits, wait and retry
  - Or upgrade to paid plan

### Appetize.io Issues
- **App doesn't load**: Check APK/IPA file size (should be < 100MB)
- **App crashes**: Check console logs in Appetize.io dashboard
- **Slow loading**: Normal for first load, subsequent loads are faster

### Expo Go Issues
- **Can't connect**: Make sure you're on the same network
- **Use tunnel mode**: `npm start -- --tunnel`

---

## 📊 Comparison Table

| Option | Setup Time | Cost | Best For | Limitations |
|--------|-----------|------|----------|-------------|
| **Appetize.io** | 20 min | Free/Paid | Portfolio demos | Requires build |
| **Expo Go** | 2 min | Free | Quick demos | Requires app install |
| **Direct Download** | 20 min | Free | Full control | Requires manual install |

---

## 🎯 Recommended Workflow for Portfolio

1. **Build once** using EAS Build (Option 1)
2. **Upload to Appetize.io** for web-based demo
3. **Also provide**:
   - Screenshots/GIFs
   - Video walkthrough
   - Direct APK download link
   - GitHub repository link

This gives viewers multiple ways to experience your app!

---

## 📝 Next Steps

1. Run `eas login` to authenticate
2. Run `npm run build:android` to create your first build
3. Upload the APK to Appetize.io
4. Add the demo link to your portfolio!

---

## 💡 Pro Tips

- **Update builds regularly**: Keep your demo current
- **Add instructions**: Tell viewers what to try in the app
- **Showcase key features**: Highlight your best work
- **Mobile-responsive portfolio**: Make sure your portfolio looks good on mobile too!

---

## 🆘 Need Help?

- [EAS Build Docs](https://docs.expo.dev/build/introduction/)
- [Appetize.io Docs](https://docs.appetize.io/)
- [Expo Go Docs](https://docs.expo.dev/get-started/installation/)

Good luck with your portfolio! 🚀

