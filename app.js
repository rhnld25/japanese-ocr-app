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
        // Wait for kuroshiro to be initialized
        if (!kuroshiro) {
            console.log('Kuroshiro not initialized, initializing now...');
            await initKuroshiro();
        }
        
        // Check if kuroshiro is ready
        if (!kuroshiro || !kuroshiro._initialized) {
            console.log('Waiting for Kuroshiro to be ready...');
            // Wait a bit for initialization
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        if (!kuroshiro || !kuroshiro._initialized) {
            console.error('Kuroshiro failed to initialize');
            return useSimpleRomajiConversion(text);
        }
        
        const result = await kuroshiro.convert(text, {
            to: 'romaji',
            mode: 'spaced'
        });
        return result;
    } catch (error) {
        console.error('Romaji conversion error:', error);
        return useSimpleRomajiConversion(text);
    }
}

// Simple fallback romaji conversion
function useSimpleRomajiConversion(text) {
    const hiraganaMap = {
        'あ': 'a', 'い': 'i', 'う': 'u', 'え': 'e', 'お': 'o',
        'か': 'ka', 'き': 'ki', 'く': 'ku', 'け': 'ke', 'こ': 'ko',
        'さ': 'sa', 'し': 'shi', 'す': 'su', 'せ': 'se', 'そ': 'so',
        'た': 'ta', 'ち': 'chi', 'つ': 'tsu', 'て': 'te', 'と': 'to',
        'な': 'na', 'に': 'ni', 'ぬ': 'nu', 'ね': 'ne', 'の': 'no',
        'は': 'ha', 'ひ': 'hi', 'ふ': 'fu', 'へ': 'he', 'ほ': 'ho',
        'ま': 'ma', 'み': 'mi', 'む': 'mu', 'め': 'me', 'も': 'mo',
        'や': 'ya', 'ゆ': 'yu', 'よ': 'yo',
        'ら': 'ra', 'り': 'ri', 'る': 'ru', 'れ': 're', 'ろ': 'ro',
        'わ': 'wa', 'を': 'wo', 'ん': 'n',
        'が': 'ga', 'ぎ': 'gi', 'ぐ': 'gu', 'げ': 'ge', 'ご': 'go',
        'ざ': 'za', 'じ': 'ji', 'ず': 'zu', 'ぜ': 'ze', 'ぞ': 'zo',
        'だ': 'da', 'ぢ': 'ji', 'づ': 'zu', 'で': 'de', 'ど': 'do',
        'ば': 'ba', 'び': 'bi', 'ぶ': 'bu', 'べ': 'be', 'ぼ': 'bo',
        'ぱ': 'pa', 'ぴ': 'pi', 'ぷ': 'pu', 'ぺ': 'pe', 'ぽ': 'po',
        'きゃ': 'kya', 'きゅ': 'kyu', 'きょ': 'kyo',
        'しゃ': 'sha', 'しゅ': 'shu', 'しょ': 'sho',
        'ちゃ': 'cha', 'ちゅ': 'chu', 'ちょ': 'cho',
        'にゃ': 'nya', 'にゅ': 'nyu', 'にょ': 'nyo',
        'ひゃ': 'hya', 'ひゅ': 'hyu', 'ひょ': 'hyo',
        'みゃ': 'mya', 'みゅ': 'myu', 'みょ': 'myo',
        'りゃ': 'rya', 'りゅ': 'ryu', 'りょ': 'ryo',
        'ぎゃ': 'gya', 'ぎゅ': 'gyu', 'ぎょ': 'gyo',
        'じゃ': 'ja', 'じゅ': 'ju', 'じょ': 'jo',
        'びゃ': 'bya', 'びゅ': 'byu', 'びょ': 'byo',
        'ぴゃ': 'pya', 'ぴゅ': 'pyu', 'ぴょ': 'pyo',
        // Katakana
        'ア': 'a', 'イ': 'i', 'ウ': 'u', 'エ': 'e', 'オ': 'o',
        'カ': 'ka', 'キ': 'ki', 'ク': 'ku', 'ケ': 'ke', 'コ': 'ko',
        'サ': 'sa', 'シ': 'shi', 'ス': 'su', 'セ': 'se', 'ソ': 'so',
        'タ': 'ta', 'チ': 'chi', 'ツ': 'tsu', 'テ': 'te', 'ト': 'to',
        'ナ': 'na', 'ニ': 'ni', 'ヌ': 'nu', 'ネ': 'ne', 'ノ': 'no',
        'ハ': 'ha', 'ヒ': 'hi', 'フ': 'fu', 'ヘ': 'he', 'ホ': 'ho',
        'マ': 'ma', 'ミ': 'mi', 'ム': 'mu', 'メ': 'me', 'モ': 'mo',
        'ヤ': 'ya', 'ユ': 'yu', 'ヨ': 'yo',
        'ラ': 'ra', 'リ': 'ri', 'ル': 'ru', 'レ': 're', 'ロ': 'ro',
        'ワ': 'wa', 'ヲ': 'wo', 'ン': 'n',
        'ガ': 'ga', 'ギ': 'gi', 'グ': 'gu', 'ゲ': 'ge', 'ゴ': 'go',
        'ザ': 'za', 'ジ': 'ji', 'ズ': 'zu', 'ゼ': 'ze', 'ゾ': 'zo',
        'ダ': 'da', 'ヂ': 'ji', 'ヅ': 'zu', 'デ': 'de', 'ド': 'do',
        'バ': 'ba', 'ビ': 'bi', 'ブ': 'bu', 'ベ': 'be', 'ボ': 'bo',
        'パ': 'pa', 'ピ': 'pi', 'プ': 'pu', 'ペ': 'pe', 'ポ': 'po'
    };
    
    let result = '';
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const twoChar = text.substring(i, i + 2);
        
        if (hiraganaMap[twoChar]) {
            result += hiraganaMap[twoChar];
            i++; // Skip next character
        } else if (hiraganaMap[char]) {
            result += hiraganaMap[char];
        } else {
            result += char;
        }
    }
    
    return result || text;
}


