// Gallery JS - view, edit, delete, filter photos

let allPhotos = [];
let currentViewerPhotoId = null;

document.addEventListener('DOMContentLoaded', () => {
    // Load photos data for viewer
    allPhotos = Array.from(document.querySelectorAll('.photo-card-lg')).map(card => ({
        id: card.id.replace('photo-', ''),
        albumId: card.dataset.albumId,
        name: card.querySelector('.photo-name')?.textContent,
        memory: card.querySelector('.photo-memory')?.textContent,
        src: card.querySelector('img')?.src
    }));
});

function filterByAlbum(albumId, tabEl) {
    // Update active tab
    document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
    tabEl.classList.add('active');

    // Filter photo cards
    const cards = document.querySelectorAll('.photo-card-lg');
    cards.forEach(card => {
        if (albumId === null) {
            card.style.display = '';
        } else {
            const cardAlbumId = card.dataset.albumId;
            card.style.display = (String(cardAlbumId) === String(albumId)) ? '' : 'none';
        }
    });
}

// Note: openPhotoViewer, closePhotoViewer, etc. are now handled globally in dashboard.js


function downloadViewerPhoto() {
    const img = document.getElementById('viewerImg');
    const name = document.getElementById('viewerName').textContent;
    downloadImage(img.src, name);
}

function printViewerPhoto() {
    const img = document.getElementById('viewerImg');
    printImage(img.src);
}

function downloadImage(src, name) {
    const a = document.createElement('a');
    a.href = src;
    a.download = (name || 'photo') + '.png';
    a.click();
}

function printImage(src) {
    const win = window.open('');
    win.document.write(`
        <html><head><title>Print Photo - Retro Booth</title>
        <style>
            body { margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: white; }
            img { max-width: 100%; max-height: 100vh; object-fit: contain; }
        </style>
        </head><body><img src="${src}" onload="window.print(); window.close();" /></body></html>
    `);
    win.document.close();
}

function openEditModal(photoId) {
    const card = document.getElementById(`photo-${photoId}`);
    if (!card) return;

    const name = card.querySelector('.photo-name')?.textContent;
    const memory = card.querySelector('.photo-memory')?.textContent?.replace('✨ ', '');
    const albumId = card.dataset.albumId;

    document.getElementById('editPhotoId').value = photoId;
    document.getElementById('editPhotoName').value = name || '';
    document.getElementById('editMemoryTitle').value = memory || '';
    const albumSelect = document.getElementById('editAlbumSelect');
    if (albumSelect && albumId && albumId !== 'uncategorized') {
        albumSelect.value = albumId;
    }

    openModal('editPhotoModal');
}

function closeEditModal() {
    closeModal('editPhotoModal');
}

async function saveEditPhoto() {
    const photoId = document.getElementById('editPhotoId').value;
    const name = document.getElementById('editPhotoName').value.trim();
    const memoryTitle = document.getElementById('editMemoryTitle').value.trim();
    const albumId = document.getElementById('editAlbumSelect')?.value || null;

    try {
        const result = await apiRequest(`/api/photos/${photoId}`, 'PUT', {
            name, memoryTitle, albumId: albumId || null
        });

        if (result.error) {
            showToast(result.error, 'error');
        } else {
            showToast('Photo updated! ✨');
            closeEditModal();
            setTimeout(() => window.location.reload(), 1000);
        }
    } catch (e) {
        showToast('Failed to update photo.', 'error');
    }
}

async function deletePhoto(photoId) {
    if (!confirm('Delete this photo? This cannot be undone.')) return;
    try {
        const result = await apiRequest(`/api/photos/${photoId}`, 'DELETE');
        if (result.error) {
            showToast(result.error, 'error');
        } else {
            showToast('Photo deleted!');
            const card = document.getElementById(`photo-${photoId}`);
            if (card) {
                card.style.opacity = '0';
                card.style.transform = 'scale(0.8)';
                card.style.transition = 'all 0.3s';
                setTimeout(() => card.remove(), 300);
            }
        }
    } catch (e) {
        showToast('Failed to delete photo.', 'error');
    }
}
