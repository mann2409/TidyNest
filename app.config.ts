import { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "TidyNest",
  slug: "vibecode",
  scheme: "vibecode",
  version: "1.0.1",
  orientation: "portrait",
  icon: "./assets/logo.png",
  userInterfaceStyle: "automatic",
  newArchEnabled: false,
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.vibecode.homebox",
    buildNumber: "6",
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      NSCameraUsageDescription:
        "TidyNest uses the camera to take photos of your storage boxes and items so we can identify what’s inside and save it to your inventory (example: take a photo of a box and we’ll add items like “winter gloves” and “scarves”).",
      NSPhotoLibraryUsageDescription: "TidyNest needs access to your photo library to let you upload existing photos of your storage boxes and items for organization.",
      NSPhotoLibraryAddUsageDescription: "TidyNest saves photos of your storage boxes to your library for your records.",
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
    adaptiveIcon: {
      foregroundImage: "./assets/logo.png",
      backgroundColor: "#09090b"
    }
  },
  plugins: [
    "expo-router",
    [
      "expo-camera",
      {
        cameraPermission:
          "TidyNest uses the camera to take photos of your storage boxes and items so we can identify what’s inside and save it to your inventory (example: take a photo of a box and we’ll add items like “winter gloves” and “scarves”)."
      }
    ],
    [
      "expo-image-picker",
      {
        photosPermission: "Allow TidyNest to access your photos to import storage item images."
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

