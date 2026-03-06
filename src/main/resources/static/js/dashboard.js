// Dashboard shared utilities

// Toast notification system
function showToast(message, type = 'success') {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `${type === 'success' ? '✅' : '❌'} ${message}`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(50px)';
        toast.style.transition = 'all 0.3s';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Sidebar toggle
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    sidebar.classList.toggle('collapsed');
    mainContent.classList.toggle('expanded');
}

// Modal helpers
function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.add('active');
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove('active');
}

// Close modal when clicking outside
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
        e.target.classList.remove('active');
    }
});

// API helper - reads CSRF token from meta tag injected by Thymeleaf
function getCsrfToken() {
    const meta = document.querySelector('meta[name="_csrf"]');
    const header = document.querySelector('meta[name="_csrf_header"]');
    if (meta && header) {
        return { header: header.getAttribute('content'), token: meta.getAttribute('content') };
    }
    return null;
}

async function apiRequest(url, method = 'GET', body = null) {
    const options = {
        method,
        headers: { 'Content-Type': 'application/json' }
    };

    // Add CSRF token for state-changing requests
    if (method !== 'GET') {
        const csrf = getCsrfToken();
        if (csrf) {
            options.headers[csrf.header] = csrf.token;
        }
    }

    if (body) options.body = JSON.stringify(body);
    const res = await fetch(url, options);
    if (!res.ok && res.status !== 200) {
        const text = await res.text();
        try { return JSON.parse(text); } catch { return { error: text }; }
    }
    return res.json();
}

// Global Photo Viewer logic
let currentViewerPhotoId = null;

function openPhotoViewer(photoId, event) {
    if (event) event.stopPropagation();

    // Find image element - works with both photo-card and photo-card-lg
    const card = document.getElementById(`photo-${photoId}`) ||
        Array.from(document.querySelectorAll('.photo-card')).find(c => c.getAttribute('data-id') == photoId);

    if (!card) {
        // Fallback for dashboard
        const img = event?.currentTarget?.querySelector('img') || event?.target;
        if (img && img.src) {
            updateViewerUI(img.src, img.className, "Photo", "");
            openModal('photoViewerModal');
        }
        return;
    }

    const img = card.querySelector('img');
    const name = card.querySelector('.photo-name')?.textContent;
    const memory = card.querySelector('.photo-memory')?.textContent;

    updateViewerUI(img.src, img.className, name, memory);
    currentViewerPhotoId = photoId;
    openModal('photoViewerModal');
}

function updateViewerUI(src, className, name, memory) {
    const vImg = document.getElementById('viewerImg');
    if (vImg) {
        vImg.src = src;
        // If it's a polaroid photo, we want to ensure it doesn't get cropped square in the viewer
        let newClass = className.replace('polaroid-photo', 'photo-img') + ' viewer-img';
        vImg.className = newClass;
    }
    const vName = document.getElementById('viewerName');
    if (vName) vName.textContent = name || 'Photo';

    const vMem = document.getElementById('viewerMemory');
    if (vMem) vMem.textContent = memory || '';
}

function closePhotoViewer() {
    closeModal('photoViewerModal');
    currentViewerPhotoId = null;
}

function downloadViewerPhoto() {
    const img = document.getElementById('viewerImg');
    const name = document.getElementById('viewerName').textContent;
    const a = document.createElement('a');
    a.href = img.src;
    a.download = (name || 'photo') + '.png';
    a.click();
}

function printViewerPhoto() {
    const img = document.getElementById('viewerImg');
    const win = window.open('');
    win.document.write(`
        <html><head><title>Print Photo - Retro Booth</title>
        <style>
            body { margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: white; }
            img { max-width: 100%; max-height: 100vh; object-fit: contain; }
        </style>
        </head><body><img src="${img.src}" onload="window.print(); window.close();" /></body></html>
    `);
    win.document.close();
}
