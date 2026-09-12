import contractService from '../contract.js';
import { formatAddress, formatDate, showToast } from '../utils/helpers.js';

export default {
    async render() {
        // Fetch all data
        const address = contractService.userAddress;
        const adminAddr = await contractService.getAdminAddress();
        const isAdmin = await contractService.isAdmin();
        const unis = await contractService.getAllUniversities();
        const stats = await contractService.getStats();
        const allStudents = await contractService.getAllStudents();
        const allCerts = await contractService.getAllCertificates();

        // Enrich university data with counts
        const uniStudentCounts = {};
        const uniCertCounts = {};
        for (const u of unis) {
            const students = allStudents.filter(s => s.universityAddress.toLowerCase() === u.address.toLowerCase());
            const certs = allCerts.filter(c => c.issuedBy.toLowerCase() === u.address.toLowerCase());
            uniStudentCounts[u.address] = students.length;
            uniCertCounts[u.address] = certs.length;
        }

        // Build a university name lookup
        const uniNameMap = {};
        unis.forEach(u => { uniNameMap[u.address.toLowerCase()] = u.name; });

        const activeUnis = unis.filter(u => u.isActive).length;
        const inactiveUnis = unis.filter(u => !u.isActive).length;
        const validCerts = allCerts.filter(c => c.isValid).length;
        const revokedCerts = allCerts.filter(c => !c.isValid).length;

        let html = `
            <div class="animate-in">
                <!-- Admin Identity Header -->
                <div class="identity-header">
                    <div class="identity-avatar admin-avatar">
                        <i class="fas fa-shield-alt"></i>
                    </div>
                    <div class="identity-info">
                        <h2 class="identity-name">System Administrator</h2>
                        <div class="identity-meta">
                            <span class="identity-meta-item">
                                <i class="fas fa-wallet"></i>
                                <span class="font-mono">${adminAddr ? formatAddress(adminAddr) : 'Unknown'}</span>
                            </span>
                            <span class="identity-meta-item">
                                <i class="fas fa-link"></i>
                                Contract: <span class="font-mono">${contractService.contractConfig ? formatAddress(contractService.contractConfig.address) : 'N/A'}</span>
                            </span>
                            <span class="identity-meta-item">
                                <i class="fas fa-network-wired"></i> Hardhat Local
                            </span>
                        </div>
                    </div>
                    ${isAdmin
                        ? '<span class="badge badge-success"><span class="status-dot active"></span> You are Admin</span>'
                        : `<span class="badge badge-warning"><span class="status-dot inactive"></span> Not Admin</span>`
                    }
                </div>

                <!-- Stats Overview -->
                <div class="stat-grid">
                    <div class="stat-card">
                        <div class="stat-icon" style="color: var(--accent-1);"><i class="fas fa-university"></i></div>
                        <div class="stat-value">${stats.universities}</div>
                        <div class="stat-label">Universities (${activeUnis} active)</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon" style="color: var(--accent-info);"><i class="fas fa-user-graduate"></i></div>
                        <div class="stat-value">${stats.students}</div>
                        <div class="stat-label">Total Students</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon" style="color: var(--accent-success);"><i class="fas fa-certificate"></i></div>
                        <div class="stat-value">${stats.certificates}</div>
                        <div class="stat-label">Total Certificates</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon" style="color: var(--accent-danger);"><i class="fas fa-ban"></i></div>
                        <div class="stat-value">${revokedCerts}</div>
                        <div class="stat-label">Revoked Certificates</div>
                    </div>
                </div>

                <!-- Tabs -->
                <div class="tabs" id="adminTabs">
                    <button class="tab active" data-target="tab-universities">Universities</button>
                    <button class="tab" data-target="tab-students">All Students</button>
                    <button class="tab" data-target="tab-certificates">All Certificates</button>
                    <button class="tab" data-target="tab-manage">Management</button>
                </div>

                <!-- Universities Tab -->
                <div id="tab-universities" class="tab-content">
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">Registered Universities</h3>
                            <div style="display: flex; gap: 8px; align-items: center;">
                                <span class="badge badge-success">${activeUnis} Active</span>
                                ${inactiveUnis > 0 ? `<span class="badge badge-danger">${inactiveUnis} Inactive</span>` : ''}
                            </div>
                        </div>
                        <div class="card-body" style="padding: 0;">
                            ${unis.length === 0 ? `
                                <div class="empty-state">
                                    <i class="fas fa-university empty-icon"></i>
                                    <h3 class="empty-title">No Universities Registered</h3>
                                    <p class="empty-text">Go to the Management tab to register your first university.</p>
                                </div>
                            ` : `
                                <div class="table-container">
                                    <table class="data-table">
                                        <thead>
                                            <tr>
                                                <th>Name</th>
                                                <th>Country</th>
                                                <th>Wallet Address</th>
                                                <th>Students</th>
                                                <th>Certificates</th>
                                                <th>Registered</th>
                                                <th>Status</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${unis.map(u => `
                                                <tr>
                                                    <td style="font-weight: 600;">${u.name}</td>
                                                    <td>${u.country}</td>
                                                    <td class="font-mono text-accent">${formatAddress(u.address)}</td>
                                                    <td><span class="badge badge-info">${uniStudentCounts[u.address] || 0}</span></td>
                                                    <td><span class="badge badge-success">${uniCertCounts[u.address] || 0}</span></td>
                                                    <td>${formatDate(u.registeredAt)}</td>
                                                    <td>
                                                        <span class="badge ${u.isActive ? 'badge-success' : 'badge-danger'}">
                                                            <span class="status-dot ${u.isActive ? 'active' : 'inactive'}"></span>
                                                            ${u.isActive ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        ${u.isActive ? `
                                                            <button class="btn btn-outline btn-sm btn-deactivate" data-address="${u.address}">
                                                                Deactivate
                                                            </button>
                                                        ` : '<span class="text-muted" style="font-size: 13px;">Deactivated</span>'}
                                                    </td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            `}
                        </div>
                    </div>
                </div>

                <!-- All Students Tab -->
                <div id="tab-students" class="tab-content" style="display: none;">
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">All Registered Students</h3>
                            <span class="badge badge-info">${allStudents.length} total</span>
                        </div>
                        <div class="card-body" style="padding: 0;">
                            ${allStudents.length === 0 ? `
                                <div class="empty-state">
                                    <i class="fas fa-user-graduate empty-icon"></i>
                                    <h3 class="empty-title">No Students Registered</h3>
                                    <p class="empty-text">Students will appear here once universities register them.</p>
                                </div>
                            ` : `
                                <div class="table-container">
                                    <table class="data-table">
                                        <thead>
                                            <tr>
                                                <th>Student ID</th>
                                                <th>Name</th>
                                                <th>Email</th>
                                                <th>University</th>
                                                <th>Registered</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${allStudents.map(s => `
                                                <tr>
                                                    <td class="font-mono text-accent">${s.studentId}</td>
                                                    <td style="font-weight: 600;">${s.name}</td>
                                                    <td>${s.email}</td>
                                                    <td>
                                                        <span style="font-weight: 500;">${uniNameMap[s.universityAddress.toLowerCase()] || formatAddress(s.universityAddress)}</span>
                                                    </td>
                                                    <td>${formatDate(s.registeredAt)}</td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            `}
                        </div>
                    </div>
                </div>

                <!-- All Certificates Tab -->
                <div id="tab-certificates" class="tab-content" style="display: none;">
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">All Certificates</h3>
                            <div style="display: flex; gap: 8px; align-items: center;">
                                <span class="badge badge-success">${validCerts} Valid</span>
                                ${revokedCerts > 0 ? `<span class="badge badge-danger">${revokedCerts} Revoked</span>` : ''}
                            </div>
                        </div>
                        <div class="card-body" style="padding: 0;">
                            ${allCerts.length === 0 ? `
                                <div class="empty-state">
                                    <i class="fas fa-certificate empty-icon"></i>
                                    <h3 class="empty-title">No Certificates Issued</h3>
                                    <p class="empty-text">Certificates will appear here once universities issue them.</p>
                                </div>
                            ` : `
                                <div class="table-container">
                                    <table class="data-table">
                                        <thead>
                                            <tr>
                                                <th>Certificate ID</th>
                                                <th>Student ID</th>
                                                <th>Course</th>
                                                <th>Issued By</th>
                                                <th>Issued</th>
                                                <th>Status</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${allCerts.map(c => `
                                                <tr>
                                                    <td class="font-mono text-accent">${c.certificateId}</td>
                                                    <td class="font-mono">${c.studentId}</td>
                                                    <td style="font-weight: 600;">${c.courseName}</td>
                                                    <td>
                                                        <span style="font-weight: 500;">${uniNameMap[c.issuedBy.toLowerCase()] || formatAddress(c.issuedBy)}</span>
                                                    </td>
                                                    <td>${formatDate(c.issuedAt)}</td>
                                                    <td>
                                                        ${c.isValid
                                                            ? '<span class="badge badge-success"><span class="status-dot active"></span> Valid</span>'
                                                            : '<span class="badge badge-danger"><span class="status-dot inactive"></span> Revoked</span>'
                                                        }
                                                    </td>
                                                    <td>
                                                        ${c.isValid ? `
                                                            <button class="btn btn-outline btn-sm btn-revoke-inline" data-cert-id="${c.certificateId}">
                                                                <i class="fas fa-ban"></i> Revoke
                                                            </button>
                                                        ` : '<span class="text-muted" style="font-size: 13px;">—</span>'}
                                                    </td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            `}
                        </div>
                    </div>
                </div>

                <!-- Management Tab -->
                <div id="tab-manage" class="tab-content" style="display: none;">
                    <div class="grid-2">
                        <!-- Register University -->
                        <div class="card">
                            <div class="card-header">
                                <h3 class="card-title"><i class="fas fa-plus-circle" style="color: var(--accent-1); margin-right: 8px;"></i>Register New University</h3>
                            </div>
                            <div class="card-body">
                                <form id="registerUniForm">
                                    <div class="form-group">
                                        <label class="form-label">University Name</label>
                                        <input type="text" class="form-input" id="uniName" required placeholder="e.g. Dhaka University">
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label">Country</label>
                                        <input type="text" class="form-input" id="uniCountry" required placeholder="e.g. Bangladesh">
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label">Wallet Address</label>
                                        <input type="text" class="form-input" id="uniAddress" required placeholder="0x...">
                                        <small class="text-muted" style="display: block; margin-top: 6px; font-size: 12px;">The Ethereum address that will issue certificates for this university.</small>
                                    </div>
                                    <button type="submit" class="btn btn-primary w-full" id="btnRegisterUni">
                                        <i class="fas fa-plus-circle"></i> Register University
                                    </button>
                                </form>
                            </div>
                        </div>

                        <!-- Revoke Certificate -->
                        <div class="card">
                            <div class="card-header">
                                <h3 class="card-title"><i class="fas fa-ban" style="color: var(--accent-danger); margin-right: 8px;"></i>Revoke Certificate</h3>
                            </div>
                            <div class="card-body">
                                <p class="text-secondary mb-4" style="font-size: 14px;">As an admin, you can forcefully revoke any fraudulent certificate. You can also revoke directly from the Certificates tab.</p>
                                <form id="revokeCertForm">
                                    <div class="form-group">
                                        <label class="form-label">Certificate ID</label>
                                        <input type="text" class="form-input" id="revokeCertId" required placeholder="CERT-2026-001">
                                    </div>
                                    <button type="submit" class="btn btn-danger w-full" id="btnRevokeCert">
                                        <i class="fas fa-ban"></i> Revoke Certificate
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Bind events after rendering
        setTimeout(() => {
            // Tab switching
            const tabs = document.querySelectorAll('#adminTabs .tab');
            const contents = document.querySelectorAll('.tab-content');

            tabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    tabs.forEach(t => t.classList.remove('active'));
                    contents.forEach(c => c.style.display = 'none');
                    tab.classList.add('active');
                    document.getElementById(tab.dataset.target).style.display = 'block';
                });
            });

            // Register University Form
            const formUni = document.getElementById('registerUniForm');
            const btnUni = document.getElementById('btnRegisterUni');

            if (formUni) {
                formUni.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    if (!contractService.userAddress) {
                        showToast('Please connect your wallet first', 'warning');
                        return;
                    }

                    const name = document.getElementById('uniName').value;
                    const country = document.getElementById('uniCountry').value;
                    const addr = document.getElementById('uniAddress').value;

                    btnUni.disabled = true;
                    btnUni.innerHTML = '<div class="spinner" style="width:16px;height:16px;border-width:2px;"></div> Registering...';

                    try {
                        await contractService.registerUniversity(addr, name, country);
                        formUni.reset();
                        setTimeout(() => window.location.reload(), 500);
                    } catch (err) {
                        btnUni.disabled = false;
                        btnUni.innerHTML = '<i class="fas fa-plus-circle"></i> Register University';
                    }
                });
            }

            // Revoke Certificate Form
            const formRevoke = document.getElementById('revokeCertForm');
            const btnRevoke = document.getElementById('btnRevokeCert');

            if (formRevoke) {
                formRevoke.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    if (!contractService.userAddress) return showToast('Connect wallet first', 'warning');

                    const id = document.getElementById('revokeCertId').value;
                    if (!confirm(`Are you sure you want to revoke certificate ${id}? This action cannot be undone.`)) return;

                    btnRevoke.disabled = true;
                    btnRevoke.innerHTML = 'Revoking...';

                    try {
                        await contractService.revokeCertificate(id);
                        formRevoke.reset();
                        showToast('Certificate revoked. Refreshing...', 'success');
                        setTimeout(() => window.location.reload(), 500);
                    } finally {
                        btnRevoke.disabled = false;
                        btnRevoke.innerHTML = '<i class="fas fa-ban"></i> Revoke Certificate';
                    }
                });
            }

            // Deactivate university buttons
            document.querySelectorAll('.btn-deactivate').forEach(btn => {
                btn.addEventListener('click', async () => {
                    if (!contractService.userAddress) return showToast('Connect wallet first', 'warning');
                    const addr = btn.dataset.address;
                    if (!confirm('Are you sure you want to deactivate this university? They will no longer be able to issue certificates.')) return;

                    btn.disabled = true;
                    btn.textContent = 'Processing...';

                    try {
                        await contractService.deactivateUniversity(addr);
                        setTimeout(() => window.location.reload(), 500);
                    } catch (err) {
                        btn.disabled = false;
                        btn.textContent = 'Deactivate';
                    }
                });
            });

            // Inline revoke buttons in the certificates tab
            document.querySelectorAll('.btn-revoke-inline').forEach(btn => {
                btn.addEventListener('click', async () => {
                    if (!contractService.userAddress) return showToast('Connect wallet first', 'warning');
                    const certId = btn.dataset.certId;
                    if (!confirm(`Revoke certificate ${certId}? This cannot be undone.`)) return;

                    btn.disabled = true;
                    btn.innerHTML = 'Revoking...';

                    try {
                        await contractService.revokeCertificate(certId);
                        setTimeout(() => window.location.reload(), 500);
                    } catch (err) {
                        btn.disabled = false;
                        btn.innerHTML = '<i class="fas fa-ban"></i> Revoke';
                    }
                });
            });

        }, 100);

        return html;
    }
};
