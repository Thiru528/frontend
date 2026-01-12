---
description: Create an Android APK file for direct installation
---

# Build Android APK

Follow these steps to generate an APK file that you can install directly on your Android device (no Play Store needed).

1.  **Stop the development server** (if running) by pressing `Ctrl+C`.

2.  **Run the build command**:
    ```bash
    eas build -p android --profile preview
    ```

3.  **Log in to Expo** (if prompted):
    - Enter your Expo username and password.
    - If asked to "Generate a new Android KeyStore", choose **Yes** (Y).

4.  **Wait for the build**:
    - This happens in the cloud and may take 10-15 minutes.
    - You will see a link to track the progress.

5.  **Download and Install**:
    - When finished, a QR code and download link will appear.
    - Scan the QR code or open the link on your phone to download the `.apk` file.
    - Install it (you may need to allow "Install from unknown sources").
