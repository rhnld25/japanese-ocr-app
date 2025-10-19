// Initialize Kuroshiro for romaji conversion
let kuroshiro;
let stream = null;

// Initialize Kuroshiro
async function initKuroshiro() {
    try {
        kuroshiro = new Kuroshiro.default();
        await kuroshiro.init(new KuromojiAnalyzer.default());
        console.log('Kuroshiro initialized successfully');
    } catch (error) {
        console.error('Error initializing Kuroshiro:', error);
    }
}

// Initialize on page load
initKuroshiro();

// DOM Elements
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const startCameraBtn = document.getElementById('startCamera');
const captureBtn = document.getElementById('capture');
const stopCameraBtn = document.getElementById('stopCamera');
const imageInput = document.getElementById('imageInput');
const preview = document.getElementById('preview');
const previewImage = document.getElementById('previewImage');
const loading = document.getElementById('loading');
const results = document.getElementById('results');
const japaneseText = document.getElementById('japaneseText');
const romajiText = document.getElementById('romajiText');
const englishText = document.getElementById('englishText');
const errorDiv = document.getElementById('error');

// Drawing Canvas Elements
const drawCanvas = document.getElementById('drawCanvas');
const drawCtx = drawCanvas.getContext('2d');
const clearCanvasBtn = document.getElementById('clearCanvas');
const analyzeDrawingBtn = document.getElementById('analyzeDrawing');

// Drawing state
let isDrawing = false;
let lastX = 0;
let lastY = 0;

// Initialize drawing canvas
function initDrawingCanvas() {
    // Set canvas background to white
    drawCtx.fillStyle = 'white';
    drawCtx.fillRect(0, 0, drawCanvas.width, drawCanvas.height);
    
    // Set drawing style
    drawCtx.strokeStyle = '#000';
    drawCtx.lineWidth = 3;
    drawCtx.lineCap = 'round';
    drawCtx.lineJoin = 'round';
}

// Drawing event listeners
drawCanvas.addEventListener('mousedown', startDrawing);
drawCanvas.addEventListener('mousemove', draw);
drawCanvas.addEventListener('mouseup', stopDrawing);
drawCanvas.addEventListener('mouseout', stopDrawing);

// Touch support for mobile
drawCanvas.addEventListener('touchstart', handleTouchStart);
drawCanvas.addEventListener('touchmove', handleTouchMove);
drawCanvas.addEventListener('touchend', stopDrawing);

function startDrawing(e) {
    isDrawing = true;
    const rect = drawCanvas.getBoundingClientRect();
    lastX = e.clientX - rect.left;
    lastY = e.clientY - rect.top;
}

function draw(e) {
    if (!isDrawing) return;
    
    const rect = drawCanvas.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;
    
    drawCtx.beginPath();
    drawCtx.moveTo(lastX, lastY);
    drawCtx.lineTo(currentX, currentY);
    drawCtx.stroke();
    
    lastX = currentX;
    lastY = currentY;
}

function stopDrawing() {
    isDrawing = false;
}

function handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = drawCanvas.getBoundingClientRect();
    isDrawing = true;
    lastX = touch.clientX - rect.left;
    lastY = touch.clientY - rect.top;
}

function handleTouchMove(e) {
    e.preventDefault();
    if (!isDrawing) return;
    
    const touch = e.touches[0];
    const rect = drawCanvas.getBoundingClientRect();
    const currentX = touch.clientX - rect.left;
    const currentY = touch.clientY - rect.top;
    
    drawCtx.beginPath();
    drawCtx.moveTo(lastX, lastY);
    drawCtx.lineTo(currentX, currentY);
    drawCtx.stroke();
    
    lastX = currentX;
    lastY = currentY;
}

// Clear canvas
clearCanvasBtn.addEventListener('click', () => {
    initDrawingCanvas();
    hideError();
    results.style.display = 'none';
    preview.style.display = 'none';
});

// Analyze drawing
analyzeDrawingBtn.addEventListener('click', () => {
    drawCanvas.toBlob(blob => {
        processImage(blob);
    });
});

// Initialize drawing canvas on page load
initDrawingCanvas();

// Start Camera
startCameraBtn.addEventListener('click', async () => {
    try {
        stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' } 
        });
        video.srcObject = stream;
        video.style.display = 'block';
        startCameraBtn.disabled = true;
        captureBtn.disabled = false;
        stopCameraBtn.disabled = false;
        hideError();
    } catch (error) {
        showError('Error accessing camera: ' + error.message);
    }
});

// Capture Image from Camera
captureBtn.addEventListener('click', () => {
    const context = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);
    
    canvas.toBlob(blob => {
        processImage(blob);
    });
});

// Stop Camera
stopCameraBtn.addEventListener('click', () => {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        video.srcObject = null;
        video.style.display = 'none';
        startCameraBtn.disabled = false;
        captureBtn.disabled = true;
        stopCameraBtn.disabled = true;
    }
});

// File Upload
imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        processImage(file);
    }
});

// Process Image
async function processImage(imageFile) {
    hideError();
    results.style.display = 'none';
    
    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
        previewImage.src = e.target.result;
        preview.style.display = 'block';
    };
    reader.readAsDataURL(imageFile);
    
    // Show loading
    loading.style.display = 'block';
    
    try {
        // Perform OCR
        const ocrResult = await performOCR(imageFile);
        
        if (!ocrResult || !ocrResult.trim()) {
            throw new Error('No text detected in the image. Please try another image with clearer Japanese text.');
        }
        
        // Convert to Romaji
        const romaji = await convertToRomaji(ocrResult);
        
        // Translate to English
        const english = await translateToEnglish(ocrResult);
        
        // Display results
        displayResults(ocrResult, romaji, english);
        
    } catch (error) {
        showError('Error processing image: ' + error.message);
    } finally {
        loading.style.display = 'none';
    }
}

// Perform OCR using Tesseract.js
async function performOCR(image) {
    try {
        const { data: { text } } = await Tesseract.recognize(
            image,
            'jpn', // Japanese language
            {
                logger: m => console.log(m)
            }
        );
        return text.trim();
    } catch (error) {
        throw new Error('OCR failed: ' + error.message);
    }
}

// Convert Japanese to Romaji using Kuroshiro
async function convertToRomaji(text) {
    try {
        if (!kuroshiro) {
            await initKuroshiro();
        }
        const result = await kuroshiro.convert(text, {
            to: 'romaji',
            mode: 'spaced'
        });
        return result;
    } catch (error) {
        console.error('Romaji conversion error:', error);
        return 'Error converting to romaji';
    }
}

// Translate to English using LibreTranslate API (free, no API key needed)
async function translateToEnglish(text) {
    try {
        // Using MyMemory Translation API (free, no key required)
        const response = await fetch(
            `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=ja|en`
        );
        
        if (!response.ok) {
            throw new Error('Translation API request failed');
        }
        
        const data = await response.json();
        
        if (data.responseData && data.responseData.translatedText) {
            return data.responseData.translatedText;
        } else {
            throw new Error('Translation not available');
        }
    } catch (error) {
        console.error('Translation error:', error);
        // Fallback message
        return 'Translation temporarily unavailable. Consider using Google Translate API or DeepL API for better results.';
    }
}

// Display Results
function displayResults(japanese, romaji, english) {
    japaneseText.textContent = japanese;
    romajiText.textContent = romaji;
    englishText.textContent = english;
    results.style.display = 'block';
}

// Show Error
function showError(message) {
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}

// Hide Error
function hideError() {
    errorDiv.style.display = 'none';
}
