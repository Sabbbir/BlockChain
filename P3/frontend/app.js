let provider;
let signer;
let contract;
let userAddress;
let isAdmin = false;

// Navigation
function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');
    document.getElementById(tabId).style.display = 'block';
    
    document.querySelectorAll('.nav-links li').forEach(el => el.classList.remove('active'));
    event.currentTarget.classList.add('active');

    if(tabId === 'history' && userAddress) {
        loadHistory();
    }
    if(tabId === 'admin' && isAdmin) {
        loadAdminStats();
    }
}

// Modal Utility
function showModal(title, message, showClose = false) {
    document.getElementById('modal').style.display = 'flex';
    document.getElementById('modal-title').innerText = title;
    document.getElementById('modal-message').innerText = message;
    document.getElementById('modal-close').style.display = showClose ? 'inline-block' : 'none';
}

function hideModal() {
    document.getElementById('modal').style.display = 'none';
}

document.getElementById('modal-close').addEventListener('click', hideModal);

// Initialization
async function init() {
    if (typeof window.ethereum !== 'undefined') {
        document.getElementById('connect-btn').addEventListener('click', connectWallet);
    } else {
        alert("Please install MetaMask to use this application.");
    }

    document.getElementById('reg-btn').addEventListener('click', register);
    document.getElementById('deposit-btn').addEventListener('click', deposit);
    document.getElementById('withdraw-btn').addEventListener('click', withdraw);
    document.getElementById('transfer-btn').addEventListener('click', transfer);
    document.getElementById('refresh-admin').addEventListener('click', loadAdminStats);
}

async function connectWallet() {
    try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        provider = new ethers.BrowserProvider(window.ethereum);
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
        if (adminAddress.toLowerCase() === userAddress.toLowerCase()) {
            isAdmin = true;
            document.getElementById('admin-tab').style.display = 'block';
        }

        const customer = await contract.customers(userAddress);
        if (!customer.isRegistered) {
            document.getElementById('registration-section').style.display = 'block';
            document.getElementById('dashboard').style.display = 'none';
        } else {
            document.getElementById('registration-section').style.display = 'none';
            document.getElementById('dashboard').style.display = 'block';
            updateBalance();
        }
    } catch (error) {
        console.error("Error checking user status:", error);
    }
}

async function updateBalance() {
    if(!contract) return;
    try {
        const balanceWei = await contract.getBalance();
        const balanceEth = ethers.formatEther(balanceWei);
        document.getElementById('account-balance').innerText = `${parseFloat(balanceEth).toFixed(4)} ETH`;
    } catch (error) {
        console.error("Error fetching balance:", error);
    }
}

// Interactions
async function register() {
    const name = document.getElementById('reg-name').value;
    if (!name) return alert("Enter a name");
    
    try {
        showModal("Processing...", "Sending registration transaction.");
        const tx = await contract.registerCustomer(name);
        await tx.wait();
        showModal("Success", "Registered successfully!", true);
        checkUserStatus();
    } catch(error) {
        console.error(error);
        showModal("Error", "Registration failed.", true);
    }
}

async function deposit() {
    const amount = document.getElementById('deposit-amount').value;
    if (!amount || amount <= 0) return alert("Enter valid amount");

    try {
        showModal("Processing...", "Sending deposit transaction.");
        const tx = await contract.deposit({ value: ethers.parseEther(amount) });
        await tx.wait();
        showModal("Success", "Deposit successful!", true);
        document.getElementById('deposit-amount').value = '';
        updateBalance();
    } catch(error) {
        console.error(error);
        showModal("Error", "Deposit failed.", true);
    }
}

async function withdraw() {
    const amount = document.getElementById('withdraw-amount').value;
    if (!amount || amount <= 0) return alert("Enter valid amount");

    try {
        showModal("Processing...", "Sending withdrawal transaction.");
        const tx = await contract.withdraw(ethers.parseEther(amount));
        await tx.wait();
        showModal("Success", "Withdrawal successful!", true);
        document.getElementById('withdraw-amount').value = '';
        updateBalance();
    } catch(error) {
        console.error(error);
        showModal("Error", "Withdrawal failed.", true);
    }
}

async function transfer() {
    const to = document.getElementById('transfer-to').value;
    const amount = document.getElementById('transfer-amount').value;
    if (!to || !amount) return alert("Enter recipient and amount");

    try {
        showModal("Processing...", "Sending transfer transaction.");
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

        // tx is tuple: (uint256 id, address user, uint8 txType, uint256 amount, uint256 timestamp, address relatedParty)
        [...txs].reverse().forEach(tx => {
            const tr = document.createElement('tr');
            
            const date = new Date(Number(tx[4]) * 1000).toLocaleString();
            const amount = ethers.formatEther(tx[3]);
            const txType = Number(tx[2]);

            tr.innerHTML = `
                <td class="${typeClassMap[txType]}"><strong>${typeMap[txType]}</strong></td>
                <td>${amount}</td>
                <td>${date}</td>
                <td>${tx[5] === ethers.ZeroAddress ? 'N/A' : tx[5].substring(0,8)+'...'}</td>
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

        document.getElementById('total-users-count').innerText = customers.length;
        document.getElementById('total-contract-balance').innerText = `${ethers.formatEther(contractBalance)} ETH`;
    } catch(error) {
        console.error("Error loading admin stats:", error);
    }
}

window.addEventListener('load', init);
