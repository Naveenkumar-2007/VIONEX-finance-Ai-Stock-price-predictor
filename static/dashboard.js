// ===== GLOBAL VARIABLES =====// ===== GLOBAL VARIABLES =====

let currentTicker = 'AAPL';let currentTicker = 'AAPL';

let currentDays = 1;let currentDays = 1;

let chartInstance = null;let chartInstance = null;

let autoRefreshInterval = null;let autoRefreshInterval = null;

let currentChartPeriod = null; // Lazy loading: null means no chart loaded yetlet currentChartType = 'daily';

let currentChartType = 'line'; // line or candlesticklet activeTrades = {}; // Store trades with entry prices and predictions

let stockData = null; // Store fetched data

let activeTrades = {}; // Store trades// ===== INITIALIZE =====

document.addEventListener('DOMContentLoaded', function() {

// ===== INITIALIZE =====    initializeApp();

document.addEventListener('DOMContentLoaded', function() {    setupEventListeners();

    initializeApp();    updateLiveClock();

    setupEventListeners();    setInterval(updateLiveClock, 1000);

    updateLiveClock();});

    setInterval(updateLiveClock, 1000);

});// ===== APP INITIALIZATION =====

function initializeApp() {

// ===== APP INITIALIZATION =====    // Load initial stock data

function initializeApp() {    fetchStockData(currentTicker, currentDays);

    // Load initial stock data (without chart)    

    fetchStockData(currentTicker, currentDays);    // Start auto-refresh (every 60 seconds)

        startAutoRefresh();

    // Start auto-refresh (every 60 seconds)}

    startAutoRefresh();

}// ===== EVENT LISTENERS =====

function setupEventListeners() {

// ===== EVENT LISTENERS =====    // Search button

function setupEventListeners() {    document.getElementById('searchBtn').addEventListener('click', handleSearch);

    // Search button    

    document.getElementById('searchBtn').addEventListener('click', handleSearch);    // Enter key on input

        document.getElementById('tickerInput').addEventListener('keypress', function(e) {

    // Enter key on input        if (e.key === 'Enter') {

    document.getElementById('tickerInput').addEventListener('keypress', function(e) {            handleSearch();

        if (e.key === 'Enter') {        }

            handleSearch();    });

        }    

    });    // Days input change

        document.getElementById('daysInput').addEventListener('change', function() {

    // Days input change        const days = parseInt(this.value);

    document.getElementById('daysInput').addEventListener('change', function() {        if (days >= 1 && days <= 7) {

        const days = parseInt(this.value);            currentDays = days;

        if (days >= 1 && days <= 7) {            fetchStockData(currentTicker, currentDays);

            currentDays = days;        }

            fetchStockData(currentTicker, currentDays);    });

        }    

    });    // Quick stock buttons

        document.querySelectorAll('.quick-btn').forEach(btn => {

    // Quick stock buttons        btn.addEventListener('click', function() {

    document.querySelectorAll('.quick-btn').forEach(btn => {            const ticker = this.getAttribute('data-ticker');

        btn.addEventListener('click', function() {            document.getElementById('tickerInput').value = ticker;

            const ticker = this.getAttribute('data-ticker');            handleSearch();

            document.getElementById('tickerInput').value = ticker;        });

            handleSearch();    });

        });    

    });    // Days quick buttons

        document.querySelectorAll('.days-quick-btn').forEach(btn => {

    // Days quick buttons        btn.addEventListener('click', function() {

    document.querySelectorAll('.days-quick-btn').forEach(btn => {            const days = parseInt(this.getAttribute('data-days'));

        btn.addEventListener('click', function() {            document.getElementById('daysInput').value = days;

            const days = parseInt(this.getAttribute('data-days'));            currentDays = days;

            document.getElementById('daysInput').value = days;            fetchStockData(currentTicker, currentDays);

            currentDays = days;        });

            fetchStockData(currentTicker, currentDays);    });

        });    

    });    // Refresh button

        document.getElementById('refreshBtn').addEventListener('click', function() {

    // Refresh button        this.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> Refreshing...';

    document.getElementById('refreshBtn').addEventListener('click', function() {        fetchStockData(currentTicker, currentDays);

        this.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> Refreshing...';    });

        fetchStockData(currentTicker, currentDays);    

        if (currentChartPeriod) {    // Theme toggle

            loadChart(currentChartPeriod);    document.getElementById('themeToggle').addEventListener('click', toggleTheme);

        }    

    });    // Chart type buttons

        document.querySelectorAll('.chart-btn').forEach(btn => {

    // Theme toggle        btn.addEventListener('click', function() {

    document.getElementById('themeToggle').addEventListener('click', toggleTheme);            document.querySelectorAll('.chart-btn').forEach(b => b.classList.remove('active'));

                this.classList.add('active');

    // Chart tabs - Lazy loading            currentChartType = this.getAttribute('data-type');

    document.querySelectorAll('.chart-tab').forEach(btn => {            updateChart();

        btn.addEventListener('click', function() {        });

            const period = this.getAttribute('data-period');    });

            loadChart(period);}

        });

    });// ===== SEARCH HANDLER =====

    function handleSearch() {

    // Chart type toggle    const ticker = document.getElementById('tickerInput').value.trim().toUpperCase();

    document.querySelectorAll('.chart-type-btn').forEach(btn => {    const days = parseInt(document.getElementById('daysInput').value) || 1;

        btn.addEventListener('click', function() {    if (ticker) {

            document.querySelectorAll('.chart-type-btn').forEach(b => b.classList.remove('active'));        currentTicker = ticker;

            this.classList.add('active');        currentDays = days;

            currentChartType = this.getAttribute('data-chart-type');        fetchStockData(ticker, days);

            if (currentChartPeriod) {    }

                renderChart(stockData, currentChartPeriod);}

            }

        });// ===== FETCH STOCK DATA =====

    });async function fetchStockData(ticker, days = 1) {

}    showLoading();

    hideError();

// ===== LOAD CHART (LAZY LOADING) =====    

window.loadChart = async function(period) {    try {

    // Update active tab        const response = await fetch(`/api/stock_data/${ticker}?days=${days}`);

    document.querySelectorAll('.chart-tab').forEach(tab => tab.classList.remove('active'));        

    document.querySelector(`[data-period="${period}"]`).classList.add('active');        // Check if response is OK

            if (!response.ok) {

    currentChartPeriod = period;            const errorData = await response.json();

                throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);

    // Hide placeholder, show loading        }

    document.getElementById('chartPlaceholder').classList.add('hidden');        

    document.getElementById('chartLoading').classList.remove('hidden');        const data = await response.json();

    document.getElementById('mainChart').classList.add('hidden');        console.log('Stock data received:', data);

            

    try {        if (data.success) {

        let chartData;            hideLoading();

                    updateDashboard(data);

        if (period === 'today') {            window.stockData = data; // Store for chart updates

            // Fetch intraday data        } else {

            chartData = await fetchIntradayData(currentTicker);            throw new Error(data.error || 'Failed to fetch stock data');

            document.getElementById('chartTitle').textContent = 'Today\'s Price Movement';        }

        } else {    } catch (error) {

            // Use already fetched data for 30 days or 7 days        console.error('Fetch error:', error);

            const days = period === '30' ? 30 : 7;        showError(error.message || 'Failed to connect to server');

            chartData = await fetchHistoricalData(currentTicker, days);    }

            document.getElementById('chartTitle').textContent = `${days}-Day Price History`;}

        }

        // ===== UPDATE DASHBOARD =====

        if (chartData) {function updateDashboard(data) {

            stockData = chartData;    // Update stock header

            renderChart(chartData, period);    document.getElementById('companyName').textContent = data.company_name;

            document.getElementById('chartLoading').classList.add('hidden');    document.getElementById('tickerSymbol').textContent = data.ticker;

            document.getElementById('mainChart').classList.remove('hidden');    document.getElementById('lastUpdated').textContent = `Last updated: ${data.timestamp}`;

        }    

    } catch (error) {    // Update current price

        console.error('Error loading chart:', error);    document.getElementById('currentPrice').textContent = `$${data.current_price.toFixed(2)}`;

        document.getElementById('chartLoading').classList.add('hidden');    

        showError('Failed to load chart data');    // Update day change

    }    const dayChangeEl = document.getElementById('dayChange');

}    const dayChangeIcon = data.day_change >= 0 ? 'fa-arrow-up' : 'fa-arrow-down';

    const dayChangeClass = data.day_change >= 0 ? 'profit' : 'loss';

// ===== FETCH HISTORICAL DATA =====    dayChangeEl.className = `stat-change ${dayChangeClass}`;

async function fetchHistoricalData(ticker, days) {    dayChangeEl.innerHTML = `

    try {        <i class="fas ${dayChangeIcon}"></i>

        const response = await fetch(`/api/stock_data/${ticker}?days=${days}`);        $${Math.abs(data.day_change).toFixed(2)} (${data.day_change_percent.toFixed(2)}%)

        const data = await response.json();    `;

            

        if (data.success) {    // Update predicted price

            return {    document.getElementById('predictedPrice').textContent = `$${data.predicted_price.toFixed(2)}`;

                dates: data.dates,    

                prices: data.prices,    // Update profit/loss

                predicted: data.predicted,    updateProfitLoss(data);

                current: data.current_price,    

                type: 'historical'    // Update additional stats

            };    document.getElementById('marketCap').textContent = formatMarketCap(data.market_cap);

        }    document.getElementById('volume').textContent = formatNumber(data.volume);

        return null;    document.getElementById('peRatio').textContent = data.pe_ratio;

    } catch (error) {    

        console.error('Error fetching historical data:', error);    // Update trading signal

        return null;    updateTradingSignal(data);

    }    

}    // Update predictions table (always show, even for 1 day)

    if (data.days_predicted >= 1 && data.predictions) {

// ===== FETCH INTRADAY DATA =====        updatePredictionsTable(data);

async function fetchIntradayData(ticker) {    } else {

    try {        document.getElementById('predictionsTableContainer').style.display = 'none';

        const response = await fetch(`/api/intraday/${ticker}`);    }

        const data = await response.json();    

            // Update chart

        if (data.success) {    updateChart();

            return {    

                dates: data.timestamps,    // Show dashboard

                open: data.open,    document.getElementById('dashboardContent').classList.remove('hidden');

                high: data.high,    

                low: data.low,    // Reset refresh button

                close: data.close,    document.getElementById('refreshBtn').innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';

                volume: data.volume,}

                type: 'intraday'

            };// ===== UPDATE PROFIT/LOSS =====

        }function updateProfitLoss(data) {

        return null;    const profitLossCard = document.querySelector('.profit-loss-card');

    } catch (error) {    const profitLossIcon = document.getElementById('profitLossIcon');

        console.error('Error fetching intraday data:', error);    const profitLossValue = document.getElementById('profitLoss');

        return null;    const profitLossBadge = document.getElementById('profitLossBadge');

    }    const changePercent = document.getElementById('changePercent');

}    

    // Check if this ticker has an active trade stored

// ===== RENDER CHART =====    let profitLoss, profitLossPercent, isProfit;

function renderChart(data, period) {    

    const ctx = document.getElementById('mainChart').getContext('2d');    if (activeTrades[data.ticker]) {

            // Use stored entry values for consistent calculation

    // Destroy existing chart        const trade = activeTrades[data.ticker];

    if (chartInstance) {        profitLoss = trade.predictedPrice - trade.entryPrice;

        chartInstance.destroy();        profitLossPercent = (profitLoss / trade.entryPrice) * 100;

    }        isProfit = profitLoss >= 0;

            

    // Determine chart configuration based on type        console.log(`Using stored trade for ${data.ticker}: Entry=$${trade.entryPrice}, Predicted=$${trade.predictedPrice}, P/L=$${profitLoss.toFixed(2)}`);

    if (currentChartType === 'candlestick' && data.type === 'intraday') {    } else {

        renderCandlestickChart(ctx, data);        // First time viewing this stock - store entry values

    } else {        activeTrades[data.ticker] = {

        renderLineChart(ctx, data, period);            entryPrice: data.current_price,

    }            predictedPrice: data.predicted_price,

}            entryTime: new Date().toISOString()

        };

// ===== RENDER LINE CHART =====        

function renderLineChart(ctx, data, period) {        profitLoss = data.profit_loss;

    const isDark = !document.body.hasAttribute('data-theme');        profitLossPercent = data.profit_loss_percent;

    const textColor = isDark ? '#d1d4dc' : '#131722';        isProfit = data.is_profit;

    const gridColor = isDark ? 'rgba(42, 46, 57, 0.5)' : 'rgba(224, 227, 235, 0.5)';        

            console.log(`New trade stored for ${data.ticker}: Entry=$${data.current_price}, Predicted=$${data.predicted_price}`);

    let datasets = [];    }

        

    if (data.type === 'historical') {    const profitLossClass = isProfit ? 'profit' : 'loss';

        // Historical price line (Green)    

        datasets.push({    // Update card styling

            label: 'Historical Price',    profitLossCard.classList.remove('profit', 'loss');

            data: data.prices,    profitLossCard.classList.add(profitLossClass);

            borderColor: '#26a69a',    

            backgroundColor: 'rgba(38, 166, 154, 0.1)',    // Update icon

            borderWidth: 2,    profitLossIcon.innerHTML = isProfit 

            fill: true,        ? '<i class="fas fa-arrow-trend-up"></i>' 

            tension: 0.4,        : '<i class="fas fa-arrow-trend-down"></i>';

            pointRadius: 0,    

            pointHoverRadius: 6,    // Update value

            pointHoverBackgroundColor: '#26a69a',    profitLossValue.className = `stat-value profit-loss ${profitLossClass}`;

            pointHoverBorderColor: '#fff',    profitLossValue.textContent = `${isProfit ? '+' : ''}$${profitLoss.toFixed(2)}`;

            pointHoverBorderWidth: 2    

        });    // Update badge

            profitLossBadge.className = `stat-badge ${profitLossClass}`;

        // Predicted price line (Cyan)    profitLossBadge.innerHTML = isProfit

        if (data.predicted && data.predicted.length > 0) {        ? '<i class="fas fa-check-circle"></i> Expected Profit'

            datasets.push({        : '<i class="fas fa-exclamation-circle"></i> Expected Loss';

                label: 'Predicted Price',    

                data: data.predicted,    // Update percentage

                borderColor: '#00D9D9',    changePercent.textContent = `${isProfit ? '+' : ''}${profitLossPercent.toFixed(2)}%`;

                backgroundColor: 'rgba(0, 217, 217, 0.1)',    changePercent.className = `stat-value ${profitLossClass}`;

                borderWidth: 2,}

                borderDash: [5, 5],

                fill: true,// ===== UPDATE TRADING SIGNAL =====

                tension: 0.4,function updateTradingSignal(data) {

                pointRadius: 4,    const signalContent = document.getElementById('tradingSignal');

                pointBackgroundColor: '#00D9D9',    const isProfit = data.is_profit;

                pointBorderColor: '#fff',    const percentage = Math.abs(data.profit_loss_percent);

                pointHoverRadius: 8    

            });    let signal, signalClass, recommendation;

        }    

    } else if (data.type === 'intraday') {    if (percentage > 2) {

        // Intraday close prices with gradient (green if up, red if down)        signal = isProfit ? 'STRONG BUY' : 'STRONG SELL';

        const firstPrice = data.close[0];        signalClass = isProfit ? 'buy' : 'sell';

        const lastPrice = data.close[data.close.length - 1];        recommendation = isProfit 

        const isUp = lastPrice >= firstPrice;            ? `Strong upward momentum predicted. Consider buying position.`

                    : `Significant downward trend predicted. Consider selling or shorting.`;

        datasets.push({    } else if (percentage > 0.5) {

            label: 'Price',        signal = isProfit ? 'BUY' : 'SELL';

            data: data.close,        signalClass = isProfit ? 'buy' : 'sell';

            borderColor: isUp ? '#26a69a' : '#ef5350',        recommendation = isProfit

            backgroundColor: isUp ? 'rgba(38, 166, 154, 0.1)' : 'rgba(239, 83, 80, 0.1)',            ? `Moderate upward trend expected. Good buying opportunity.`

            borderWidth: 2,            : `Moderate downward trend expected. Consider reducing position.`;

            fill: true,    } else {

            tension: 0.4,        signal = 'HOLD';

            pointRadius: 0,        signalClass = 'hold';

            pointHoverRadius: 6,        recommendation = `Minimal price movement predicted. Hold current position.`;

            segment: {    }

                borderColor: (ctx) => {    

                    const prev = ctx.p0.parsed.y;    signalContent.innerHTML = `

                    const curr = ctx.p1.parsed.y;        <div class="signal-badge ${signalClass}">${signal}</div>

                    return curr >= prev ? '#26a69a' : '#ef5350';        <p>${recommendation}</p>

                }    `;

            }}

        });

    }// ===== UPDATE PREDICTIONS TABLE =====

    function updatePredictionsTable(data) {

    chartInstance = new Chart(ctx, {    const container = document.getElementById('predictionsTableContainer');

        type: 'line',    const title = document.getElementById('predictionDaysTitle');

        data: {    const tbody = document.getElementById('predictionsTableBody');

            labels: data.dates,    

            datasets: datasets    // Update title

        },    title.textContent = `${data.days_predicted}-Day`;

        options: {    

            responsive: true,    // Clear existing rows

            maintainAspectRatio: false,    tbody.innerHTML = '';

            animation: {    

                duration: 1000,    // Add rows for each prediction

                easing: 'easeInOutQuart'    data.predictions.forEach(pred => {

            },        const isProfit = pred.is_profit;

            interaction: {        const row = document.createElement('tr');

                mode: 'index',        row.innerHTML = `

                intersect: false            <td><strong>Day ${pred.day}</strong></td>

            },            <td>

            plugins: {                <div>${pred.date}</div>

                legend: {                <small style="color: var(--text-secondary)">${pred.day_name}</small>

                    display: true,            </td>

                    position: 'top',            <td class="price-cell">$${pred.price.toFixed(2)}</td>

                    labels: {            <td class="${isProfit ? 'profit-cell' : 'loss-cell'}">

                        color: textColor,                ${isProfit ? '+' : ''}$${pred.profit_loss.toFixed(2)}

                        font: {            </td>

                            size: 12,            <td class="${isProfit ? 'profit-cell' : 'loss-cell'}">

                            family: 'Inter, sans-serif'                ${isProfit ? '+' : ''}${pred.profit_loss_percent.toFixed(2)}%

                        },            </td>

                        usePointStyle: true,            <td>

                        padding: 20                <span class="signal-badge ${isProfit ? 'buy' : 'sell'}">

                    }                    ${isProfit ? '📈 BULLISH' : '📉 BEARISH'}

                },                </span>

                tooltip: {            </td>

                    enabled: true,        `;

                    backgroundColor: isDark ? '#1e222d' : '#ffffff',        tbody.appendChild(row);

                    titleColor: textColor,    });

                    bodyColor: textColor,    

                    borderColor: '#00D9D9',    // Show container

                    borderWidth: 1,    container.style.display = 'block';

                    padding: 12,}

                    displayColors: true,

                    callbacks: {// ===== UPDATE CHART =====

                        label: function(context) {function updateChart() {

                            let label = context.dataset.label || '';    const data = window.stockData;

                            if (label) {    if (!data) return;

                                label += ': ';    

                            }    const ctx = document.getElementById('mainChart').getContext('2d');

                            label += '$' + context.parsed.y.toFixed(2);    

                            return label;    // Destroy previous chart

                        }    if (chartInstance) {

                    }        chartInstance.destroy();

                }    }

            },    

            scales: {    let labels, historicalData, predictedData;

                x: {    

                    grid: {    if (currentChartType === 'daily') {

                        color: gridColor,        // Check if multi-day predictions exist

                        drawBorder: false        if (data.chart_data.future_dates && data.chart_data.future_prices) {

                    },            // Show only last 7 days of history + all future predictions

                    ticks: {            const numHistoricalDays = Math.min(7, data.chart_data.dates.length);

                        color: textColor,            const recentDates = data.chart_data.dates.slice(-numHistoricalDays);

                        maxRotation: 45,            const recentPrices = data.chart_data.prices.slice(-numHistoricalDays);

                        minRotation: 0,            

                        autoSkip: true,            // Multi-day chart with predictions

                        maxTicksLimit: period === 'today' ? 12 : 8            labels = [...recentDates, ...data.chart_data.future_dates];

                    }            historicalData = [...recentPrices, ...Array(data.chart_data.future_dates.length).fill(null)];

                },            

                y: {            // Connect last historical price to first predicted price

                    grid: {            const lastHistoricalPrice = recentPrices[recentPrices.length - 1];

                        color: gridColor,            predictedData = [

                        drawBorder: false                ...Array(recentPrices.length - 1).fill(null),

                    },                lastHistoricalPrice,

                    ticks: {                ...data.chart_data.future_prices

                        color: textColor,            ];

                        callback: function(value) {        } else {

                            return '$' + value.toFixed(2);            // Single day prediction - show last 7 days + tomorrow

                        }            const numHistoricalDays = Math.min(7, data.chart_data.dates.length);

                    },            const recentDates = data.chart_data.dates.slice(-numHistoricalDays);

                    beginAtZero: false            const recentPrices = data.chart_data.prices.slice(-numHistoricalDays);

                }            

            }            labels = [...recentDates, data.chart_data.predicted_date];

        }            historicalData = [...recentPrices, null];

    });            predictedData = [...Array(recentPrices.length).fill(null), 

}                             recentPrices[recentPrices.length - 1], 

                             data.chart_data.predicted_price];

// ===== RENDER CANDLESTICK CHART (Simulated with Bar Chart) =====        }

function renderCandlestickChart(ctx, data) {    } else {

    const isDark = !document.body.hasAttribute('data-theme');        // Intraday chart

    const textColor = isDark ? '#d1d4dc' : '#131722';        labels = data.intraday_data.times;

    const gridColor = isDark ? 'rgba(42, 46, 57, 0.5)' : 'rgba(224, 227, 235, 0.5)';        historicalData = data.intraday_data.prices;

            predictedData = Array(data.intraday_data.prices.length).fill(null);

    // Calculate colors for each candle    }

    const candleColors = data.close.map((close, i) => {    

        return close >= data.open[i] ? '#26a69a' : '#ef5350';    const config = {

    });        type: 'line',

            data: {

    chartInstance = new Chart(ctx, {            labels: labels,

        type: 'bar',            datasets: [

        data: {                {

            labels: data.dates,                    label: 'Actual Price',

            datasets: [                    data: historicalData,

                // High-Low lines (wicks)                    borderColor: '#667eea',

                {                    backgroundColor: 'rgba(102, 126, 234, 0.1)',

                    label: 'High',                    borderWidth: 3,

                    data: data.high,                    fill: true,

                    type: 'line',                    tension: 0.4,

                    borderColor: 'transparent',                    pointRadius: 3,

                    backgroundColor: 'transparent',                    pointHoverRadius: 6,

                    pointRadius: 0,                    pointBackgroundColor: '#667eea'

                    showLine: false                },

                },                {

                {                    label: 'Predicted Price',

                    label: 'Low',                    data: predictedData,

                    data: data.low,                    borderColor: '#26a69a',

                    type: 'line',                    backgroundColor: 'rgba(38, 166, 154, 0.1)',

                    borderColor: 'transparent',                    borderWidth: 3,

                    backgroundColor: 'transparent',                    borderDash: [10, 5],

                    pointRadius: 0,                    fill: true,

                    showLine: false                    tension: 0.4,

                },                    pointRadius: 5,

                // Candle bodies (Open-Close)                    pointHoverRadius: 8,

                {                    pointBackgroundColor: '#26a69a',

                    label: 'Price',                    pointStyle: 'star'

                    data: data.close.map((close, i) => [data.open[i], close]),                }

                    backgroundColor: candleColors,            ]

                    borderColor: candleColors,        },

                    borderWidth: 1,        options: {

                    barThickness: 8            responsive: true,

                }            maintainAspectRatio: false,

            ]            interaction: {

        },                mode: 'index',

        options: {                intersect: false,

            responsive: true,            },

            maintainAspectRatio: false,            plugins: {

            animation: {                legend: {

                duration: 800,                    display: true,

                easing: 'easeInOutQuart'                    position: 'top',

            },                    labels: {

            plugins: {                        color: getComputedStyle(document.documentElement)

                legend: {                            .getPropertyValue('--text-primary'),

                    display: false                        font: {

                },                            size: 12,

                tooltip: {                            weight: '600'

                    enabled: true,                        },

                    backgroundColor: isDark ? '#1e222d' : '#ffffff',                        usePointStyle: true,

                    titleColor: textColor,                        padding: 20

                    bodyColor: textColor,                    }

                    borderColor: '#00D9D9',                },

                    borderWidth: 1,                tooltip: {

                    padding: 12,                    backgroundColor: 'rgba(0, 0, 0, 0.8)',

                    callbacks: {                    padding: 12,

                        title: function(context) {                    titleFont: {

                            return context[0].label;                        size: 14,

                        },                        weight: 'bold'

                        label: function(context) {                    },

                            const i = context.dataIndex;                    bodyFont: {

                            return [                        size: 13

                                `Open: $${data.open[i].toFixed(2)}`,                    },

                                `High: $${data.high[i].toFixed(2)}`,                    callbacks: {

                                `Low: $${data.low[i].toFixed(2)}`,                        label: function(context) {

                                `Close: $${data.close[i].toFixed(2)}`,                            let label = context.dataset.label || '';

                                `Volume: ${(data.volume[i] / 1000000).toFixed(2)}M`                            if (label) {

                            ];                                label += ': ';

                        }                            }

                    }                            label += '$' + context.parsed.y.toFixed(2);

                }                            return label;

            },                        }

            scales: {                    }

                x: {                }

                    grid: {            },

                        color: gridColor,            scales: {

                        drawBorder: false                y: {

                    },                    beginAtZero: false,

                    ticks: {                    ticks: {

                        color: textColor,                        color: getComputedStyle(document.documentElement)

                        maxRotation: 45,                            .getPropertyValue('--text-secondary'),

                        autoSkip: true,                        callback: function(value) {

                        maxTicksLimit: 12                            return '$' + value.toFixed(0);

                    }                        }

                },                    },

                y: {                    grid: {

                    grid: {                        color: getComputedStyle(document.documentElement)

                        color: gridColor,                            .getPropertyValue('--border')

                        drawBorder: false                    }

                    },                },

                    ticks: {                x: {

                        color: textColor,                    ticks: {

                        callback: function(value) {                        color: getComputedStyle(document.documentElement)

                            return '$' + value.toFixed(2);                            .getPropertyValue('--text-secondary'),

                        }                        maxRotation: 45,

                    }                        minRotation: 45

                }                    },

            }                    grid: {

        }                        display: false

    });                    }

}                }

            },

// ===== SEARCH HANDLER =====            animation: {

function handleSearch() {                duration: 1500,

    const ticker = document.getElementById('tickerInput').value.trim().toUpperCase();                easing: 'easeInOutQuart'

    const days = parseInt(document.getElementById('daysInput').value) || 1;            }

    if (ticker) {        }

        currentTicker = ticker;    };

        currentDays = days;    

        fetchStockData(ticker, days);    chartInstance = new Chart(ctx, config);

        }

        // Reset chart (require user to click tab again)

        currentChartPeriod = null;// ===== AUTO REFRESH =====

        if (chartInstance) {function startAutoRefresh() {

            chartInstance.destroy();    // Refresh every 60 seconds

            chartInstance = null;    autoRefreshInterval = setInterval(() => {

        }        if (currentTicker) {

        document.getElementById('chartPlaceholder').classList.remove('hidden');            console.log('Auto-refreshing data...');

        document.getElementById('mainChart').classList.add('hidden');            fetchStockData(currentTicker);

        document.querySelectorAll('.chart-tab').forEach(tab => tab.classList.remove('active'));        }

    }    }, 60000);

}}



// ===== FETCH STOCK DATA =====function stopAutoRefresh() {

async function fetchStockData(ticker, days = 1) {    if (autoRefreshInterval) {

    showLoading();        clearInterval(autoRefreshInterval);

    hideError();    }

    }

    try {

        const response = await fetch(`/api/stock_data/${ticker}?days=${days}`);// ===== THEME TOGGLE =====

        const data = await response.json();function toggleTheme() {

            const currentTheme = document.documentElement.getAttribute('data-theme');

        if (data.success) {    const newTheme = currentTheme === 'light' ? 'dark' : 'light';

            updateDashboard(data, ticker, days);    

            showDashboard();    document.documentElement.setAttribute('data-theme', newTheme);

        } else {    

            showError(data.error || 'Failed to fetch stock data');    const icon = newTheme === 'light' ? 'fa-moon' : 'fa-sun';

        }    document.getElementById('themeToggle').innerHTML = `<i class="fas ${icon}"></i>`;

    } catch (error) {    

        console.error('Error:', error);    // Update chart if exists

        showError('Network error. Please try again.');    if (chartInstance) {

    } finally {        updateChart();

        hideLoading();    }

        document.getElementById('refreshBtn').innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';}

    }

}// ===== UTILITY FUNCTIONS =====

function showLoading() {

// ===== UPDATE DASHBOARD =====    document.getElementById('loadingSpinner').classList.remove('hidden');

function updateDashboard(data, ticker, days) {    document.getElementById('dashboardContent').classList.add('hidden');

    // Update title}

    document.getElementById('companyName').textContent = ticker;

    document.getElementById('tickerSymbol').textContent = ticker;function hideLoading() {

    document.getElementById('tickerSymbol').className = 'ticker-badge';    document.getElementById('loadingSpinner').classList.add('hidden');

    }

    // Update current price with animation

    const currentPriceEl = document.getElementById('currentPrice');function showError(message) {

    currentPriceEl.classList.add('updating');    hideLoading();

    setTimeout(() => currentPriceEl.classList.remove('updating'), 500);    const errorEl = document.getElementById('errorMessage');

    currentPriceEl.textContent = '$' + data.current_price.toFixed(2);    errorEl.textContent = message;

        errorEl.classList.remove('hidden');

    // Calculate day change}

    const prices = data.prices;

    if (prices.length >= 2) {function hideError() {

        const prevPrice = prices[prices.length - 2];    document.getElementById('errorMessage').classList.add('hidden');

        const currPrice = data.current_price;}

        const change = currPrice - prevPrice;

        const changePercent = (change / prevPrice) * 100;function updateLiveClock() {

            const now = new Date();

        const dayChangeEl = document.getElementById('dayChange');    const timeString = now.toLocaleTimeString('en-US', {

        dayChangeEl.innerHTML = `        hour: '2-digit',

            <i class="fas fa-arrow-${change >= 0 ? 'up' : 'down'}"></i>         minute: '2-digit',

            $${Math.abs(change).toFixed(2)} (${Math.abs(changePercent).toFixed(2)}%)        second: '2-digit'

        `;    });

        dayChangeEl.className = 'stat-change ' + (change >= 0 ? 'positive' : 'negative');    document.getElementById('liveTime').textContent = timeString;

    }}

    

    // Update predicted pricefunction formatMarketCap(value) {

    if (data.predicted && data.predicted.length > 0) {    if (value === 'N/A') return value;

        const lastPredicted = data.predicted[data.predicted.length - 1];    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;

        const predictedPriceEl = document.getElementById('predictedPrice');    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;

        predictedPriceEl.classList.add('updating');    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;

        setTimeout(() => predictedPriceEl.classList.remove('updating'), 500);    return `$${value.toFixed(2)}`;

        predictedPriceEl.textContent = '$' + lastPredicted.toFixed(2);}

        

        // Update change percentagefunction formatNumber(value) {

        const changeValue = lastPredicted - data.current_price;    if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;

        const changePercentValue = (changeValue / data.current_price) * 100;    if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;

            if (value >= 1e3) return `${(value / 1e3).toFixed(2)}K`;

        const changePercentEl = document.getElementById('changePercent');    return value.toString();

        changePercentEl.classList.add('updating');}

        setTimeout(() => changePercentEl.classList.remove('updating'), 500);

        changePercentEl.textContent = changePercentValue.toFixed(2) + '%';// ===== TRADE MANAGEMENT =====

        changePercentEl.className = 'stat-value ' + (changeValue >= 0 ? 'positive' : 'negative');function clearTrade(ticker) {

            if (activeTrades[ticker]) {

        // Update trading signal        delete activeTrades[ticker];

        updateTradingSignal(changePercentValue, changeValue);        console.log(`Cleared trade for ${ticker}`);

                // Refresh to show new values

        // Update multi-day predictions table        fetchStockData(ticker, currentDays);

        if (days > 1 && data.multi_day_predictions) {    }

            updatePredictionsTable(data.multi_day_predictions, data.current_price, days);}

        } else {

            document.getElementById('predictionsTableContainer').style.display = 'none';function clearAllTrades() {

        }    activeTrades = {};

    }    console.log('Cleared all trades');

        // Refresh current stock

    // Update profit/loss calculation    fetchStockData(currentTicker, currentDays);

    updateProfitLoss(ticker, data.current_price);}

    

    // Update timestamp// ===== CLEANUP =====

    const now = new Date();window.addEventListener('beforeunload', function() {

    document.getElementById('lastUpdated').textContent =     stopAutoRefresh();

        'Updated: ' + now.toLocaleTimeString();    if (chartInstance) {

}        chartInstance.destroy();

    }

// ===== UPDATE TRADING SIGNAL =====});

function updateTradingSignal(changePercent, changeValue) {
    const signalEl = document.getElementById('tradingSignal');
    let signal, description, badgeClass;
    
    if (changePercent > 2) {
        signal = 'STRONG BUY';
        description = 'AI predicts significant price increase. Consider buying.';
        badgeClass = 'signal-strong-buy';
    } else if (changePercent > 0) {
        signal = 'BUY';
        description = 'Positive trend detected. Good opportunity to buy.';
        badgeClass = 'signal-buy';
    } else if (changePercent > -2) {
        signal = 'HOLD';
        description = 'Minimal price movement expected. Hold position.';
        badgeClass = 'signal-hold';
    } else {
        signal = 'SELL';
        description = 'Negative trend detected. Consider selling or avoiding.';
        badgeClass = 'signal-sell';
    }
    
    signalEl.innerHTML = `
        <div class="signal-badge ${badgeClass}">${signal}</div>
        <p>${description}</p>
        <p class="signal-value">Expected change: $${changeValue.toFixed(2)} (${changePercent.toFixed(2)}%)</p>
    `;
}

// ===== UPDATE PREDICTIONS TABLE =====
function updatePredictionsTable(predictions, currentPrice, days) {
    document.getElementById('predictionDaysTitle').textContent = days + '-Day';
    const tbody = document.getElementById('predictionsTableBody');
    tbody.innerHTML = '';
    
    predictions.forEach((pred, index) => {
        const change = pred.price - currentPrice;
        const changePercent = (change / currentPrice) * 100;
        const isPositive = change >= 0;
        
        const signal = changePercent > 2 ? 'STRONG BUY' : 
                      changePercent > 0 ? 'BUY' : 
                      changePercent > -2 ? 'HOLD' : 'SELL';
        const signalClass = signal.replace(' ', '-').toLowerCase();
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>Day ${index + 1}</strong></td>
            <td>${pred.date}</td>
            <td><strong>$${pred.price.toFixed(2)}</strong></td>
            <td class="${isPositive ? 'positive' : 'negative'}">
                <i class="fas fa-arrow-${isPositive ? 'up' : 'down'}"></i>
                $${Math.abs(change).toFixed(2)}
            </td>
            <td class="${isPositive ? 'positive' : 'negative'}">
                ${isPositive ? '+' : ''}${changePercent.toFixed(2)}%
            </td>
            <td><span class="signal-badge signal-${signalClass}">${signal}</span></td>
        `;
        tbody.appendChild(row);
    });
    
    document.getElementById('predictionsTableContainer').style.display = 'block';
}

// ===== PROFIT/LOSS TRACKING =====
function updateProfitLoss(ticker, currentPrice) {
    if (!activeTrades[ticker]) {
        activeTrades[ticker] = {
            entryPrice: currentPrice,
            date: new Date().toLocaleDateString()
        };
        localStorage.setItem('activeTrades', JSON.stringify(activeTrades));
    }
    
    const trade = activeTrades[ticker];
    const profitLoss = currentPrice - trade.entryPrice;
    const profitLossPercent = (profitLoss / trade.entryPrice) * 100;
    
    const profitLossEl = document.getElementById('profitLoss');
    profitLossEl.textContent = (profitLoss >= 0 ? '+' : '') + '$' + profitLoss.toFixed(2);
    profitLossEl.className = 'stat-value profit-loss ' + (profitLoss >= 0 ? 'positive profit-positive' : 'negative profit-negative');
    
    const profitLossBadge = document.getElementById('profitLossBadge');
    profitLossBadge.innerHTML = `
        <i class="fas fa-${profitLoss >= 0 ? 'arrow-up' : 'arrow-down'}"></i> 
        ${(profitLoss >= 0 ? '+' : '')}${profitLossPercent.toFixed(2)}% since ${trade.date}
    `;
    profitLossBadge.className = 'stat-badge ' + (profitLoss >= 0 ? 'positive' : 'negative');
    
    const profitLossIcon = document.getElementById('profitLossIcon');
    profitLossIcon.className = 'stat-icon ' + (profitLoss >= 0 ? 'success' : 'danger');
    profitLossIcon.innerHTML = `<i class="fas fa-${profitLoss >= 0 ? 'arrow-trend-up' : 'arrow-trend-down'}"></i>`;
}

function clearAllTrades() {
    if (confirm('Reset all profit/loss tracking?')) {
        activeTrades = {};
        localStorage.removeItem('activeTrades');
        if (currentTicker) {
            fetchStockData(currentTicker, currentDays);
        }
    }
}

// Load saved trades
try {
    const saved = localStorage.getItem('activeTrades');
    if (saved) {
        activeTrades = JSON.parse(saved);
    }
} catch (e) {
    console.error('Error loading trades:', e);
}

// ===== AUTO REFRESH =====
function startAutoRefresh() {
    autoRefreshInterval = setInterval(() => {
        if (currentTicker) {
            fetchStockData(currentTicker, currentDays);
            if (currentChartPeriod) {
                loadChart(currentChartPeriod);
            }
        }
    }, 60000); // 60 seconds
}

// ===== UI HELPERS =====
function showLoading() {
    document.getElementById('loadingSpinner').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loadingSpinner').classList.add('hidden');
}

function showError(message) {
    const errorEl = document.getElementById('errorMessage');
    errorEl.textContent = message;
    errorEl.classList.remove('hidden');
}

function hideError() {
    document.getElementById('errorMessage').classList.add('hidden');
}

function showDashboard() {
    document.getElementById('dashboardContent').classList.remove('hidden');
}

// ===== LIVE CLOCK =====
function updateLiveClock() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit',
        hour12: true 
    });
    const dateString = now.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
    });
    document.getElementById('liveTime').textContent = `${dateString} • ${timeString}`;
}

// ===== THEME TOGGLE =====
function toggleTheme() {
    const body = document.body;
    const themeToggle = document.getElementById('themeToggle');
    
    if (body.hasAttribute('data-theme')) {
        body.removeAttribute('data-theme');
        themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    } else {
        body.setAttribute('data-theme', 'light');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }
    
    // Refresh chart with new theme
    if (chartInstance && currentChartPeriod) {
        renderChart(stockData, currentChartPeriod);
    }
}
