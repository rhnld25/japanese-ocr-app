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
const results = document.getElementById('results');
const japaneseText = document.getElementById('japaneseText');
const romajiText = document.getElementById('romajiText');

// Drawing Canvas Elements
const drawCanvas = document.getElementById('drawCanvas');
const drawCtx = drawCanvas.getContext('2d');
const clearCanvasBtn = document.getElementById('clearCanvas');
const undoBtn = document.getElementById('undoBtn');

// Drawing state
let isDrawing = false;
let lastX = 0;
let lastY = 0;
let drawingHistory = [];
let currentStrokes = [];
let analysisTimeout = null;

// Set canvas size to match container
function resizeCanvas() {
    const rect = drawCanvas.getBoundingClientRect();
    drawCanvas.width = rect.width;
    drawCanvas.height = rect.height;
    initDrawingCanvas();
    redrawCanvas();
}

// Initialize drawing canvas
function initDrawingCanvas() {
    // Set canvas background
    drawCtx.fillStyle = '#505050';
    drawCtx.fillRect(0, 0, drawCanvas.width, drawCanvas.height);
    
    // Set drawing style
    drawCtx.strokeStyle = 'white';
    drawCtx.lineWidth = 4;
    drawCtx.lineCap = 'round';
    drawCtx.lineJoin = 'round';
}

// Redraw all strokes
function redrawCanvas() {
    initDrawingCanvas();
    drawingHistory.forEach(stroke => {
        drawCtx.beginPath();
        drawCtx.moveTo(stroke[0].x, stroke[0].y);
        stroke.forEach(point => {
            drawCtx.lineTo(point.x, point.y);
        });
        drawCtx.stroke();
    });
}

// Initialize canvas size
window.addEventListener('load', resizeCanvas);
window.addEventListener('resize', resizeCanvas);

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
    const scaleX = drawCanvas.width / rect.width;
    const scaleY = drawCanvas.height / rect.height;
    lastX = (e.clientX - rect.left) * scaleX;
    lastY = (e.clientY - rect.top) * scaleY;
    currentStrokes = [{x: lastX, y: lastY}];
}

function draw(e) {
    if (!isDrawing) return;
    
    const rect = drawCanvas.getBoundingClientRect();
    const scaleX = drawCanvas.width / rect.width;
    const scaleY = drawCanvas.height / rect.height;
    const currentX = (e.clientX - rect.left) * scaleX;
    const currentY = (e.clientY - rect.top) * scaleY;
    
    drawCtx.beginPath();
    drawCtx.moveTo(lastX, lastY);
    drawCtx.lineTo(currentX, currentY);
    drawCtx.stroke();
    
    currentStrokes.push({x: currentX, y: currentY});
    lastX = currentX;
    lastY = currentY;
}

function stopDrawing() {
    if (isDrawing && currentStrokes.length > 0) {
        drawingHistory.push([...currentStrokes]);
        currentStrokes = [];
        
        // Live update - analyze immediately after drawing
        if (analysisTimeout) clearTimeout(analysisTimeout);
        analysisTimeout = setTimeout(() => {
            analyzeCurrentDrawing();
        }, 300);
    }
    isDrawing = false;
}

function handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = drawCanvas.getBoundingClientRect();
    const scaleX = drawCanvas.width / rect.width;
    const scaleY = drawCanvas.height / rect.height;
    isDrawing = true;
    lastX = (touch.clientX - rect.left) * scaleX;
    lastY = (touch.clientY - rect.top) * scaleY;
    currentStrokes = [{x: lastX, y: lastY}];
}

function handleTouchMove(e) {
    e.preventDefault();
    if (!isDrawing) return;
    
    const touch = e.touches[0];
    const rect = drawCanvas.getBoundingClientRect();
    const scaleX = drawCanvas.width / rect.width;
    const scaleY = drawCanvas.height / rect.height;
    const currentX = (touch.clientX - rect.left) * scaleX;
    const currentY = (touch.clientY - rect.top) * scaleY;
    
    drawCtx.beginPath();
    drawCtx.moveTo(lastX, lastY);
    drawCtx.lineTo(currentX, currentY);
    drawCtx.stroke();
    
    currentStrokes.push({x: currentX, y: currentY});
    lastX = currentX;
    lastY = currentY;
}

// Clear canvas
clearCanvasBtn.addEventListener('click', () => {
    drawingHistory = [];
    currentStrokes = [];
    initDrawingCanvas();
    japaneseText.textContent = '';
    romajiText.textContent = '';
});

// Undo last stroke
undoBtn.addEventListener('click', () => {
    if (drawingHistory.length > 0) {
        drawingHistory.pop();
        redrawCanvas();
        if (drawingHistory.length > 0) {
            if (analysisTimeout) clearTimeout(analysisTimeout);
            analysisTimeout = setTimeout(() => {
                analyzeCurrentDrawing();
            }, 300);
        } else {
            japaneseText.textContent = '';
            romajiText.textContent = '';
        }
    }
});

// Analyze current drawing
function analyzeCurrentDrawing() {
    if (drawingHistory.length === 0) return;
    
    drawCanvas.toBlob(blob => {
        processImageQuietly(blob);
    });
}

// Process image without showing loading/preview
async function processImageQuietly(imageFile) {
    try {
        const ocrResult = await performOCR(imageFile);
        
        if (!ocrResult || !ocrResult.trim()) {
            japaneseText.textContent = '';
            romajiText.textContent = '';
            return;
        }
        
        const romaji = await convertToRomaji(ocrResult);
        displayResultsCompact(ocrResult, romaji);
        
    } catch (error) {
        console.error('OCR error:', error);
    }
}

// Display results in compact format
function displayResultsCompact(japanese, romaji) {
    // Clean up the OCR result - take first character if multiple detected
    const cleanJapanese = japanese.trim().split(/\s+/)[0];
    japaneseText.textContent = cleanJapanese;
    romajiText.textContent = romaji.trim().split(/\s+/)[0];
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


