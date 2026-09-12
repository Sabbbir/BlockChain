import QRCode from 'qrcode';

/**
 * Generate a QR code for a given certificate ID
 * @param {string} certId - The certificate ID
 * @param {HTMLCanvasElement} canvasElement - The canvas to render to
 */
export async function generateCertQRCode(certId, canvasElement) {
    if (!certId || !canvasElement) return;

    // Create the verification URL pointing to the app's verify page
    const verifyUrl = `${window.location.origin}${window.location.pathname}#/verify?id=${encodeURIComponent(certId)}`;

    try {
        await QRCode.toCanvas(canvasElement, verifyUrl, {
            width: 300,
            margin: 2,
            color: {
                dark: '#0a0e1a', // Dark blue background color
                light: '#ffffff' // White
            }
        });
        return true;
    } catch (err) {
        console.error('Error generating QR code', err);
        return false;
    }
}
