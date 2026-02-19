#!/bin/bash

export EXPO_TOKEN="YOUR_EXPO_TOKEN_HERE"

echo "Starting EAS build for SuperManus Android APK..."
echo "Project: admin44aa/supermanus"
echo ""

# Start the build without waiting
eas build --platform android --profile preview --non-interactive --no-wait

echo ""
echo "Build started successfully!"
echo "Check the build status at: https://expo.dev/accounts/admin44aa/projects/supermanus"
echo ""
echo "You can download the APK once the build completes."