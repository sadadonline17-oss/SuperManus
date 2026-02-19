# Build Instructions for SuperManus APK

## 📋 Prerequisites

1. **Node.js** (v18+)
2. **Expo CLI** - Install globally:
   ```bash
   npm install -g expo-cli eas-cli
   ```
3. **Expo Account** - Create account at https://expo.dev
4. **Git** - For version control (optional)

## 🔑 Step 1: Configure Expo Account

### Option A: Interactive Login (Recommended)
```bash
cd supermanus-app
eas login
```
Follow the prompts to log in with your Expo account.

### Option B: Programmatic Access (For CI/CD)
1. Generate an Expo access token: https://expo.dev/accounts/[username]/settings/access-tokens
2. Set environment variable:
   ```bash
   export EXPO_TOKEN=your_expo_token_here
   ```

## ⚙️ Step 2: Configure Environment Variables

Create a `.env` file in the project root:

```bash
# AI Provider Keys (add your own)
OPENAI_API_KEY=sk-your-openai-key
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key
GOOGLE_API_KEY=AIza-your-google-key
DEEPSEEK_API_KEY=sk-your-deepseek-key

# Optional: Add more providers as needed
OPENROUTER_API_KEY=sk-or-your-key
GROQ_API_KEY=gsk-your-key
# ... etc
```

## 🏗️ Step 3: Install Dependencies

```bash
cd supermanus-app
npm install --legacy-peer-deps
```

## 🔍 Step 4: Validate Project

```bash
npx expo-doctor
```

Fix any issues reported by expo-doctor.

## 📱 Step 5: Run Development Build (Optional)

### On Android Device
```bash
npm run android
```

### On iOS Device (macOS only)
```bash
npm run ios
```

### In Web Browser
```bash
npm run web
```

## 🚀 Step 6: Build Android APK

### Build Preview APK (Internal Testing)
```bash
eas build --platform android --profile preview
```

This will:
- Create an APK file
- Upload to Expo servers
- Provide download link when complete

### Build Production APK (Release)
```bash
eas build --platform android --profile production
```

This will:
- Create a production-ready APK
- Optimize the build
- Prepare for distribution

## 📥 Step 7: Download APK

After the build completes:
1. Copy the download URL from the build output
2. Open the URL in your browser
3. Download the APK file

## 📲 Step 8: Install on Android Device

### Option A: Direct Installation
1. Enable "Install from Unknown Sources" on your Android device
2. Transfer APK to device
3. Open APK and install

### Option B: ADB (For Developers)
```bash
adb install path/to/your-app.apk
```

### Option C: Expo Go (Development Only)
```bash
npm start
```
- Scan QR code with Expo Go app
- Test the app

## 🔧 Troubleshooting

### Issue: "An Expo user account is required"
**Solution**: Run `eas login` and authenticate with your Expo account

### Issue: Build fails with "Missing dependencies"
**Solution**: Run `npm install --legacy-peer-deps`

### Issue: "EXPO_TOKEN not set"
**Solution**: 
- Option A: Run `eas login` interactively
- Option B: Generate token and set `export EXPO_TOKEN=your_token`

### Issue: "Unable to resolve module"
**Solution**: 
```bash
rm -rf node_modules
npm install --legacy-peer-deps
```

### Issue: Build timeout
**Solution**: Build can take 15-30 minutes. Be patient!

## 📊 Build Profiles

### Development
- **Purpose**: Testing with hot reload
- **Type**: Development client
- **Command**: `eas build --platform android --profile development`

### Preview (Default)
- **Purpose**: Internal testing
- **Type**: APK
- **Command**: `eas build --platform android --profile preview`

### Production
- **Purpose**: Release to users
- **Type**: Optimized APK
- **Command**: `eas build --platform android --profile production`

## 🎯 Quick Start (Copy & Paste)

```bash
# Clone and navigate
cd supermanus-app

# Install dependencies
npm install --legacy-peer-deps

# Login to Expo
eas login

# Build APK
eas build --platform android --profile preview

# Wait for build... then download from provided URL
```

## 📱 Alternative: Build Locally (Advanced)

If you want to build locally without EAS:

```bash
# Install Android SDK and set up environment
export ANDROID_HOME=/path/to/android/sdk

# Build locally
npx expo run:android
```

This requires:
- Android Studio
- Android SDK
- Proper environment setup

## 🎉 Success!

Once you have the APK:
- Install it on your Android device
- Configure your API keys in the app settings
- Start using SuperManus!

## 📞 Support

If you encounter issues:
1. Check Expo documentation: https://docs.expo.dev
2. Check EAS build documentation: https://docs.expo.dev/build/introduction
3. Review build logs for specific errors

---

**Happy Building! 🚀**