// ===== RETRO PHOTOBOOTH - Camera & Photo Logic =====

let stream = null;
let currentFilter = 'none';
let capturedImage = null;
let mode = 'single'; // 'single' | 'strip'
let stripPhotos = [];
let filterInterval = null;
let isCapturing = false; // Flag to prevent double triggers


// Canvas for applying filters
const video = document.getElementById('videoFeed');
const filterCanvas = document.getElementById('filterCanvas');
const filterCtx = filterCanvas.getContext('2d');

// CSS filter map
const FILTER_MAP = {
    none: 'none',
    vintage: 'sepia(0.6) contrast(1.15) brightness(0.9) saturate(0.8)',
    sepia: 'sepia(1) contrast(1.1) brightness(0.95)',
    noir: 'grayscale(1) contrast(1.3) brightness(0.85)',
    faded: 'sepia(0.3) saturate(0.7) brightness(1.1) contrast(0.9)',
    chrome: 'saturate(1.3) contrast(1.2) brightness(1.05)',
    lomo: 'saturate(1.5) contrast(1.4) brightness(0.85)',
    polaroid: 'sepia(0.2) saturate(1.2) brightness(1.1) contrast(0.95)',
    sunset: 'sepia(0.4) saturate(1.5) hue-rotate(-15deg) brightness(1.05)',
    cool: 'saturate(0.9) hue-rotate(15deg) brightness(1.05) contrast(1.1)',
    warm: 'sepia(0.2) saturate(1.3) hue-rotate(-10deg) brightness(1.1)',
    dreamy: 'saturate(1.2) brightness(1.15) contrast(0.9) blur(0.5px)'
};

// ===== Initialize Camera =====
async function initCamera() {
    try {
        stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
            audio: false
        });
        video.srcObject = stream;
        video.style.filter = FILTER_MAP[currentFilter];
        showToast('📷 Camera ready!');
    } catch (err) {
        console.error('Camera error:', err);
        showToast('Camera access denied. Please allow camera permissions!', 'error');
        // Show placeholder
        document.getElementById('viewfinder').innerHTML +=
            '<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:#111;flex-direction:column;gap:1rem;">' +
            '<div style="font-size:4rem">📷</div>' +
            '<p style="color:#888;font-family:monospace;font-size:0.8rem;text-align:center">Camera not available.<br>Please allow camera access<br>and reload the page.</p>' +
            '</div>';
    }
}

// ===== Set Mode =====
function setMode(newMode) {
    mode = newMode;
    stripPhotos = [];

    document.getElementById('singleModeBtn').classList.toggle('active', mode === 'single');
    document.getElementById('stripModeBtn').classList.toggle('active', mode === 'strip');
    document.getElementById('stripPreview').style.display = mode === 'strip' ? 'block' : 'none';

    // Reset strip frames
    if (mode === 'strip') {
        for (let i = 1; i <= 4; i++) {
            const frame = document.getElementById(`frame${i}`);
            frame.innerHTML = `<span>${i}</span>`;
            frame.classList.remove('filled');
        }
        document.getElementById('stripHint').textContent = 'Take 4 photos for your film strip!';
    }

    // Hide save/retake/undo buttons
    document.getElementById('saveBtn').style.display = 'none';
    document.getElementById('retakeBtn').style.display = 'none';
    document.getElementById('undoBtn').style.display = 'none';
    document.getElementById('previewSection').style.display = 'none';
    capturedImage = null;

    // Always ensure shutter is enabled when switching modes
    const shutter = document.getElementById('shutterBtn');
    shutter.disabled = false;
    shutter.style.opacity = '1';
    shutter.style.cursor = 'pointer';
}

// ===== Apply Filter =====
function applyFilter(filter) {
    currentFilter = filter;
    video.style.filter = FILTER_MAP[filter] || 'none';

    // Update filter UI
    document.querySelectorAll('.filter-item').forEach(el => {
        el.classList.toggle('active', el.dataset.filter === filter);
    });
}

// ===== Capture Photo =====
function capturePhoto(event) {
    if (isCapturing) return;
    if (mode === 'strip') {
        captureStripPhoto(event);
    } else {
        captureSinglePhoto(event);
    }
}

function captureSinglePhoto(event) {
    if (event) event.stopPropagation();
    if (isCapturing) return;
    isCapturing = true;

    startCountdown(3, () => {
        const imageData = snapPhoto();
        capturedImage = imageData;
        isCapturing = false;

        // Show preview
        document.getElementById('capturedImg').src = imageData;
        document.getElementById('capturedImg').style.filter = FILTER_MAP[currentFilter];
        document.getElementById('previewSection').style.display = 'block';

        // Show controls
        document.getElementById('saveBtn').style.display = 'flex';
        document.getElementById('retakeBtn').style.display = 'flex';

        // Disable shutter so we don't capture again while previewing
        document.getElementById('shutterBtn').disabled = true;
        document.getElementById('shutterBtn').style.opacity = '0.5';
        document.getElementById('shutterBtn').style.cursor = 'not-allowed';
    });
}

function captureStripPhoto(event) {
    if (event) event.stopPropagation();
    if (isCapturing) return;

    if (stripPhotos.length >= 4) {
        showToast('Strip is full! Save or retake.', 'error');
        return;
    }

    isCapturing = true;
    startCountdown(3, () => {
        const imageData = snapPhoto();
        const idx = stripPhotos.length;
        stripPhotos.push({ image: imageData, filter: currentFilter });
        isCapturing = false;

        // ... previous code for updating frames ...
        const frame = document.getElementById(`frame${idx + 1}`);
        frame.innerHTML = `<img src="${imageData}" style="filter:${FILTER_MAP[currentFilter]}">`;
        frame.classList.add('filled');

        const remaining = 4 - stripPhotos.length;
        if (remaining > 0) {
            document.getElementById('stripHint').textContent =
                `${remaining} more photo${remaining > 1 ? 's' : ''} to go!`;
            document.getElementById('undoBtn').style.display = 'flex';
        } else {
            document.getElementById('stripHint').textContent = 'Strip complete! 🎞️';
            document.getElementById('saveBtn').style.display = 'flex';
            document.getElementById('retakeBtn').style.display = 'flex';
            document.getElementById('undoBtn').style.display = 'flex';

            // Disable shutter for strip too
            document.getElementById('shutterBtn').disabled = true;
            document.getElementById('shutterBtn').style.opacity = '0.5';
            document.getElementById('shutterBtn').style.cursor = 'not-allowed';

            // Build strip canvas
            buildStripCanvas();
            setTimeout(() => openStripModal(event), 800);
        }
    });
}

function undoLastShot() {
    if (mode !== 'strip' || stripPhotos.length === 0) return;

    const idx = stripPhotos.length - 1;
    stripPhotos.pop();

    // Reset frame UI
    const frame = document.getElementById(`frame${idx + 1}`);
    frame.innerHTML = `<span>${idx + 1}</span>`;
    frame.classList.remove('filled');

    // Reset control visibility
    if (stripPhotos.length === 0) {
        document.getElementById('undoBtn').style.display = 'none';
    }

    document.getElementById('saveBtn').style.display = 'none';
    document.getElementById('retakeBtn').style.display = 'none';

    // Re-enable shutter
    const shutter = document.getElementById('shutterBtn');
    shutter.disabled = false;
    shutter.style.opacity = '1';
    shutter.style.cursor = 'pointer';

    // Update hint
    const remaining = 4 - stripPhotos.length;
    document.getElementById('stripHint').textContent =
        `${remaining} more photo${remaining > 1 ? 's' : ''} to go!`;

    showToast('Last shot removed. Ready for retake!');
}

// ===== Snap a photo from video stream =====
function snapPhoto() {
    filterCanvas.width = video.videoWidth || 640;
    filterCanvas.height = video.videoHeight || 480;

    filterCtx.save();
    // Mirror the canvas to match what user sees
    filterCtx.translate(filterCanvas.width, 0);
    filterCtx.scale(-1, 1);
    filterCtx.filter = FILTER_MAP[currentFilter] || 'none';
    filterCtx.drawImage(video, 0, 0, filterCanvas.width, filterCanvas.height);
    filterCtx.restore();

    // Flash effect
    flashEffect();

    return filterCanvas.toDataURL('image/jpeg', 0.9);
}

// ===== Countdown =====
function startCountdown(seconds, callback) {
    const overlay = document.getElementById('countdownOverlay');
    const num = document.getElementById('countdownNum');
    let count = seconds;

    overlay.classList.add('active');
    num.textContent = count;

    // Disable shutter during countdown
    document.getElementById('shutterBtn').disabled = true;

    const interval = setInterval(() => {
        count--;
        if (count > 0) {
            num.textContent = count;
            num.style.animation = 'none';
            setTimeout(() => num.style.animation = 'countPulse 0.8s ease', 10);
        } else {
            clearInterval(interval);
            overlay.classList.remove('active');
            document.getElementById('shutterBtn').disabled = false;
            callback();
        }
    }, 1000);
}

// ===== Flash Effect =====
function flashEffect() {
    const flash = document.getElementById('flashOverlay');
    flash.classList.add('flash');
    setTimeout(() => flash.classList.remove('flash'), 400);
}

// ===== Retake =====
function retakePhoto() {
    if (mode === 'strip') {
        retakeStrip();
        return;
    }
    capturedImage = null;
    document.getElementById('saveBtn').style.display = 'none';
    document.getElementById('retakeBtn').style.display = 'none';
    document.getElementById('previewSection').style.display = 'none';

    // Re-enable shutter
    const shutter = document.getElementById('shutterBtn');
    shutter.disabled = false;
    shutter.style.opacity = '1';
    shutter.style.cursor = 'pointer';
}

function retakeStrip() {
    stripPhotos = [];
    setMode('strip');

    // Re-enable shutter manually just in case
    const shutter = document.getElementById('shutterBtn');
    shutter.disabled = false;
    shutter.style.opacity = '1';
    shutter.style.cursor = 'pointer';

    closeStripModal();
    showToast('Strip reset. Ready for all new photos!');
}

// ===== Build Strip Canvas =====
function buildStripCanvas() {
    const canvas = document.getElementById('stripCanvas');
    const ctx = canvas.getContext('2d');

    const FRAME_W = 240;
    const FRAME_H = 180;
    const PADDING = 15;
    const BOTTOM_H = 50;

    canvas.width = FRAME_W + PADDING * 2;
    canvas.height = (FRAME_H + PADDING) * 4 + PADDING + BOTTOM_H;

    // Background - dark film strip
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Film perforations
    ctx.fillStyle = '#333';
    for (let i = 0; i < 8; i++) {
        ctx.fillRect(5, 20 + i * (canvas.height / 8), 10, 12);
        ctx.fillRect(canvas.width - 15, 20 + i * (canvas.height / 8), 10, 12);
    }

    // Load and draw photos
    let loaded = 0;
    stripPhotos.forEach((photo, idx) => {
        const img = new Image();
        img.onload = () => {
            // Apply filter to canvas
            ctx.save();
            ctx.filter = FILTER_MAP[photo.filter] || 'none';
            const y = PADDING + idx * (FRAME_H + PADDING);
            ctx.drawImage(img, PADDING, y, FRAME_W, FRAME_H);
            ctx.restore();

            // Frame number
            ctx.fillStyle = 'rgba(200,134,10,0.8)';
            ctx.font = '10px monospace';
            ctx.fillText(`#${idx + 1}`, PADDING + 4, y + 14);

            loaded++;
            if (loaded === 4) {
                // Bottom text
                ctx.fillStyle = '#c8860a';
                ctx.font = 'bold 14px "Courier New", monospace';
                ctx.textAlign = 'center';
                ctx.fillText('✦ RETRO BOOTH ✦', canvas.width / 2, canvas.height - 25);
                ctx.font = '10px monospace';
                ctx.fillStyle = '#888';
                const now = new Date();
                ctx.fillText(now.toLocaleDateString(), canvas.width / 2, canvas.height - 10);
            }
        };
        img.src = photo.image;
    });
}

// ===== Load Albums into a select element dynamically =====
async function loadAlbumsIntoSelect(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;

    // Preserve current value if any
    const currentVal = select.value;

    // Show loading state
    select.innerHTML = '<option value="">⏳ Loading albums...</option>';

    try {
        const albums = await apiRequest('/api/albums', 'GET');
        select.innerHTML = '<option value="">— No Album —</option>';

        if (Array.isArray(albums) && albums.length > 0) {
            albums.forEach(album => {
                const opt = document.createElement('option');
                opt.value = album.id;
                opt.textContent = '📁 ' + album.name;
                select.appendChild(opt);
            });
            // Restore previous selection if it still exists
            if (currentVal) select.value = currentVal;
        } else {
            // Add a hint if no albums exist yet
            const hint = document.createElement('option');
            hint.disabled = true;
            hint.textContent = '(No albums yet — create one on dashboard)';
            select.appendChild(hint);
        }
    } catch (e) {
        select.innerHTML = '<option value="">— No Album —</option>';
        console.error('Failed to load albums', e);
    }
}

function openSaveModal(event) {
    if (event) event.stopPropagation();
    if (mode === 'strip') {
        openStripModal(event);
        return;
    }
    const saveImg = document.getElementById('savePreviewImg');
    saveImg.src = capturedImage;
    saveImg.style.filter = FILTER_MAP[currentFilter];

    // Set default name
    const now = new Date();
    document.getElementById('photoName').value =
        `Photo_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;

    // Clear memory title
    document.getElementById('memoryTitle').value = '';

    // Dynamically load latest albums every time modal opens
    loadAlbumsIntoSelect('albumSelect');

    openModal('saveModal');
}

function closeSaveModal() {
    closeModal('saveModal');
}

async function savePhoto() {
    const name = document.getElementById('photoName').value.trim() || 'Photo';
    const memoryTitle = document.getElementById('memoryTitle').value.trim();
    const albumId = document.getElementById('albumSelect').value || null;

    try {
        const result = await apiRequest('/api/photos/save', 'POST', {
            name,
            memoryTitle,
            imageData: capturedImage,
            filter: currentFilter,
            isStrip: false,
            albumId: albumId ? parseInt(albumId) : null
        });

        if (result.error) {
            showToast(result.error, 'error');
        } else {
            showToast('📸 Photo saved to your gallery!');
            closeSaveModal();

            // Redirect to gallery so users can see their photo immediately
            setTimeout(() => {
                window.location.href = '/gallery';
            }, 800);
        }
    } catch (e) {
        showToast('Failed to save photo.', 'error');
    }
}

function downloadPhoto() {
    const a = document.createElement('a');
    a.href = capturedImage;
    a.download = `retrobooth_${Date.now()}.jpg`;
    a.click();
}

function printPhoto() {
    const win = window.open('');
    win.document.write(`
        <html><head><title>Print - Retro Booth</title>
        <style>
            body { margin: 0; display: flex; align-items: center; justify-content: center;
                   min-height: 100vh; background: white; }
            img { max-width: 100%; max-height: 100vh; object-fit: contain;
                  filter: ${FILTER_MAP[currentFilter]}; }
        </style></head>
        <body><img src="${capturedImage}" onload="window.print(); window.close();"/></body>
        </html>
    `);
    win.document.close();
}

// ===== Strip Modal =====
function openStripModal(event) {
    if (event) event.stopPropagation();
    openModal('stripModal');
    // ... rest of logic
    const now = new Date();
    document.getElementById('stripName').value =
        `Strip_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    document.getElementById('stripMemoryTitle').value = '';

    // Dynamically load latest albums every time modal opens
    loadAlbumsIntoSelect('stripAlbumSelect');
}

function closeStripModal() {
    closeModal('stripModal');
}

async function saveStrip() {
    const canvas = document.getElementById('stripCanvas');
    const stripImageData = canvas.toDataURL('image/jpeg', 0.9);
    const name = document.getElementById('stripName').value.trim() || 'Photo Strip';
    const memoryTitle = document.getElementById('stripMemoryTitle').value.trim();
    const albumId = document.getElementById('stripAlbumSelect').value || null;

    try {
        const result = await apiRequest('/api/photos/save', 'POST', {
            name,
            memoryTitle,
            imageData: stripImageData,
            filter: 'none',
            isStrip: true,
            albumId: albumId ? parseInt(albumId) : null
        });

        if (result.error) {
            showToast(result.error, 'error');
        } else {
            showToast('🎞️ Film strip saved!');
            closeStripModal();
            // Redirect to gallery
            setTimeout(() => {
                window.location.href = '/gallery';
            }, 800);
        }
    } catch (e) {
        showToast('Failed to save strip.', 'error');
    }
}

function printStrip() {
    const canvas = document.getElementById('stripCanvas');
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    const win = window.open('');
    win.document.write(`
        <html><head><title>Print Film Strip - Retro Booth</title>
        <style>
            body { margin: 0; display: flex; align-items: center; justify-content: center;
                   min-height: 100vh; background: white; }
            img { max-height: 100vh; object-fit: contain;
                  border: 8px solid #111; box-shadow: 4px 4px 20px rgba(0,0,0,0.3); }
        </style></head>
        <body><img src="${dataUrl}" onload="window.print(); window.close();"/></body>
        </html>
    `);
    win.document.close();
}

// ===== Initialize =====
window.addEventListener('load', () => {
    initCamera();
    applyFilter('none');
});

// Cleanup on page leave
window.addEventListener('beforeunload', () => {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
});
