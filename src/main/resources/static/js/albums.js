// Albums management JS

function openCreateAlbumModal() {
    openModal('albumModal');
    document.getElementById('albumName')?.focus();
}

function closeCreateAlbumModal() {
    closeModal('albumModal');
    document.getElementById('albumName').value = '';
    document.getElementById('albumDesc').value = '';
}

async function createAlbum() {
    const name = document.getElementById('albumName').value.trim();
    const description = document.getElementById('albumDesc').value.trim();

    if (!name) {
        showToast('Please enter an album name!', 'error');
        return;
    }

    try {
        const result = await apiRequest('/api/albums', 'POST', { name, description });
        if (result.error) {
            showToast(result.error, 'error');
        } else {
            showToast('Album created! 📁');
            closeCreateAlbumModal();
            setTimeout(() => window.location.reload(), 1000);
        }
    } catch (e) {
        showToast('Failed to create album.', 'error');
    }
}

async function deleteAlbum(albumId) {
    if (!confirm('Delete this album? Photos inside will not be deleted.')) return;
    try {
        const result = await apiRequest(`/api/albums/${albumId}`, 'DELETE');
        if (result.error) {
            showToast(result.error, 'error');
        } else {
            showToast('Album deleted!');
            setTimeout(() => window.location.href = '/gallery', 1000);
        }
    } catch (e) {
        showToast('Failed to delete album.', 'error');
    }
}
