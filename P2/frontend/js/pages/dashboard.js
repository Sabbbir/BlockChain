import contractService from '../contract.js';
import { formatDate, formatAddress } from '../utils/helpers.js';

export default {
    async render() {
        // Fetch stats
        const stats = await contractService.getStats();
        
        // Fetch recent certificates (simulated by getting all and slicing)
        const allCerts = await contractService.getAllCertificates();
        const recentCerts = allCerts.slice(-5).reverse(); // Last 5

        let html = `
            <div class="animate-in">
                <!-- Stats Grid -->
                <div class="stat-grid">
                    <div class="stat-card">
                        <div class="stat-icon" style="color: var(--accent-1);"><i class="fas fa-university"></i></div>
                        <div class="stat-value">${stats.universities}</div>
                        <div class="stat-label">Registered Universities</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon" style="color: var(--accent-info);"><i class="fas fa-user-graduate"></i></div>
                        <div class="stat-value">${stats.students}</div>
                        <div class="stat-label">Registered Students</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon" style="color: var(--accent-success);"><i class="fas fa-certificate"></i></div>
                        <div class="stat-value">${stats.certificates}</div>
                        <div class="stat-label">Certificates Issued</div>
                    </div>
                </div>

                <!-- Main Grid -->
                <div class="grid-2">
                    <!-- Recent Activity -->
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">Recent Issuances</h3>
                        </div>
                        <div class="card-body">
                            ${recentCerts.length === 0 ? `
                                <div class="empty-state" style="padding: 30px 10px;">
                                    <i class="fas fa-history empty-icon"></i>
                                    <h3 class="empty-title">No Activity Yet</h3>
                                    <p class="empty-text">Certificates will appear here once issued.</p>
                                </div>
                            ` : `
                                <ul class="activity-list">
                                    ${recentCerts.map(cert => `
                                        <li class="activity-item">
                                            <div class="activity-icon ${cert.isValid ? 'issue' : 'revoke'}">
                                                <i class="fas ${cert.isValid ? 'fa-medal' : 'fa-ban'}"></i>
                                            </div>
                                            <div>
                                                <div class="activity-text">
                                                    Certificate <strong>${cert.certificateId}</strong> was ${cert.isValid ? 'issued' : 'revoked'}
                                                </div>
                                                <div class="activity-time">${formatDate(cert.issuedAt)}</div>
                                            </div>
                                        </li>
                                    `).join('')}
                                </ul>
                            `}
                        </div>
                    </div>

                    <!-- Quick Actions & Info -->
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">System Status</h3>
                        </div>
                        <div class="card-body">
                            <div style="margin-bottom: 24px;">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                                    <span class="text-secondary">Network</span>
                                    <span class="badge badge-success">Local Hardhat</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                                    <span class="text-secondary">Contract Status</span>
                                    <span class="badge ${contractService.contractConfig ? 'badge-success' : 'badge-danger'}">
                                        ${contractService.contractConfig ? 'Deployed & Active' : 'Not Deployed'}
                                    </span>
                                </div>
                                ${contractService.contractConfig ? `
                                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                                        <span class="text-secondary">Contract Address</span>
                                        <span class="font-mono text-accent">${formatAddress(contractService.contractConfig.address)}</span>
                                    </div>
                                ` : ''}
                            </div>
                            
                            <h4 style="font-size: 14px; margin-bottom: 12px; color: var(--text-muted);">Quick Actions</h4>
                            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                                <a href="#/verify" class="btn btn-outline">
                                    <i class="fas fa-search"></i> Verify Now
                                </a>
                                <a href="#/admin" class="btn btn-outline">
                                    <i class="fas fa-plus"></i> Add University
                                </a>
                                <a href="#/university" class="btn btn-outline">
                                    <i class="fas fa-file-signature"></i> Issue Certificate
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        return html;
    }
};
