# 🇯🇵 Live Japanese OCR App

A web application that performs live OCR (Optical Character Recognition) on Japanese text, displaying the original Japanese, romaji transliteration, and English translation.

## Features

- 📷 **Live Camera Capture** - Use your device camera to capture Japanese text
- 📁 **Image Upload** - Upload existing images containing Japanese text
- 🔤 **OCR Recognition** - Extracts Japanese characters using Tesseract.js
- 🎌 **Romaji Conversion** - Converts Japanese to romaji using Kuroshiro
- 🌐 **English Translation** - Translates to English using translation API
- 📱 **Responsive Design** - Works on desktop and mobile devices

## Technologies Used

- **Tesseract.js** - OCR engine for Japanese character recognition
- **Kuroshiro** - Japanese language utility for romaji conversion
- **MyMemory Translation API** - Free translation service
- **Vanilla JavaScript** - No framework dependencies
- **HTML5/CSS3** - Modern web standards

## How to Use

### Option 1: Open Locally

1. Simply open `index.html` in your web browser
2. No build process or server required!

### Option 2: Use a Local Server

For better camera access permissions, use a local server:

```bash
# Using Python
python -m http.server 8000

# Using Node.js (install http-server globally first)
npx http-server

# Using PHP
php -S localhost:8000
```

Then open `http://localhost:8000` in your browser.

## Usage Instructions

### Using Camera:
1. Click "Start Camera"
2. Point your camera at Japanese text
3. Click "Capture & Analyze"
4. Wait for processing
5. View results: Japanese → Romaji → English

### Using Image Upload:
1. Click "Upload Image"
2. Select an image with Japanese text
3. Wait for processing
4. View results

## Deployment Options

### Deploy to Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Deploy to Netlify
1. Drag and drop the folder to netlify.com/drop
2. Or connect your GitHub repo

### Deploy to GitHub Pages
1. Push code to GitHub
2. Go to Settings → Pages
3. Select branch and folder
4. Your site will be live!

## API Limitations

The free MyMemory Translation API has rate limits:
- 1000 words/day for anonymous usage
- For production, consider:
  - Google Cloud Translation API
  - DeepL API
  - AWS Translate

## Improving Accuracy

For better OCR results:
- Use high-contrast images
- Ensure text is clearly visible
- Avoid blurry or skewed images
- Use good lighting for camera capture

## Browser Compatibility

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support (may need HTTPS for camera)
- Mobile browsers: ✅ Supported

## Future Enhancements

- [ ] Support for vertical Japanese text
- [ ] Offline mode with Service Workers
- [ ] Text-to-speech for pronunciation
- [ ] Save/export results
- [ ] Batch processing
- [ ] OCR accuracy improvements

## License

MIT License - feel free to use and modify!

## Credits

- Tesseract.js for OCR capabilities
- Kuroshiro for romaji conversion
- MyMemory for translation services
