# ChatAB New Tab Extension

A browser extension that replaces your new tab page with a customizable chat interface supporting multiple AI models.

## Features

- Clean, minimal interface
- Support for multiple AI models (ChatGPT, DeepSeek)
- Modern design with Tailwind CSS

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

## Building the Extension

To build the extension:

```bash
npm run build:extension
```

This will create a `dist` folder with the packaged extension.

## Installing the Extension

### Chrome / Edge / Brave:

1. Open your browser and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked" and select the `dist` folder

### Firefox:

1. Navigate to `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on..."
3. Select any file in the `dist` folder

## Project Structure

- `src/` - Source code
  - `components/` - UI components
  - `screens/` - Main pages
- `public/` - Static assets
- `manifest.json` - Extension configuration
