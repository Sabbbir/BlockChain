import { generateCertQRCode } from '../utils/qr-generator.js';

export default {
    async render(params) {
        const initialId = params.id || '';

        let html = `
            <div class="animate-in">
                <div class="card" style="max-width: 600px; margin: 0 auto;">
                    <div class="card-header">
                        <h3 class="card-title">Generate Verification QR</h3>
                    </div>
                    <div class="card-body">
                        <p class="text-secondary mb-4" style="font-size: 14px;">Generate a QR code that employers can scan to instantly verify this certificate's authenticity.</p>
                        
                        <form id="qrForm">
                            <div class="form-group">
                                <label class="form-label">Certificate ID</label>
                                <div style="display: flex; gap: 10px;">
                                    <input type="text" class="form-input" id="qrCertId" required placeholder="CERT-2026-001" value="${initialId}" style="flex: 1;">
                                    <button type="submit" class="btn btn-primary" id="btnGenerate">
                                        <i class="fas fa-qrcode"></i> Generate
                                    </button>
                                </div>
                            </div>
                        </form>

                        <div id="qrResultContainer" class="qr-container" style="display: none;">
                            <div class="qr-wrapper">
                                <canvas id="qrCanvas"></canvas>
                            </div>
                            <div class="text-center">
                                <h4 class="mb-4" style="color: var(--text-primary);">Certificate ID: <span id="qrDisplayId" class="text-accent font-mono"></span></h4>
                                <button class="btn btn-outline" id="btnDownloadQr">
                                    <i class="fas fa-download"></i> Download QR Image
                                </button>
                                <a href="" id="btnVerifyLink" class="btn btn-success" style="margin-left: 10px;">
                                    <i class="fas fa-external-link-alt"></i> Test Verification Link
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        setTimeout(() => {
            const form = document.getElementById('qrForm');
            const resultContainer = document.getElementById('qrResultContainer');
            const canvas = document.getElementById('qrCanvas');
            const displayId = document.getElementById('qrDisplayId');
            const btnDownload = document.getElementById('btnDownloadQr');
            const btnVerifyLink = document.getElementById('btnVerifyLink');
            
            if (initialId) {
                setTimeout(() => doGenerate(initialId), 300);
            }

            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const id = document.getElementById('qrCertId').value;
                doGenerate(id);
            });

            async function doGenerate(id) {
                const success = await generateCertQRCode(id, canvas);
                if (success) {
                    displayId.textContent = id;
                    resultContainer.style.display = 'flex';
                    
                    const verifyUrl = `${window.location.origin}${window.location.pathname}#/verify?id=${encodeURIComponent(id)}`;
                    btnVerifyLink.href = verifyUrl;
                }
            }

            btnDownload.addEventListener('click', () => {
                const id = document.getElementById('qrCertId').value;
                const link = document.createElement('a');
                link.download = `Cert-QR-${id}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
            });

        }, 100);

        return html;
    }
};
