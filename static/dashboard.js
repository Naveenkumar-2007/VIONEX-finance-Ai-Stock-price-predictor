// ===== GLOBAL VARIABLES =====
let currentTicker = 'AAPL';
let currentDays = 1;
let chartInstance = null;
let autoRefreshInterval = null;
let currentChartType = 'daily';
let activeTrades = {}; // Store trades with entry prices and predictions

// ===== INITIALIZE =====
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    updateLiveClock();
    setInterval(updateLiveClock, 1000);
});

// ===== APP INITIALIZATION =====
function initializeApp() {
    // Load initial stock data
    fetchStockData(currentTicker, currentDays);
    
    // Start auto-refresh (every 60 seconds)
    startAutoRefresh();
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
    // Search button
    document.getElementById('searchBtn').addEventListener('click', handleSearch);
    
    // Enter key on input
    document.getElementById('tickerInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });
    
    // Days input change
    document.getElementById('daysInput').addEventListener('change', function() {
        const days = parseInt(this.value);
        if (days >= 1 && days <= 7) {
            currentDays = days;
            fetchStockData(currentTicker, currentDays);
        }
    });
    
    // Quick stock buttons
    document.querySelectorAll('.quick-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const ticker = this.getAttribute('data-ticker');
            document.getElementById('tickerInput').value = ticker;
            handleSearch();
        });
    });
    
    // Days quick buttons
    document.querySelectorAll('.days-quick-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const days = parseInt(this.getAttribute('data-days'));
            document.getElementById('daysInput').value = days;
            currentDays = days;
            fetchStockData(currentTicker, currentDays);
        });
    });
    
    // Refresh button
    document.getElementById('refreshBtn').addEventListener('click', function() {
        this.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> Refreshing...';
        fetchStockData(currentTicker, currentDays);
    });
    
    // Theme toggle
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    
    // Chart type buttons
    document.querySelectorAll('.chart-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.chart-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentChartType = this.getAttribute('data-type');
            updateChart();
        });
    });
}

// ===== SEARCH HANDLER =====
function handleSearch() {
    const ticker = document.getElementById('tickerInput').value.trim().toUpperCase();
    const days = parseInt(document.getElementById('daysInput').value) || 1;
    if (ticker) {
        currentTicker = ticker;
        currentDays = days;
        fetchStockData(ticker, days);
    }
}

// ===== FETCH STOCK DATA =====
async function fetchStockData(ticker, days = 1) {
    showLoading();
    hideError();
    
    try {
        const response = await fetch(`/api/stock_data/${ticker}?days=${days}`);
        
        // Check if response is OK
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Stock data received:', data);
        
        if (data.success) {
            hideLoading();
            updateDashboard(data);
            window.stockData = data; // Store for chart updates
        } else {
            throw new Error(data.error || 'Failed to fetch stock data');
        }
    } catch (error) {
        console.error('Fetch error:', error);
        showError(error.message || 'Failed to connect to server');
    }
}

// ===== UPDATE DASHBOARD =====
function updateDashboard(data) {
    // Update stock header
    document.getElementById('companyName').textContent = data.company_name;
    document.getElementById('tickerSymbol').textContent = data.ticker;
    document.getElementById('lastUpdated').textContent = `Last updated: ${data.timestamp}`;
    
    // Update current price
    document.getElementById('currentPrice').textContent = `$${data.current_price.toFixed(2)}`;
    
    // Update day change
    const dayChangeEl = document.getElementById('dayChange');
    const dayChangeIcon = data.day_change >= 0 ? 'fa-arrow-up' : 'fa-arrow-down';
    const dayChangeClass = data.day_change >= 0 ? 'profit' : 'loss';
    dayChangeEl.className = `stat-change ${dayChangeClass}`;
    dayChangeEl.innerHTML = `
        <i class="fas ${dayChangeIcon}"></i>
        $${Math.abs(data.day_change).toFixed(2)} (${data.day_change_percent.toFixed(2)}%)
    `;
    
    // Update predicted price
    document.getElementById('predictedPrice').textContent = `$${data.predicted_price.toFixed(2)}`;
    
    // Update profit/loss
    updateProfitLoss(data);
    
    // Update additional stats
    document.getElementById('marketCap').textContent = formatMarketCap(data.market_cap);
    document.getElementById('volume').textContent = formatNumber(data.volume);
    document.getElementById('peRatio').textContent = data.pe_ratio;
    
    // Update trading signal
    updateTradingSignal(data);
    
    // Update predictions table (always show, even for 1 day)
    if (data.days_predicted >= 1 && data.predictions) {
        updatePredictionsTable(data);
    } else {
        document.getElementById('predictionsTableContainer').style.display = 'none';
    }
    
    // Update chart
    updateChart();
    
    // Show dashboard
    document.getElementById('dashboardContent').classList.remove('hidden');
    
    // Reset refresh button
    document.getElementById('refreshBtn').innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';
}

// ===== UPDATE PROFIT/LOSS =====
function updateProfitLoss(data) {
    const profitLossCard = document.querySelector('.profit-loss-card');
    const profitLossIcon = document.getElementById('profitLossIcon');
    const profitLossValue = document.getElementById('profitLoss');
    const profitLossBadge = document.getElementById('profitLossBadge');
    const changePercent = document.getElementById('changePercent');
    
    // Check if this ticker has an active trade stored
    let profitLoss, profitLossPercent, isProfit;
    
    if (activeTrades[data.ticker]) {
        // Use stored entry values for consistent calculation
        const trade = activeTrades[data.ticker];
        profitLoss = trade.predictedPrice - trade.entryPrice;
        profitLossPercent = (profitLoss / trade.entryPrice) * 100;
        isProfit = profitLoss >= 0;
        
        console.log(`Using stored trade for ${data.ticker}: Entry=$${trade.entryPrice}, Predicted=$${trade.predictedPrice}, P/L=$${profitLoss.toFixed(2)}`);
    } else {
        // First time viewing this stock - store entry values
        activeTrades[data.ticker] = {
            entryPrice: data.current_price,
            predictedPrice: data.predicted_price,
            entryTime: new Date().toISOString()
        };
        
        profitLoss = data.profit_loss;
        profitLossPercent = data.profit_loss_percent;
        isProfit = data.is_profit;
        
        console.log(`New trade stored for ${data.ticker}: Entry=$${data.current_price}, Predicted=$${data.predicted_price}`);
    }
    
    const profitLossClass = isProfit ? 'profit' : 'loss';
    
    // Update card styling
    profitLossCard.classList.remove('profit', 'loss');
    profitLossCard.classList.add(profitLossClass);
    
    // Update icon
    profitLossIcon.innerHTML = isProfit 
        ? '<i class="fas fa-arrow-trend-up"></i>' 
        : '<i class="fas fa-arrow-trend-down"></i>';
    
    // Update value
    profitLossValue.className = `stat-value profit-loss ${profitLossClass}`;
    profitLossValue.textContent = `${isProfit ? '+' : ''}$${profitLoss.toFixed(2)}`;
    
    // Update badge
    profitLossBadge.className = `stat-badge ${profitLossClass}`;
    profitLossBadge.innerHTML = isProfit
        ? '<i class="fas fa-check-circle"></i> Expected Profit'
        : '<i class="fas fa-exclamation-circle"></i> Expected Loss';
    
    // Update percentage
    changePercent.textContent = `${isProfit ? '+' : ''}${profitLossPercent.toFixed(2)}%`;
    changePercent.className = `stat-value ${profitLossClass}`;
}

// ===== UPDATE TRADING SIGNAL =====
function updateTradingSignal(data) {
    const signalContent = document.getElementById('tradingSignal');
    const isProfit = data.is_profit;
    const percentage = Math.abs(data.profit_loss_percent);
    
    let signal, signalClass, recommendation;
    
    if (percentage > 2) {
        signal = isProfit ? 'STRONG BUY' : 'STRONG SELL';
        signalClass = isProfit ? 'buy' : 'sell';
        recommendation = isProfit 
            ? `Strong upward momentum predicted. Consider buying position.`
            : `Significant downward trend predicted. Consider selling or shorting.`;
    } else if (percentage > 0.5) {
        signal = isProfit ? 'BUY' : 'SELL';
        signalClass = isProfit ? 'buy' : 'sell';
        recommendation = isProfit
            ? `Moderate upward trend expected. Good buying opportunity.`
            : `Moderate downward trend expected. Consider reducing position.`;
    } else {
        signal = 'HOLD';
        signalClass = 'hold';
        recommendation = `Minimal price movement predicted. Hold current position.`;
    }
    
    signalContent.innerHTML = `
        <div class="signal-badge ${signalClass}">${signal}</div>
        <p>${recommendation}</p>
    `;
}

// ===== UPDATE PREDICTIONS TABLE =====
function updatePredictionsTable(data) {
    const container = document.getElementById('predictionsTableContainer');
    const title = document.getElementById('predictionDaysTitle');
    const tbody = document.getElementById('predictionsTableBody');
    
    // Update title
    title.textContent = `${data.days_predicted}-Day`;
    
    // Clear existing rows
    tbody.innerHTML = '';
    
    // Add rows for each prediction
    data.predictions.forEach(pred => {
        const isProfit = pred.is_profit;
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>Day ${pred.day}</strong></td>
            <td>
                <div>${pred.date}</div>
                <small style="color: var(--text-secondary)">${pred.day_name}</small>
            </td>
            <td class="price-cell">$${pred.price.toFixed(2)}</td>
            <td class="${isProfit ? 'profit-cell' : 'loss-cell'}">
                ${isProfit ? '+' : ''}$${pred.profit_loss.toFixed(2)}
            </td>
            <td class="${isProfit ? 'profit-cell' : 'loss-cell'}">
                ${isProfit ? '+' : ''}${pred.profit_loss_percent.toFixed(2)}%
            </td>
            <td>
                <span class="signal-badge ${isProfit ? 'buy' : 'sell'}">
                    ${isProfit ? '📈 BULLISH' : '📉 BEARISH'}
                </span>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    // Show container
    container.style.display = 'block';
}

// ===== UPDATE CHART =====
function updateChart() {
    const data = window.stockData;
    if (!data) return;
    
    const ctx = document.getElementById('mainChart').getContext('2d');
    
    // Destroy previous chart
    if (chartInstance) {
        chartInstance.destroy();
    }
    
    let labels, historicalData, predictedData;
    
    if (currentChartType === 'daily') {
        // Check if multi-day predictions exist
        if (data.chart_data.future_dates && data.chart_data.future_prices) {
            // Show only last 7 days of history + all future predictions
            const numHistoricalDays = Math.min(7, data.chart_data.dates.length);
            const recentDates = data.chart_data.dates.slice(-numHistoricalDays);
            const recentPrices = data.chart_data.prices.slice(-numHistoricalDays);
            
            // Multi-day chart with predictions
            labels = [...recentDates, ...data.chart_data.future_dates];
            historicalData = [...recentPrices, ...Array(data.chart_data.future_dates.length).fill(null)];
            
            // Connect last historical price to first predicted price
            const lastHistoricalPrice = recentPrices[recentPrices.length - 1];
            predictedData = [
                ...Array(recentPrices.length - 1).fill(null),
                lastHistoricalPrice,
                ...data.chart_data.future_prices
            ];
        } else {
            // Single day prediction - show last 7 days + tomorrow
            const numHistoricalDays = Math.min(7, data.chart_data.dates.length);
            const recentDates = data.chart_data.dates.slice(-numHistoricalDays);
            const recentPrices = data.chart_data.prices.slice(-numHistoricalDays);
            
            labels = [...recentDates, data.chart_data.predicted_date];
            historicalData = [...recentPrices, null];
            predictedData = [...Array(recentPrices.length).fill(null), 
                             recentPrices[recentPrices.length - 1], 
                             data.chart_data.predicted_price];
        }
    } else {
        // Intraday chart
        labels = data.intraday_data.times;
        historicalData = data.intraday_data.prices;
        predictedData = Array(data.intraday_data.prices.length).fill(null);
    }
    
    const config = {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Actual Price',
                    data: historicalData,
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 3,
                    pointHoverRadius: 6,
                    pointBackgroundColor: '#667eea'
                },
                {
                    label: 'Predicted Price',
                    data: predictedData,
                    borderColor: '#26a69a',
                    backgroundColor: 'rgba(38, 166, 154, 0.1)',
                    borderWidth: 3,
                    borderDash: [10, 5],
                    fill: true,
                    tension: 0.4,
                    pointRadius: 5,
                    pointHoverRadius: 8,
                    pointBackgroundColor: '#26a69a',
                    pointStyle: 'star'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: getComputedStyle(document.documentElement)
                            .getPropertyValue('--text-primary'),
                        font: {
                            size: 12,
                            weight: '600'
                        },
                        usePointStyle: true,
                        padding: 20
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: {
                        size: 14,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 13
                    },
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            label += '$' + context.parsed.y.toFixed(2);
                            return label;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    ticks: {
                        color: getComputedStyle(document.documentElement)
                            .getPropertyValue('--text-secondary'),
                        callback: function(value) {
                            return '$' + value.toFixed(0);
                        }
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement)
                            .getPropertyValue('--border')
                    }
                },
                x: {
                    ticks: {
                        color: getComputedStyle(document.documentElement)
                            .getPropertyValue('--text-secondary'),
                        maxRotation: 45,
                        minRotation: 45
                    },
                    grid: {
                        display: false
                    }
                }
            },
            animation: {
                duration: 1500,
                easing: 'easeInOutQuart'
            }
        }
    };
    
    chartInstance = new Chart(ctx, config);
}

// ===== AUTO REFRESH =====
function startAutoRefresh() {
    // Refresh every 60 seconds
    autoRefreshInterval = setInterval(() => {
        if (currentTicker) {
            console.log('Auto-refreshing data...');
            fetchStockData(currentTicker);
        }
    }, 60000);
}

function stopAutoRefresh() {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
    }
}

// ===== THEME TOGGLE =====
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    
    const icon = newTheme === 'light' ? 'fa-moon' : 'fa-sun';
    document.getElementById('themeToggle').innerHTML = `<i class="fas ${icon}"></i>`;
    
    // Update chart if exists
    if (chartInstance) {
        updateChart();
    }
}

// ===== UTILITY FUNCTIONS =====
function showLoading() {
    document.getElementById('loadingSpinner').classList.remove('hidden');
    document.getElementById('dashboardContent').classList.add('hidden');
}

function hideLoading() {
    document.getElementById('loadingSpinner').classList.add('hidden');
}

function showError(message) {
    hideLoading();
    const errorEl = document.getElementById('errorMessage');
    errorEl.textContent = message;
    errorEl.classList.remove('hidden');
}

function hideError() {
    document.getElementById('errorMessage').classList.add('hidden');
}

function updateLiveClock() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    document.getElementById('liveTime').textContent = timeString;
}

function formatMarketCap(value) {
    if (value === 'N/A') return value;
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    return `$${value.toFixed(2)}`;
}

function formatNumber(value) {
    if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
    return value.toString();
}

// ===== TRADE MANAGEMENT =====
function clearTrade(ticker) {
    if (activeTrades[ticker]) {
        delete activeTrades[ticker];
        console.log(`Cleared trade for ${ticker}`);
        // Refresh to show new values
        fetchStockData(ticker, currentDays);
    }
}

function clearAllTrades() {
    activeTrades = {};
    console.log('Cleared all trades');
    // Refresh current stock
    fetchStockData(currentTicker, currentDays);
}

// ===== CLEANUP =====
window.addEventListener('beforeunload', function() {
    stopAutoRefresh();
    if (chartInstance) {
        chartInstance.destroy();
    }
});
