/**
 * Display a toast notification
 * @param {string} message - Message to display
 * @param {string} type - 'success', 'error', 'info', 'warning'
 */
export function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    // Icon based on type
    let icon = 'fa-info-circle';
    if (type === 'success') icon = 'fa-check-circle';
    if (type === 'error') icon = 'fa-exclamation-circle';
    if (type === 'warning') icon = 'fa-exclamation-triangle';

    toast.innerHTML = `
        <i class="fas ${icon}"></i>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    // Remove after animation
    setTimeout(() => {
        if (container.contains(toast)) {
            container.removeChild(toast);
        }
    }, 4000);
}

/**
 * Format Ethereum address (e.g. 0x1234...5678)
 */
export function formatAddress(address) {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

/**
 * Format timestamp to readable date
 */
export function formatDate(timestamp) {
    if (!timestamp) return 'N/A';
    // If timestamp is in seconds (from contract), convert to milliseconds
    const date = new Date(Number(timestamp) * (timestamp.toString().length === 10 ? 1000 : 1));
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Show a loading overlay in a container
 */
export function showLoading(containerId, message = 'Loading...') {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = `
        <div class="loading-overlay">
            <div class="spinner spinner-lg"></div>
            <p>${message}</p>
        </div>
    `;
}

/**
 * Show empty state in a container
 */
export function showEmptyState(containerId, title, message, icon = 'fa-inbox') {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = `
        <div class="empty-state">
            <i class="fas ${icon} empty-icon"></i>
            <h3 class="empty-title">${title}</h3>
            <p class="empty-text">${message}</p>
        </div>
    `;
}

/**
 * Simulate uploading to IPFS and getting a hash
 * (In a real app, this would use Pinata or similar)
 */
export async function simulateIPFSUpload(file) {
    return new Promise((resolve) => {
        showToast('Uploading to IPFS...', 'info');
        setTimeout(() => {
            // Generate a fake IPFS CID
            const randomString = Math.random().toString(36).substring(2, 15);
            const fakeHash = `Qm${randomString}fakepdfhash${Date.now()}`;
            resolve(fakeHash);
        }, 1500);
    });
}
