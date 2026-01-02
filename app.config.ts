import { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "TidyNest",
  slug: "vibecode",
  scheme: "vibecode",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/logo.png",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.vibecode.homebox",
    buildNumber: "2",
    infoPlist: {
      NSCameraUsageDescription: "This app uses the camera to take photos of your storage boxes and items.",
      NSPhotoLibraryUsageDescription: "This app uses the photo library to allow you to upload photos of your storage boxes and items.",
      NSPhotoLibraryAddUsageDescription: "This app saves photos of your storage boxes to your library.",
      NSCalendarsUsageDescription: "This app does not use your calendar.",
      NSContactsUsageDescription: "This app does not use your contacts.",
      NSLocationWhenInUseUsageDescription: "This app does not use your location.",
    },
  },
  splash: {
    image: "./assets/logo.png",
    resizeMode: "contain",
    backgroundColor: "#09090b"
  },
  android: {
    edgeToEdgeEnabled: true,
    package: "com.vibecode.homebox",
  },
  plugins: [
    "expo-router",
    [
      "expo-camera",
      {
        cameraPermission: "Allow HomeBox to access your camera"
      }
    ],
    [
      "expo-image-picker",
      {
        photosPermission: "Allow HomeBox to access your photos"
      }
    ]
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    eas: {
      projectId: "caf9bc90-accb-4a4f-973c-0c291b7c68f8"
    }
  }
};

export default config;

