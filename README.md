# Home Storage App

A mobile app for managing home storage boxes. Track containers, items, and find anything quickly with search.

## Features

- **Box Management**: Create and track storage boxes with unique codes (e.g., G-TOOLS-01)
- **AI Photo Analysis**: Take a photo of box contents and get automatic category suggestions
- **Item Tracking**: Add items to boxes with tags for easy searching
- **Smart Search**: Search across all items, boxes, and tags
- **QR Code Generation**: Generate QR codes for printing labels
- **Multiple Locations**: Organize boxes by location (Garage, Attic, etc.)

## How It Works

1. **Add a Box**: Select a location, take a photo, and the AI suggests a category and code
2. **Add Items**: Add items to each box with names and tags
3. **Search**: Use the search bar to find any item and see which box it's in
4. **Print Labels**: Generate QR codes for each box to print and attach

## App Structure

- **Search Tab**: Main screen with search and recent boxes
- **All Boxes Tab**: View all boxes grouped by location
- **Settings Tab**: Manage locations and view stats

## Tech Stack

- Expo SDK 53
- React Native 0.76.7
- Zustand for state management
- OpenAI Vision API for photo analysis
- AsyncStorage for data persistence
