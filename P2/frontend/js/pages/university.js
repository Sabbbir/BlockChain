import contractService from '../contract.js';
import { showToast, formatAddress, formatDate, simulateIPFSUpload } from '../utils/helpers.js';

export default {
    async render() {
        // Check role
        const isUni = await contractService.isUniversity();
        const address = contractService.userAddress;

        // Not connected
        if (!address) {
            return `
                <div class="animate-in">
                    <div class="empty-state">
                        <i class="fas fa-wallet empty-icon"></i>
                        <h3 class="empty-title">Wallet Not Connected</h3>
                        <p class="empty-text">Please connect your MetaMask wallet to access the University Portal.</p>
                    </div>
                </div>
            `;
        }

        // Connected but not a registered university
        if (!isUni) {
            return `
                <div class="animate-in">
                    <div class="empty-state">
                        <i class="fas fa-exclamation-triangle empty-icon" style="color: var(--accent-warning);"></i>
                        <h3 class="empty-title">Not a Registered University</h3>
                        <p class="empty-text">The connected wallet <strong class="font-mono text-accent">${formatAddress(address)}</strong> is not registered as an active university. Ask the admin to register your wallet.</p>
                    </div>
                </div>
            `;
        }

        // Fetch university data
        const uniInfo = await contractService.getUniversityByAddress(address);
        const myStudents = await contractService.getStudentsByUniversity(address);
        const myCerts = await contractService.getCertificatesByUniversity(address);

        const activeCerts = myCerts.filter(c => c.isValid && !c.isRevoked).length;
        const revokedCerts = myCerts.filter(c => c.isRevoked).length;

        let html = `
            <div class="animate-in">
                <!-- University Identity Header -->
                <div class="identity-header">
                    <div class="identity-avatar uni-avatar">
                        <i class="fas fa-university"></i>
                    </div>
                    <div class="identity-info">
                        <h2 class="identity-name">${uniInfo.name}</h2>
                        <div class="identity-meta">
                            <span class="identity-meta-item">
                                <i class="fas fa-globe"></i> ${uniInfo.country}
                            </span>
                            <span class="identity-meta-item">
                                <i class="fas fa-wallet"></i>
                                <span class="font-mono">${formatAddress(address)}</span>
                            </span>
                            <span class="identity-meta-item">
                                <i class="fas fa-calendar"></i> Registered ${formatDate(uniInfo.registeredAt)}
                            </span>
                        </div>
                    </div>
                    <span class="badge ${uniInfo.isActive ? 'badge-success' : 'badge-danger'}">
                        <span class="status-dot ${uniInfo.isActive ? 'active' : 'inactive'}"></span>
                        ${uniInfo.isActive ? 'Active' : 'Inactive'}
                    </span>
                </div>

                <!-- Stats -->
                <div class="stat-grid">
                    <div class="stat-card">
                        <div class="stat-icon" style="color: var(--accent-info);"><i class="fas fa-user-graduate"></i></div>
                        <div class="stat-value">${myStudents.length}</div>
                        <div class="stat-label">My Students</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon" style="color: var(--accent-success);"><i class="fas fa-certificate"></i></div>
                        <div class="stat-value">${myCerts.length}</div>
                        <div class="stat-label">Certificates Issued</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon" style="color: var(--accent-1);"><i class="fas fa-check-circle"></i></div>
                        <div class="stat-value">${activeCerts}</div>
                        <div class="stat-label">Active Certificates</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon" style="color: var(--accent-danger);"><i class="fas fa-ban"></i></div>
                        <div class="stat-value">${revokedCerts}</div>
                        <div class="stat-label">Revoked</div>
                    </div>
                </div>

                <!-- Tabs -->
                <div class="tabs" id="uniTabs">
                    <button class="tab active" data-target="tab-students">My Students</button>
                    <button class="tab" data-target="tab-certs">My Certificates</button>
                    <button class="tab" data-target="tab-register-student">Register Student</button>
                    <button class="tab" data-target="tab-issue-cert">Issue Certificate</button>
                </div>

                <!-- My Students Tab -->
                <div id="tab-students" class="tab-content">
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">Students Registered by ${uniInfo.name}</h3>
                            <span class="badge badge-info">${myStudents.length} total</span>
                        </div>
                        <div class="card-body" style="padding: 0;">
                            ${myStudents.length === 0 ? `
                                <div class="empty-state" style="padding: 40px 20px;">
                                    <i class="fas fa-user-graduate empty-icon"></i>
                                    <h3 class="empty-title">No Students Yet</h3>
                                    <p class="empty-text">Register your first student using the "Register Student" tab.</p>
                                </div>
                            ` : `
                                <div class="table-container">
                                    <table class="data-table">
                                        <thead>
                                            <tr>
                                                <th>Student ID</th>
                                                <th>Name</th>
                                                <th>Email</th>
                                                <th>Registered</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${myStudents.map(s => `
                                                <tr>
                                                    <td class="font-mono text-accent">${s.studentId}</td>
                                                    <td style="font-weight: 600;">${s.name}</td>
                                                    <td>${s.email}</td>
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

                <!-- My Certificates Tab -->
                <div id="tab-certs" class="tab-content" style="display: none;">
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">Certificates Issued by ${uniInfo.name}</h3>
                            <span class="badge badge-info">${myCerts.length} total</span>
                        </div>
                        <div class="card-body" style="padding: 0;">
                            ${myCerts.length === 0 ? `
                                <div class="empty-state" style="padding: 40px 20px;">
                                    <i class="fas fa-certificate empty-icon"></i>
                                    <h3 class="empty-title">No Certificates Yet</h3>
                                    <p class="empty-text">Issue your first certificate using the "Issue Certificate" tab.</p>
                                </div>
                            ` : `
                                <div class="table-container">
                                    <table class="data-table">
                                        <thead>
                                            <tr>
                                                <th>Certificate ID</th>
                                                <th>Student ID</th>
                                                <th>Course</th>
                                                <th>Grade</th>
                                                <th>Issued</th>
                                                <th>Status</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${myCerts.map(c => `
                                                <tr>
                                                    <td class="font-mono text-accent">${c.certificateId}</td>
                                                    <td class="font-mono">${c.studentId}</td>
                                                    <td style="font-weight: 600;">${c.courseName}</td>
                                                    <td>${c.grade}</td>
                                                    <td>${formatDate(c.issuedAt)}</td>
                                                    <td>
                                                        ${c.isRevoked
                                                            ? '<span class="badge badge-danger"><span class="status-dot inactive"></span> Revoked</span>'
                                                            : '<span class="badge badge-success"><span class="status-dot active"></span> Valid</span>'
                                                        }
                                                    </td>
                                                    <td>
                                                        ${!c.isRevoked ? `
                                                            <button class="btn btn-outline btn-sm btn-revoke-cert" data-cert-id="${c.certificateId}">
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

                <!-- Register Student Tab -->
                <div id="tab-register-student" class="tab-content" style="display: none;">
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">Register New Student</h3>
                        </div>
                        <div class="card-body">
                            <form id="studentForm">
                                <div class="form-group">
                                    <label class="form-label">Student ID (Unique)</label>
                                    <input type="text" class="form-input" id="studentId" required placeholder="STU-001">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Full Name</label>
                                    <input type="text" class="form-input" id="studentName" required placeholder="John Doe">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Email Address</label>
                                    <input type="email" class="form-input" id="studentEmail" required placeholder="john@example.com">
                                </div>
                                <button type="submit" class="btn btn-success w-full" id="btnRegisterStudent">
                                    <i class="fas fa-user-plus"></i> Register Student
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

                <!-- Issue Certificate Tab -->
                <div id="tab-issue-cert" class="tab-content" style="display: none;">
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">Issue New Digital Certificate</h3>
                        </div>
                        <div class="card-body">
                            <form id="issueForm">
                                <div class="form-row">
                                    <div class="form-group">
                                        <label class="form-label">Certificate ID (Unique)</label>
                                        <input type="text" class="form-input" id="certId" required placeholder="CERT-2026-001">
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label">Student ID</label>
                                        <input type="text" class="form-input" id="issueStudentId" required placeholder="STU-001">
                                    </div>
                                </div>
                                <div class="form-row">
                                    <div class="form-group">
                                        <label class="form-label">Course / Degree Name</label>
                                        <input type="text" class="form-input" id="course" required placeholder="B.Sc. in Computer Science">
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label">Grade / Classification</label>
                                        <input type="text" class="form-input" id="grade" required placeholder="First Class">
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Certificate Document (PDF/Image)</label>
                                    <div style="border: 2px dashed var(--border-color); padding: 30px; text-align: center; border-radius: var(--radius-sm); background: var(--bg-glass);">
                                        <i class="fas fa-cloud-upload-alt" style="font-size: 32px; color: var(--accent-3); margin-bottom: 12px;"></i>
                                        <p style="font-size: 14px; margin-bottom: 8px;">Select a file to upload to IPFS (Simulated)</p>
                                        <input type="file" id="certFile" required style="max-width: 250px; margin: 0 auto; display: block;">
                                    </div>
                                </div>
                                <button type="submit" class="btn btn-primary w-full" id="btnIssue">
                                    <i class="fas fa-file-signature"></i> Issue Secure Certificate
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;

        setTimeout(() => {
            // Tab switching logic
            const tabs = document.querySelectorAll('#uniTabs .tab');
            const contents = document.querySelectorAll('.tab-content');
            
            tabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    tabs.forEach(t => t.classList.remove('active'));
                    contents.forEach(c => c.style.display = 'none');
                    tab.classList.add('active');
                    document.getElementById(tab.dataset.target).style.display = 'block';
                });
            });

            // Student Registration Form
            const formStudent = document.getElementById('studentForm');
            const btnStudent = document.getElementById('btnRegisterStudent');
            
            if(formStudent) {
                formStudent.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    if(!contractService.userAddress) return showToast('Connect wallet first', 'warning');
                    
                    const id = document.getElementById('studentId').value;
                    const name = document.getElementById('studentName').value;
                    const email = document.getElementById('studentEmail').value;
                    
                    btnStudent.disabled = true;
                    btnStudent.innerHTML = '<div class="spinner" style="width:16px;height:16px;border-width:2px;"></div> Registering...';
                    
                    try {
                        await contractService.registerStudent(id, name, email);
                        formStudent.reset();
                        // Reload to show new student in table
                        setTimeout(() => window.location.reload(), 500);
                    } finally {
                        btnStudent.disabled = false;
                        btnStudent.innerHTML = '<i class="fas fa-user-plus"></i> Register Student';
                    }
                });
            }

            // Issue Certificate Form
            const formIssue = document.getElementById('issueForm');
            const btnIssue = document.getElementById('btnIssue');
            const fileInput = document.getElementById('certFile');
            
            if(formIssue) {
                formIssue.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    if(!contractService.userAddress) return showToast('Connect wallet first', 'warning');
                    
                    const certId = document.getElementById('certId').value;
                    const studentId = document.getElementById('issueStudentId').value;
                    const course = document.getElementById('course').value;
                    const grade = document.getElementById('grade').value;
                    
                    if(!fileInput.files[0]) {
                        return showToast('Please select a certificate file', 'error');
                    }

                    btnIssue.disabled = true;
                    btnIssue.innerHTML = 'Processing...';

                    try {
                        // 1. Simulate IPFS Upload
                        const ipfsHash = await simulateIPFSUpload(fileInput.files[0]);
                        
                        // 2. Issue on Blockchain
                        btnIssue.innerHTML = 'Signing Transaction...';
                        await contractService.issueCertificate(certId, studentId, course, grade, ipfsHash);
                        
                        formIssue.reset();
                        
                        // Show success and offer to jump to QR
                        setTimeout(() => {
                            if(confirm(`Certificate Issued Successfully!\nDo you want to generate a QR code for ${certId}?`)) {
                                window.location.hash = `#/qr?id=${encodeURIComponent(certId)}`;
                            } else {
                                window.location.reload();
                            }
                        }, 500);

                    } catch (err) {
                        // Error handled in contract service
                    } finally {
                        btnIssue.disabled = false;
                        btnIssue.innerHTML = '<i class="fas fa-file-signature"></i> Issue Secure Certificate';
                    }
                });
            }

            // Revoke buttons in certificate table
            document.querySelectorAll('.btn-revoke-cert').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const certId = btn.dataset.certId;
                    if(!confirm(`Are you sure you want to revoke certificate ${certId}? This action cannot be undone.`)) return;
                    
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
