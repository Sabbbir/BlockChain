import contractService from './contract.js';
import { formatAddress, showToast } from './utils/helpers.js';

// Import Pages (Dynamically load HTML & Logic)
import dashboardPage from './pages/dashboard.js';
import adminPage from './pages/admin.js';
import universityPage from './pages/university.js';
import verifyPage from './pages/verify.js';
import qrPage from './pages/qrcode.js';
import performancePage from './pages/performance.js';

// DOM Elements
const appContainer = document.getElementById('app');
const navLinks = document.querySelectorAll('.nav-link');
const navAdmin = document.getElementById('navAdmin');
const navUniversity = document.getElementById('navUniversity');
const walletBtn = document.getElementById('walletConnectBtn');
const walletAddressDisplay = document.getElementById('walletAddressDisplay');
const walletDot = document.getElementById('walletDot');
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const sidebar = document.getElementById('sidebar');
const pageTitle = document.getElementById('pageTitle');
const pageSubtitle = document.getElementById('pageSubtitle');

// Page Map
const pages = {
    'dashboard': { render: dashboardPage.render, title: 'Dashboard', subtitle: 'System overview and statistics' },
    'admin': { render: adminPage.render, title: 'Admin Portal', subtitle: 'Manage universities and system settings' },
    'university': { render: universityPage.render, title: 'University Portal', subtitle: 'Register students and issue certificates' },
    'verify': { render: verifyPage.render, title: 'Verify Certificate', subtitle: 'Check authenticity of academic certificates' },
    'qr': { render: qrPage.render, title: 'QR Generator', subtitle: 'Generate verification QR codes' },
    'performance': { render: performancePage.render, title: 'Performance Dashboard', subtitle: 'Blockchain metrics and evaluation' }
};

class App {
    async init() {
        // Hide restricted portals initially
        if (navAdmin) navAdmin.style.display = 'none';
        if (navUniversity) navUniversity.style.display = 'none';

        // Init Contract Service
        const initialized = await contractService.init();
        if (initialized && contractService.userAddress) {
            this.updateWalletUI(contractService.userAddress);
        }

        // Setup Event Listeners
        contractService.onAccountChange = (address) => this.updateWalletUI(address);
        walletBtn.addEventListener('click', () => this.handleWalletConnect());
        
        // Mobile Menu
        mobileMenuBtn.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });

        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768 && !sidebar.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
                sidebar.classList.remove('open');
            }
        });

        // Setup Router
        window.addEventListener('hashchange', () => this.handleRoute());
        this.handleRoute(); // Initial route
        this.updateNavVisibility();
    }

    async handleWalletConnect() {
        if (contractService.userAddress) {
            showToast('Wallet already connected', 'info');
            return;
        }
        
        walletBtn.classList.add('loading');
        try {
            await contractService.connectWallet();
        } finally {
            walletBtn.classList.remove('loading');
        }
    }

    updateWalletUI(address) {
        if (address) {
            walletAddressDisplay.textContent = formatAddress(address);
            walletDot.classList.add('connected');
        } else {
            walletAddressDisplay.textContent = 'Not Connected';
            walletDot.classList.remove('connected');
        }
        this.updateNavVisibility();
    }

    async updateNavVisibility() {
        const isAdmin = await contractService.isAdmin();
        const isUniversity = await contractService.isUniversity();

        if (navAdmin) {
            navAdmin.style.display = isAdmin ? 'flex' : 'none';
        }
        if (navUniversity) {
            navUniversity.style.display = isUniversity ? 'flex' : 'none';
        }

        // If they are on a restricted page and their role changes, redirect them
        const currentHash = window.location.hash || '#/';
        if (currentHash.startsWith('#/admin') && !isAdmin) {
            window.location.hash = '#/';
        } else if (currentHash.startsWith('#/university') && !isUniversity) {
            window.location.hash = '#/';
        }
    }

    handleRoute() {
        // Parse hash, e.g., #/verify?id=123
        const hash = window.location.hash || '#/';
        const pathMatch = hash.match(/^#\/([a-zA-Z0-9_-]*)/);
        let route = pathMatch ? pathMatch[1] : '';
        if (route === '') route = 'dashboard';

        // Get query params
        const queryParams = new URLSearchParams(hash.split('?')[1] || '');
        const params = Object.fromEntries(queryParams.entries());

        if (pages[route]) {
            this.renderPage(route, params);
        } else {
            this.renderPage('dashboard');
            window.location.hash = '#/';
        }
    }

    async renderPage(routeName, params = {}) {
        const page = pages[routeName];
        
        // Update header
        pageTitle.textContent = page.title;
        pageSubtitle.textContent = page.subtitle;

        // Update active nav link
        navLinks.forEach(link => {
            if (link.dataset.page === routeName) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });

        // Close mobile sidebar if open
        if (window.innerWidth <= 768) {
            sidebar.classList.remove('open');
        }

        // Add fade out animation
        appContainer.style.opacity = '0.5';
        
        // Render new content
        try {
            const html = await page.render(params);
            appContainer.innerHTML = html;
        } catch (error) {
            console.error(`Error rendering page ${routeName}:`, error);
            appContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle empty-icon text-danger"></i>
                    <h3 class="empty-title">Error Loading Page</h3>
                    <p class="empty-text">There was a problem loading this view. Please try again.</p>
                </div>
            `;
        }

        // Fade in
        appContainer.style.opacity = '1';
    }
}

// Start app
const app = new App();
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
