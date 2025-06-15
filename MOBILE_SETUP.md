
# VisaMate Mobile App Setup

## Prerequisites
- Node.js installed
- Android Studio (for Android development)
- Xcode (for iOS development - Mac only)

## Steps to Build Mobile App

### 1. Export and Clone Project
1. Click "Export to Github" in Lovable
2. Clone your repository locally
3. Run `npm install`

### 2. Add Mobile Platforms
```bash
# Add iOS platform (Mac only)
npx cap add ios

# Add Android platform
npx cap add android
```

### 3. Build and Sync
```bash
# Build the web app
npm run build

# Sync with native platforms
npx cap sync
```

### 4. Run on Device/Emulator
```bash
# Run on Android
npx cap run android

# Run on iOS (Mac only)
npx cap run ios
```

### 5. App Store Deployment
- **Android**: Build APK/AAB using Android Studio, upload to Google Play Console
- **iOS**: Build IPA using Xcode, upload to App Store Connect

## App Configuration
- **App ID**: app.lovable.4fe7e39408f7478494c857df2d2f4a95
- **App Name**: VisaMate
- **Developer**: M. Abubakar Nofal
- **Contact**: visamateservice@gmail.com

## Hot Reload Development
The app is configured to use hot reload from the Lovable sandbox during development. This allows you to see changes instantly without rebuilding.

## Next Steps
1. Test the app thoroughly on different devices
2. Add app icons (create icon files in public/ directory)
3. Configure app permissions as needed
4. Submit to app stores following platform guidelines
