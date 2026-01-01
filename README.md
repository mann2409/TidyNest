# Home Storage App

A mobile app for managing home storage boxes. Track containers, items, and find anything quickly with search.

## Features

- **Box Management**: Create, edit, and track storage boxes with unique codes (e.g., G-TOOLS-01)
- **AI Photo Analysis**: Take a photo of box contents and get automatic category and item suggestions
- **Smart Item Detection**: AI can detect items in photos and let you add them with one tap
- **Item Tracking**: Add and edit items in boxes with tags for easy searching
- **Smart Search**: Search across all items, boxes, and tags
- **QR Code Generation**: Generate QR codes for printing labels
- **Multiple Locations**: Organize boxes by location (Garage, Attic, etc.)
- **Custom Categories**: Create your own categories with custom codes and keywords for AI detection
- **Export Data**: Download all your saved data as a JSON file for backup

## How It Works

1. **Add a Box**: Select a location, take a photo, and the AI suggests a category and code
2. **Add Items**: Add items to each box with names and tags, or use AI detection to auto-add items from photos
3. **Edit**: Tap any box or item to edit its details
4. **Search**: Use the search bar to find any item and see which box it's in
5. **Print Labels**: Generate QR codes for each box to print and attach

## App Structure

- **Search Tab**: Main screen with search and recent boxes
- **All Boxes Tab**: View all boxes grouped by location
- **Settings Tab**: Manage locations, categories, and view stats

## Tech Stack

- Expo SDK 53
- React Native 0.76.7
- Zustand for state management
- OpenAI Vision API for photo analysis
- AsyncStorage for data persistence
