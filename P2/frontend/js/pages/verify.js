import contractService from '../contract.js';
import { formatAddress, formatDate, showToast } from '../utils/helpers.js';

export default {
    async render(params) {
        // Check if ID was passed via URL (e.g. from QR scan)
        const initialId = params.id || '';
        
        let html = `
            <div class="animate-in">
                <div class="card" style="max-width: 600px; margin: 0 auto;">
                    <div class="card-header">
                        <h3 class="card-title">Check Certificate Authenticity</h3>
                    </div>
                    <div class="card-body">
                        <form id="verifyForm">
                            <div class="form-group">
                                <label class="form-label">Enter Certificate ID</label>
                                <div style="display: flex; gap: 10px;">
                                    <input type="text" class="form-input" id="verifyCertId" required placeholder="e.g. CERT-2026-001" value="${initialId}" style="flex: 1;">
                                    <button type="submit" class="btn btn-primary" id="btnVerify">
                                        <i class="fas fa-search"></i> Verify
                                    </button>
                                </div>
                            </div>
                        </form>

                        <div id="verifyResultContainer" style="margin-top: 30px; display: none;">
                            <!-- Result will be injected here -->
                        </div>
                    </div>
                </div>
            </div>
        `;

        setTimeout(() => {
            const form = document.getElementById('verifyForm');
            const btn = document.getElementById('btnVerify');
            const resultContainer = document.getElementById('verifyResultContainer');
            
            // If ID was in URL, auto-verify
            if (initialId) {
                setTimeout(() => doVerify(initialId), 500);
            }

            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const id = document.getElementById('verifyCertId').value;
                doVerify(id);
            });

            async function doVerify(id) {
                btn.disabled = true;
                btn.innerHTML = '<div class="spinner" style="width:16px;height:16px;border-width:2px;"></div>';
                resultContainer.style.display = 'block';
                resultContainer.innerHTML = '<div class="text-center text-secondary"><div class="spinner" style="margin: 0 auto 10px;"></div><p>Querying Blockchain...</p></div>';

                try {
                    const cert = await contractService.verifyCertificate(id);
                    
                    if (!cert) {
                        // Not found
                        resultContainer.innerHTML = `
                            <div class="verify-result invalid">
                                <div class="verify-icon text-danger"><i class="fas fa-times-circle"></i></div>
                                <h3 class="verify-title text-danger">Certificate Not Found</h3>
                                <p class="text-secondary">We could not find any record of this certificate on the blockchain.</p>
                            </div>
                        `;
                    } else if (!cert.isValid) {
                        // Revoked
                        resultContainer.innerHTML = `
                            <div class="verify-result invalid">
                                <div class="verify-icon text-danger"><i class="fas fa-ban"></i></div>
                                <h3 class="verify-title text-danger">Certificate Revoked</h3>
                                <p class="text-secondary">This certificate was previously issued but has been officially revoked by the institution.</p>
                                
                                <div class="verify-details" style="background: rgba(0,0,0,0.2); padding: 16px; border-radius: var(--radius-sm); margin-top: 20px;">
                                    <div class="verify-detail-row">
                                        <span class="verify-detail-label">Student ID</span>
                                        <span class="verify-detail-value">${cert.studentId}</span>
                                    </div>
                                    <div class="verify-detail-row">
                                        <span class="verify-detail-label">Course</span>
                                        <span class="verify-detail-value">${cert.courseName}</span>
                                    </div>
                                </div>
                            </div>
                        `;
                    } else {
                        // Valid!
                        resultContainer.innerHTML = `
                            <div class="verify-result valid">
                                <div class="verify-icon text-success"><i class="fas fa-check-circle"></i></div>
                                <h3 class="verify-title text-success">Verified Authentic</h3>
                                <p class="text-secondary">This certificate exists on the blockchain and is currently valid.</p>
                                
                                <div class="verify-details" style="background: rgba(0,0,0,0.2); padding: 20px; border-radius: var(--radius-md); border: 1px solid rgba(16, 185, 129, 0.2);">
                                    <div class="verify-detail-row">
                                        <span class="verify-detail-label">Student ID</span>
                                        <span class="verify-detail-value">${cert.studentId}</span>
                                    </div>
                                    <div class="verify-detail-row">
                                        <span class="verify-detail-label">Course</span>
                                        <span class="verify-detail-value">${cert.courseName}</span>
                                    </div>
                                    <div class="verify-detail-row">
                                        <span class="verify-detail-label">Grade</span>
                                        <span class="verify-detail-value">${cert.grade}</span>
                                    </div>
                                    <div class="verify-detail-row">
                                        <span class="verify-detail-label">Issue Date</span>
                                        <span class="verify-detail-value">${formatDate(cert.issuedAt)}</span>
                                    </div>
                                    <div class="verify-detail-row">
                                        <span class="verify-detail-label">Issuer Address</span>
                                        <span class="verify-detail-value font-mono" style="font-size:12px;">${cert.issuedBy}</span>
                                    </div>
                                    <div class="verify-detail-row" style="border-bottom: none;">
                                        <span class="verify-detail-label">On-Chain Hash</span>
                                        <span class="verify-detail-value font-mono text-accent" style="font-size:11px;">${cert.certHash}</span>
                                    </div>
                                </div>
                            </div>
                        `;
                    }
                } catch (err) {
                    console.error(err);
                    resultContainer.innerHTML = `
                        <div class="verify-result">
                            <i class="fas fa-exclamation-triangle text-warning" style="font-size: 32px; margin-bottom: 10px;"></i>
                            <h3 class="text-warning">Verification Error</h3>
                            <p class="text-secondary">Could not connect to the blockchain to verify. Ensure the network is running.</p>
                        </div>
                    `;
                } finally {
                    btn.disabled = false;
                    btn.innerHTML = '<i class="fas fa-search"></i> Verify';
                }
            }
        }, 100);

        return html;
    }
};
