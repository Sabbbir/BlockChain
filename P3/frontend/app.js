let provider;
let signer;
let contract;
let userAddress;
let isAdmin = false;
let isRegistered = false;

// Navigation
function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');
    document.getElementById(tabId).style.display = 'block';
    
    document.querySelectorAll('.nav-links li').forEach(el => el.classList.remove('active'));
    const activeLink = document.querySelector(`.nav-links li[data-tab="${tabId}"]`);
    if(activeLink) activeLink.classList.add('active');

    if(tabId === 'history' && userAddress && isRegistered && !isAdmin) {
        loadHistory();
    }
    if(tabId === 'admin' && isAdmin) {
        loadAdminStats();
    }
}

// Modal Utility
function showModal(title, message, showClose = false) {
    const modal = document.getElementById('modal');
    modal.style.display = 'flex';
    // Small timeout to allow display: flex to apply before opacity transition
    setTimeout(() => modal.classList.add('show'), 10);
    
    document.getElementById('modal-title').innerText = title;
    document.getElementById('modal-message').innerText = message;
    document.getElementById('modal-close').style.display = showClose ? 'inline-block' : 'none';
}

function hideModal() {
    const modal = document.getElementById('modal');
    modal.classList.remove('show');
    setTimeout(() => modal.style.display = 'none', 300);
}

document.getElementById('modal-close').addEventListener('click', hideModal);

// Initialization
async function init() {
    if (typeof window.ethereum !== 'undefined') {
        document.getElementById('connect-btn').addEventListener('click', connectWallet);
        
        // Handle account changes
        window.ethereum.on('accountsChanged', function (accounts) {
            window.location.reload();
        });

        // Handle chain changes
        window.ethereum.on('chainChanged', function (chainId) {
            window.location.reload();
        });

        // Attempt Auto-Connect
        try {
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            if (accounts.length > 0) {
                // User is already connected and unlocked
                await connectWallet();
            }
        } catch (err) {
            console.log("Auto-connect failed or ignored", err);
        }
    } else {
        alert("Please install MetaMask to use this application.");
    }

    document.getElementById('reg-btn').addEventListener('click', register);
    document.getElementById('deposit-btn').addEventListener('click', deposit);
    document.getElementById('withdraw-btn').addEventListener('click', withdraw);
    document.getElementById('transfer-btn').addEventListener('click', transfer);
    document.getElementById('refresh-admin').addEventListener('click', loadAdminStats);
    
    // Add click listeners to nav items
    document.querySelectorAll('.nav-links li').forEach(li => {
        li.addEventListener('click', (e) => {
            const tab = e.currentTarget.getAttribute('data-tab');
            if(tab) showTab(tab);
        });
    });
}

async function connectWallet() {
    try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        provider = new ethers.BrowserProvider(window.ethereum);
        
        // Network Check
        const network = await provider.getNetwork();
        if (network.chainId !== 1337n && network.chainId !== 31337n) {
            showModal("Network Error", "Please connect to the Hardhat Localhost network (Chain ID 1337 or 31337) in MetaMask. If you get a 'nonce too high' error later, go to MetaMask Settings -> Advanced -> Clear activity tab data.", true);
            return;
        }

        signer = await provider.getSigner();
        userAddress = await signer.getAddress();
        
        contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        
        document.getElementById('user-address').innerText = userAddress.substring(0, 6) + "..." + userAddress.substring(38);
        document.getElementById('connect-btn').style.display = 'none';

        await checkUserStatus();
    } catch (error) {
        console.error("Connection error:", error);
    }
}

async function checkUserStatus() {
    try {
        const adminAddress = await contract.admin();
        
        // Setup UI base on role
        document.getElementById('app-content').style.display = 'flex';
        document.getElementById('welcome-overlay').style.display = 'none';
        
        if (adminAddress.toLowerCase() === userAddress.toLowerCase()) {
            isAdmin = true;
            document.querySelectorAll('.customer-only').forEach(el => el.style.display = 'none');
            document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'block');
            document.getElementById('role-badge').innerText = "Administrator";
            document.getElementById('role-badge').className = "role-badge badge-admin";
            showTab('admin');
        } else {
            isAdmin = false;
            document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'none');
            document.getElementById('role-badge').innerText = "Customer";
            document.getElementById('role-badge').className = "role-badge badge-customer";

            const customer = await contract.customers(userAddress);
            if (!customer.isRegistered) {
                isRegistered = false;
                document.querySelectorAll('.customer-only').forEach(el => el.style.display = 'none');
                document.getElementById('registration-section').style.display = 'flex';
                showTab('registration-section');
            } else {
                isRegistered = true;
                document.querySelectorAll('.customer-only').forEach(el => el.style.display = 'block');
                document.getElementById('registration-section').style.display = 'none';
                document.getElementById('user-name-display').innerText = customer.name;
                updateBalance();
                showTab('dashboard');
            }
        }
    } catch (error) {
        console.error("Error checking user status:", error);
        showModal("Contract Error", "Could not connect to the contract. Is the Hardhat node running and is the contract address correct in config.js?", true);
    }
}

async function updateBalance() {
    if(!contract) return;
    try {
        const balanceWei = await contract.getBalance();
        const balanceEth = ethers.formatEther(balanceWei);
        document.getElementById('account-balance').innerText = `${parseFloat(balanceEth).toFixed(4)}`;
    } catch (error) {
        console.error("Error fetching balance:", error);
    }
}

// Interactions
async function register() {
    const name = document.getElementById('reg-name').value;
    if (!name) return alert("Enter a name");
    
    try {
        showModal("Processing...", "Sending registration transaction...");
        const tx = await contract.registerCustomer(name);
        await tx.wait();
        showModal("Success", "Registered successfully!", true);
        checkUserStatus();
    } catch(error) {
        console.error(error);
        const errorMsg = error.reason || error.message || "Registration failed.";
        showModal("Error", `${errorMsg} (If you have 0 ETH, you cannot pay for gas. Send ETH from your admin account via MetaMask first!)`, true);
    }
}

async function deposit() {
    const amount = document.getElementById('deposit-amount').value;
    if (!amount || amount <= 0) return alert("Enter valid amount");

    try {
        showModal("Processing...", "Sending deposit transaction...");
        const tx = await contract.deposit({ value: ethers.parseEther(amount) });
        await tx.wait();
        showModal("Success", "Deposit successful!", true);
        document.getElementById('deposit-amount').value = '';
        updateBalance();
    } catch(error) {
        console.error(error);
        showModal("Error", "Deposit failed. Check your balance and network.", true);
    }
}

async function withdraw() {
    const amount = document.getElementById('withdraw-amount').value;
    if (!amount || amount <= 0) return alert("Enter valid amount");

    try {
        showModal("Processing...", "Sending withdrawal transaction...");
        const tx = await contract.withdraw(ethers.parseEther(amount));
        await tx.wait();
        showModal("Success", "Withdrawal successful!", true);
        document.getElementById('withdraw-amount').value = '';
        updateBalance();
    } catch(error) {
        console.error(error);
        showModal("Error", "Withdrawal failed. Check your balance.", true);
    }
}

async function transfer() {
    const to = document.getElementById('transfer-to').value;
    const amount = document.getElementById('transfer-amount').value;
    if (!to || !amount) return alert("Enter recipient and amount");

    try {
        showModal("Processing...", "Sending transfer transaction...");
        const tx = await contract.transfer(to, ethers.parseEther(amount));
        await tx.wait();
        showModal("Success", "Transfer successful!", true);
        document.getElementById('transfer-to').value = '';
        document.getElementById('transfer-amount').value = '';
        updateBalance();
    } catch(error) {
        console.error(error);
        showModal("Error", "Transfer failed.", true);
    }
}

async function loadHistory() {
    try {
        const txs = await contract.getMyTransactions();
        const tbody = document.getElementById('tx-history-body');
        tbody.innerHTML = '';

        const typeMap = ["Deposit", "Withdrawal", "Transfer In", "Transfer Out"];
        const typeClassMap = ["tx-type-deposit", "tx-type-withdraw", "tx-type-deposit", "tx-type-withdraw"];
        const iconMap = ["↓", "↑", "↓", "↑"];

        if(txs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 2rem; color: var(--text-muted)">No transactions yet.</td></tr>';
            return;
        }

        [...txs].reverse().forEach(tx => {
            const tr = document.createElement('tr');
            
            const date = new Date(Number(tx[4]) * 1000).toLocaleString();
            const amount = ethers.formatEther(tx[3]);
            const txType = Number(tx[2]);

            tr.innerHTML = `
                <td>
                    <div class="tx-type-cell">
                        <span class="tx-icon ${typeClassMap[txType]}">${iconMap[txType]}</span>
                        <strong class="${typeClassMap[txType]}">${typeMap[txType]}</strong>
                    </div>
                </td>
                <td class="tx-amount">${amount} ETH</td>
                <td class="tx-date">${date}</td>
                <td class="tx-party">${tx[5] === ethers.ZeroAddress ? '-' : tx[5].substring(0,8)+'...' + tx[5].substring(38)}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch(error) {
        console.error("Error loading history:", error);
    }
}

async function loadAdminStats() {
    if(!contract || !isAdmin) return;
    try {
        const customers = await contract.getAllCustomers();
        const contractBalance = await contract.getContractBalance();
        const transactions = await contract.getAllTransactions();

        document.getElementById('total-users-count').innerText = customers.length;
        document.getElementById('total-contract-balance').innerText = `${parseFloat(ethers.formatEther(contractBalance)).toFixed(4)}`;
        document.getElementById('total-transactions-count').innerText = transactions.length;
        
        // Load All Transactions for Admin
        const tbody = document.getElementById('admin-tx-history-body');
        tbody.innerHTML = '';
        
        const typeMap = ["Deposit", "Withdrawal", "Transfer In", "Transfer Out"];
        const typeClassMap = ["tx-type-deposit", "tx-type-withdraw", "tx-type-deposit", "tx-type-withdraw"];
        
        if(transactions.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 2rem; color: var(--text-muted)">No transactions recorded in the system.</td></tr>';
            return;
        }

        [...transactions].reverse().forEach(tx => {
            const tr = document.createElement('tr');
            const date = new Date(Number(tx[4]) * 1000).toLocaleString();
            const amount = ethers.formatEther(tx[3]);
            const txType = Number(tx[2]);

            tr.innerHTML = `
                <td>${tx[1].substring(0,6)}...${tx[1].substring(38)}</td>
                <td class="${typeClassMap[txType]}">${typeMap[txType]}</td>
                <td class="tx-amount">${amount} ETH</td>
                <td class="tx-date">${date}</td>
                <td class="tx-party">${tx[5] === ethers.ZeroAddress ? '-' : tx[5].substring(0,6)+'...'}</td>
            `;
            tbody.appendChild(tr);
        });

    } catch(error) {
        console.error("Error loading admin stats:", error);
    }
}

window.addEventListener('load', init);
