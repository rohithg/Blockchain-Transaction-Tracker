// Note: This demo uses a public Ethereum node. In production, use your own Infura/Alchemy key
const INFURA_URL = 'https://mainnet.infura.io/v3/your-api-key-here'; // Replace with your key

let web3;
let blockChart;
let blockData = [];

async function init() {
    try {
        // Try to use MetaMask if available, otherwise use Infura
        if (typeof window.ethereum !== 'undefined') {
            web3 = new Web3(window.ethereum);
            document.getElementById('status').textContent = 'Connected via MetaMask';
        } else {
            // For demo purposes, we'll show how to set this up
            document.getElementById('status').textContent = 'Install MetaMask or add Infura key';
            document.getElementById('status').classList.add('connected');
            
            // Demo mode with mock data
            startDemoMode();
            return;
        }
        
        document.getElementById('status').classList.add('connected');
        
        // Subscribe to new blocks
        subscribeToBlocks();
        
        // Get initial stats
        updateStats();
        
        // Initialize chart
        initChart();
        
    } catch (error) {
        console.error('Initialization error:', error);
        document.getElementById('status').textContent = 'Connection Error';
    }
}

async function subscribeToBlocks() {
    if (!web3) return;
    
    // Poll for new blocks
    setInterval(async () => {
        try {
            const blockNumber = await web3.eth.getBlockNumber();
            const block = await web3.eth.getBlock(blockNumber);
            updateBlockInfo(block);
            updateChart(block);
        } catch (error) {
            console.error('Block fetch error:', error);
        }
    }, 15000); // Every 15 seconds
}

function updateBlockInfo(block) {
    document.getElementById('blockNumber').textContent = block.number.toLocaleString();
    document.getElementById('txCount').textContent = block.transactions.length;
    document.getElementById('gasUsed').textContent = (block.gasUsed / 1000000).toFixed(2) + 'M';
    
    // Show recent transactions
    showRecentTransactions(block);
}

async function updateStats() {
    if (!web3) return;
    
    try {
        const gasPrice = await web3.eth.getGasPrice();
        const gasPriceGwei = web3.utils.fromWei(gasPrice, 'gwei');
        document.getElementById('gasPrice').textContent = parseFloat(gasPriceGwei).toFixed(2) + ' Gwei';
        
        const block = await web3.eth.getBlock('latest');
        document.getElementById('difficulty').textContent = (block.difficulty / 1e12).toFixed(2) + 'T';
    } catch (error) {
        console.error('Stats error:', error);
    }
}

async function checkBalance() {
    const address = document.getElementById('addressInput').value;
    const resultDiv = document.getElementById('balanceResult');
    
    if (!web3 || !address) {
        resultDiv.textContent = 'Please enter a valid address';
        return;
    }
    
    try {
        const balance = await web3.eth.getBalance(address);
        const balanceEth = web3.utils.fromWei(balance, 'ether');
        resultDiv.innerHTML = \`
            <strong>Address:</strong> \${address}<br>
            <strong>Balance:</strong> \${parseFloat(balanceEth).toFixed(6)} ETH
        \`;
    } catch (error) {
        resultDiv.textContent = 'Error fetching balance: ' + error.message;
    }
}

function showRecentTransactions(block) {
    const list = document.getElementById('transactionList');
    const txs = block.transactions.slice(0, 5); // Show first 5
    
    if (txs.length === 0) {
        list.innerHTML = '<p class="loading">No transactions in this block</p>';
        return;
    }
    
    list.innerHTML = txs.map((hash, i) => \`
        <div class="transaction-item">
            <div class="hash">TX #\${i + 1}: \${hash.substring(0, 20)}...</div>
            <div class="details">
                <span>Block: \${block.number}</span>
            </div>
        </div>
    \`).join('');
}

function initChart() {
    const ctx = document.getElementById('txChart').getContext('2d');
    blockChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Transactions',
                data: [],
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { beginAtZero: true, grid: { color: '#222' } },
                x: { grid: { color: '#222' } }
            }
        }
    });
}

function updateChart(block) {
    if (!blockChart) return;
    
    blockData.push({
        number: block.number,
        txCount: block.transactions.length
    });
    
    if (blockData.length > 10) {
        blockData.shift();
    }
    
    blockChart.data.labels = blockData.map(b => b.number);
    blockChart.data.datasets[0].data = blockData.map(b => b.txCount);
    blockChart.update();
}

// Demo mode with mock data
function startDemoMode() {
    let blockNum = 18500000;
    
    setInterval(() => {
        blockNum++;
        const mockBlock = {
            number: blockNum,
            transactions: Array(Math.floor(Math.random() * 200) + 50).fill('0x'),
            gasUsed: Math.floor(Math.random() * 15000000) + 5000000,
            difficulty: 0
        };
        
        updateBlockInfo(mockBlock);
        updateChart(mockBlock);
    }, 3000);
    
    document.getElementById('gasPrice').textContent = '25.3 Gwei';
    document.getElementById('difficulty').textContent = '0 (PoS)';
}

window.onload = init;
