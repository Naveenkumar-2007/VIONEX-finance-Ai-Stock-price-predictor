// ===== DASHBOARD STATE =====
const dashboardState = {
	ticker: 'AAPL',
	days: 7,
	latestData: null,
	autoRefresh: null,
	charts: {
		main: null,
		technical: null,
		volume: null,
		rsi: null,
		macd: null,
		sentiment: null,
		performance: null
	},
	sentimentData: null,
		indicators: null,
		predictionSummary: null,
		tradingSignal: null
};

registerFinancialControllers();
ensureDateAdapter();

// ===== INITIALIZE =====
document.addEventListener('DOMContentLoaded', () => {
	bindUI();
	updateLiveClock();
	setInterval(updateLiveClock, 1000);
	fetchStockData(dashboardState.ticker, dashboardState.days);
	startAutoRefresh();
});

// ===== EVENT BINDINGS =====
function bindUI() {
	const searchBtn = document.getElementById('searchBtn');
	if (searchBtn) {
		searchBtn.addEventListener('click', handleSearch);
	}

	const tickerInput = document.getElementById('tickerInput');
	if (tickerInput) {
		tickerInput.addEventListener('keypress', event => {
			if (event.key === 'Enter') {
				handleSearch();
			}
		});
	}

	const refreshBtn = document.getElementById('refreshBtn');
	if (refreshBtn) {
		refreshBtn.addEventListener('click', () => {
			refreshBtn.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i>';
			fetchStockData(dashboardState.ticker, dashboardState.days, {
				skipLoading: true,
				onComplete: () => {
					refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i>';
				}
			});
		});
	}

	const refreshNewsBtn = document.getElementById('refreshNews');
	if (refreshNewsBtn) {
		refreshNewsBtn.addEventListener('click', () => {
			refreshNewsBtn.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i>';
			fetchNews(dashboardState.ticker, () => {
				refreshNewsBtn.innerHTML = '<i class="fas fa-sync-alt"></i>';
			});
		});
	}

	const themeToggle = document.getElementById('themeToggle');
	if (themeToggle) {
		themeToggle.addEventListener('click', toggleTheme);
	}
}

// ===== SEARCH =====
function handleSearch() {
	const tickerInput = document.getElementById('tickerInput');
	const rawValue = tickerInput ? tickerInput.value.trim().toUpperCase() : '';
	if (!rawValue) {
		return;
	}

	dashboardState.ticker = rawValue;
	fetchStockData(rawValue, dashboardState.days);
}

// ===== FETCH CORE DATA =====
async function fetchStockData(ticker, days, options = {}) {
	const { skipLoading = false, onComplete } = options;
	const encodedTicker = encodeURIComponent(ticker);
	const apiUrl = buildApiUrl(`/api/stock_data/${encodedTicker}?days=${days}&_=${Date.now()}`);

	if (!skipLoading) {
		showLoading();
	}
	hideError();

	try {
		const response = await fetch(apiUrl, { cache: 'no-cache' });

		if (!response.ok) {
			let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
			try {
				const errorData = await response.json();
				if (errorData && errorData.error) {
					errorMessage = errorData.error;
				}
			} catch (_) {
				// Ignore JSON parse errors and fall back to default message
			}
			throw new Error(errorMessage);
		}

		const data = await response.json();
		if (!data.success) {
			throw new Error(data.error || 'Failed to fetch stock data');
		}

		updateDashboard(data);
	} catch (error) {
		console.error('Stock data fetch error:', error);
		hideLoading();
		const fallbackMessage = error.message === 'Failed to fetch'
			? 'Unable to reach prediction service. Check that the Flask server is running and no network or CORS blocks exist.'
			: error.message;
		showError(fallbackMessage || 'Unable to retrieve stock data');
		const refreshBtn = document.getElementById('refreshBtn');
		if (refreshBtn) {
			refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i>';
		}
	} finally {
		if (typeof onComplete === 'function') {
			onComplete();
		}
	}
}

// ===== DASHBOARD UPDATE =====
function updateDashboard(data) {
	dashboardState.latestData = data;
	dashboardState.ticker = data.ticker;
	dashboardState.predictionSummary = {
		currentPrice: Number(data.current_price) || 0,
		predictedPrice: Number(data.predicted_price) || 0,
		profitLoss: Number(data.profit_loss) || 0,
		profitLossPercent: Number(data.profit_loss_percent) || 0
	};

	updateCompanyIdentity(data);
	updateHeadlineMetrics(data);
	updateTradingSignal(data);

	renderMainChart(data);
	renderTechnicalChart(data.technical_chart);
	renderVolumeChart(data.technical_chart);

	fetchNews(data.ticker);
	fetchSentiment(data.ticker);
	fetchTechnicalIndicators(data.ticker);

	hideLoading();

	const dashboardContent = document.getElementById('dashboardContent');
	if (dashboardContent) {
		dashboardContent.classList.remove('hidden');
	}

	const refreshBtn = document.getElementById('refreshBtn');
	if (refreshBtn) {
		refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i>';
	}
}

function updateCompanyIdentity(data) {
	const companyNameEl = document.getElementById('companyName');
	if (companyNameEl) {
		companyNameEl.textContent = data.company_name || data.ticker;
	}

	const tickerSymbolEl = document.getElementById('tickerSymbol');
	if (tickerSymbolEl) {
		tickerSymbolEl.textContent = data.ticker;
	}
}

function updateHeadlineMetrics(data) {
	const currentPriceEl = document.getElementById('currentPriceValue');
	if (currentPriceEl) {
		currentPriceEl.textContent = formatCurrency(data.current_price);
	}

	const predictedPriceEl = document.getElementById('predictedPriceValue');
	if (predictedPriceEl) {
		predictedPriceEl.textContent = formatCurrency(data.predicted_price);
	}

	const dayChangeEl = document.getElementById('dayChangeDetail');
	if (dayChangeEl) {
		const changeValue = formatCurrency(Math.abs(data.day_change));
		const changePercent = `${Math.abs(data.day_change_percent).toFixed(2)}%`;
		const isPositive = data.day_change >= 0;
		dayChangeEl.textContent = `${isPositive ? '+' : '-'}${changeValue} (${isPositive ? '+' : '-'}${changePercent})`;
		dayChangeEl.style.color = isPositive ? 'var(--success)' : 'var(--danger)';
	}

	const statMarketCapEl = document.getElementById('statMarketCap');
	if (statMarketCapEl) {
		statMarketCapEl.textContent = formatMarketCap(data.market_cap);
	}

	const statVolumeEl = document.getElementById('statVolume');
	if (statVolumeEl) {
		statVolumeEl.textContent = formatNumber(data.volume);
	}

	const statPEl = document.getElementById('statPE');
	if (statPEl) {
		statPEl.textContent = data.pe_ratio === 'N/A' ? 'N/A' : Number(data.pe_ratio).toFixed(2);
	}
}

function updateTradingSignal(data) {
	const percentMove = Number(data.profit_loss_percent) || 0;
	const isProfit = percentMove >= 0;
	let badgeLabel = 'HOLD';
	let badgeClass = 'hold';
	let message = 'Minimal movement predicted. Maintaining position recommended.';

	if (Math.abs(percentMove) >= 4) {
		badgeLabel = isProfit ? 'STRONG BUY' : 'STRONG SELL';
		badgeClass = isProfit ? 'strong-buy' : 'sell';
		message = isProfit
			? 'AI expects strong bullish momentum. Consider building a position.'
			: 'AI expects a sharp drop. Consider trimming or hedging exposure.';
	} else if (Math.abs(percentMove) >= 1.5) {
		badgeLabel = isProfit ? 'BUY' : 'SELL';
		badgeClass = isProfit ? 'buy' : 'sell';
		message = isProfit
			? 'Upward move forecasted. Entry opportunity detected.'
			: 'Downside pressure forecasted. Review risk exposure.';
	}

	dashboardState.tradingSignal = {
		label: badgeLabel,
		badgeClass,
		baseMessage: message,
		predictedChangePercent: percentMove
	};

	applyTradingSignal();
}

function applyTradingSignal() {
	const badge = document.getElementById('tradingSignalBadge');
	const messageEl = document.getElementById('tradingSignalMessage');
	if (!badge || !messageEl) {
		return;
	}

	const signal = dashboardState.tradingSignal;
	if (!signal) {
		badge.textContent = 'ANALYZING...';
		badge.className = 'signal-badge';
		messageEl.textContent = 'Gathering predictions and sentiment insights...';
		return;
	}

	badge.textContent = signal.label;
	badge.className = `signal-badge ${signal.badgeClass}`;
	messageEl.textContent = buildTradingSignalMessage(signal.baseMessage, dashboardState.sentimentData, signal.predictedChangePercent);
}

function buildTradingSignalMessage(baseMessage, sentimentData, predictedChangePercent) {
	const segments = [];
	if (baseMessage) {
		segments.push(baseMessage);
	}

	if (sentimentData) {
		const sentimentLabel = sentimentData.sentiment || 'Neutral';
		const bullish = Number(sentimentData.bullish_percent) || 0;
		const bearish = Number(sentimentData.bearish_percent) || 0;
		segments.push(
			`News sentiment: ${sentimentLabel} (${bullish.toFixed(1)}% bullish, ${bearish.toFixed(1)}% bearish).`
		);
	}

	if (segments.length === 0) {
		segments.push('No trading insights available.');
	}

	const move = Number(predictedChangePercent);
	if (!Number.isNaN(move) && Math.abs(move) >= 0.1) {
		segments.push(`Model outlook: ${move >= 0 ? '+' : ''}${move.toFixed(2)}% expected move.`);
	}

	return segments.join(' ');
}

// ===== MAIN CHART =====
function renderMainChart(data) {
	const canvas = document.getElementById('mainChart');
	if (!canvas || !data || !data.chart_data) {
		return;
	}

	const chartData = data.chart_data;
	const styles = getComputedStyle(document.documentElement);
	const actualColor = styles.getPropertyValue('--accent-blue').trim() || '#2d6dfa';
	const actualFill = 'rgba(45, 109, 250, 0.14)';
	const predictedColor = styles.getPropertyValue('--accent-primary').trim() || '#1ec997';
	const predictedFill = 'rgba(30, 201, 151, 0.12)';
	const textSecondary = styles.getPropertyValue('--text-secondary').trim() || '#94a3b8';
	const gridColor = styles.getPropertyValue('--border').trim() || '#e2e8f0';

	const historicalDates = Array.isArray(chartData.dates) ? chartData.dates : [];
	const historicalPrices = Array.isArray(chartData.prices) ? chartData.prices : [];
	const futureDates = Array.isArray(chartData.future_dates) ? chartData.future_dates : [];
	const futurePrices = Array.isArray(chartData.future_prices) ? chartData.future_prices : [];

	let labels = [...historicalDates];
	let actualSeries = [...historicalPrices];
	let predictedSeries = Array(historicalPrices.length).fill(null);
	const lastHistoricalPrice = historicalPrices.length ? historicalPrices[historicalPrices.length - 1] : null;

	if (futureDates.length && futurePrices.length && lastHistoricalPrice !== null) {
		labels = [...historicalDates, ...futureDates];
		actualSeries = [...historicalPrices, ...Array(futureDates.length).fill(null)];
		predictedSeries = [
			...Array(Math.max(historicalPrices.length - 1, 0)).fill(null),
			lastHistoricalPrice,
			...futurePrices
		];
	} else if (chartData.predicted_date && typeof chartData.predicted_price === 'number' && lastHistoricalPrice !== null) {
		labels = [...historicalDates, chartData.predicted_date];
		actualSeries = [...historicalPrices, null];
		predictedSeries = [
			...Array(Math.max(historicalPrices.length - 1, 0)).fill(null),
			lastHistoricalPrice,
			chartData.predicted_price
		];
	}

	destroyChartInstance(canvas, 'main');

	const ctx = canvas.getContext('2d');
	dashboardState.charts.main = new Chart(ctx, {
		type: 'line',
		data: {
			labels,
			datasets: [
				{
					label: 'Actual Price',
					data: actualSeries,
					borderColor: actualColor,
					backgroundColor: actualFill,
					borderWidth: 2.5,
					fill: true,
					tension: 0.35,
					pointRadius: 0,
					spanGaps: true
				},
				{
					label: 'Predicted Price',
					data: predictedSeries,
					borderColor: predictedColor,
					backgroundColor: predictedFill,
					borderWidth: 2.5,
					borderDash: [10, 6],
					fill: true,
					tension: 0.35,
					pointRadius: 0,
					spanGaps: true
				}
			]
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
			interaction: { mode: 'index', intersect: false },
			plugins: {
				legend: {
					display: true,
					position: 'top',
					labels: {
						usePointStyle: true,
						color: textSecondary,
						font: { size: 12, weight: '600' }
					}
				},
				tooltip: {
					backgroundColor: 'rgba(12, 26, 60, 0.88)',
					padding: 12,
					titleFont: { size: 13, weight: '700' },
					bodyFont: { size: 12 },
					callbacks: {
						label: context => {
							const label = context.dataset.label || '';
							const value = context.parsed.y;
							if (value === null || value === undefined || Number.isNaN(value)) {
								return null;
							}
							const price = formatCurrency(value);
							return `${label}: ${price}`;
						}
					}
				}
			},
			scales: {
				x: {
					grid: { display: false },
					ticks: {
						color: textSecondary,
						maxRotation: 45,
						minRotation: 0,
						autoSkip: true,
						maxTicksLimit: 8
					}
				},
				y: {
					grid: { color: gridColor },
					ticks: {
						color: textSecondary,
						callback: value => `$${Number(value).toFixed(2)}`
					}
				}
			}
		}
	});
}

// ===== TECHNICAL & VOLUME CHARTS =====
function renderTechnicalChart(technicalData) {
	const canvas = document.getElementById('technicalChart');
	if (!canvas) {
		return;
	}

	const candles = normalizeCandleSeries(technicalData?.candles);
	if (!candles.length) {
		destroyChartInstance(canvas, 'technical');
		return;
	}

	const movingAverages = technicalData?.moving_averages || {};
	const sma20Series = normalizeLineSeries(movingAverages.sma20);
	const sma50Series = normalizeLineSeries(movingAverages.sma50);

	destroyChartInstance(canvas, 'technical');

	const styles = getComputedStyle(document.documentElement);
	const upColor = styles.getPropertyValue('--accent-primary').trim() || '#1ec997';
	const downColor = styles.getPropertyValue('--danger').trim() || '#f0524d';
	const textSecondary = styles.getPropertyValue('--text-secondary').trim() || '#94a3b8';
	const gridColor = styles.getPropertyValue('--border').trim() || '#e2e8f0';
	const sma20Color = styles.getPropertyValue('--accent-blue').trim() || '#2d6dfa';
	const sma50Color = styles.getPropertyValue('--accent-gold').trim() || '#f5a623';

	const datasets = [
		{
			type: 'candlestick',
			label: 'Price',
			data: candles,
			parsing: {
				xAxisKey: 'x',
				openKey: 'o',
				highKey: 'h',
				lowKey: 'l',
				closeKey: 'c'
			},
			color: {
				up: upColor,
				down: downColor,
				unchanged: textSecondary
			},
			borderColor: {
				up: upColor,
				down: downColor,
				unchanged: textSecondary
			}
		}
	];

	if (sma20Series.length) {
		datasets.push({
			type: 'line',
			label: 'SMA 20',
			data: sma20Series,
			parsing: {
				xAxisKey: 'x',
				yAxisKey: 'y'
			},
			borderColor: sma20Color,
			borderWidth: 1.5,
			pointRadius: 0,
			tension: 0,
			spanGaps: true,
			fill: false,
			yAxisID: 'y'
		});
	}

	if (sma50Series.length) {
		datasets.push({
			type: 'line',
			label: 'SMA 50',
			data: sma50Series,
			parsing: {
				xAxisKey: 'x',
				yAxisKey: 'y'
			},
			borderColor: sma50Color,
			borderWidth: 1.5,
			pointRadius: 0,
			tension: 0,
			borderDash: [6, 4],
			spanGaps: true,
			fill: false,
			yAxisID: 'y'
		});
	}

	const ctx = canvas.getContext('2d');
	dashboardState.charts.technical = new Chart(ctx, {
		type: 'candlestick',
		data: {
			datasets: datasets
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
			plugins: {
				legend: {
					display: true,
					labels: {
						color: textSecondary,
						usePointStyle: true,
						font: { size: 11 }
					}
				},
				tooltip: {
					mode: 'index',
					intersect: false,
					callbacks: {
						title: context => {
							if (!context.length) {
								return '';
							}
							return formatTooltipDate(context[0].parsed.x);
						},
						label: context => {
							if (context.dataset.type === 'line') {
								const price = Number(context.parsed.y);
								if (Number.isNaN(price)) {
									return null;
								}
								return `${context.dataset.label || 'Value'}: ${formatCurrency(price)}`;
							}

							const raw = context.raw || {};
							const o = Number(raw.o);
							const h = Number(raw.h);
							const l = Number(raw.l);
							const c = Number(raw.c);
							if ([o, h, l, c].some(val => Number.isNaN(val))) {
								return null;
							}
							return `O ${o.toFixed(2)}  H ${h.toFixed(2)}  L ${l.toFixed(2)}  C ${c.toFixed(2)}`;
						}
					}
				}
			},
			scales: {
				x: {
					type: 'time',
					time: {
						unit: 'day',
						displayFormats: {
							day: 'MMM dd',
							week: 'MMM dd',
							month: 'MMM yyyy'
						}
					},
					ticks: { color: textSecondary, maxRotation: 0, autoSkip: true, maxTicksLimit: 6 },
					grid: { display: false }
				},
				y: {
					ticks: { color: textSecondary },
					grid: { color: gridColor }
				}
			}
		}
	});
}

function renderVolumeChart(technicalData) {
	const canvas = document.getElementById('volumeChart');
	if (!canvas) {
		return;
	}

	const volumes = normalizeVolumeSeries(technicalData?.volumes);
	const candles = normalizeCandleSeries(technicalData?.candles);
	if (!volumes.length) {
		destroyChartInstance(canvas, 'volume');
		return;
	}

	destroyChartInstance(canvas, 'volume');

	const styles = getComputedStyle(document.documentElement);
	const upColor = 'rgba(30, 201, 151, 0.35)';
	const downColor = 'rgba(240, 82, 77, 0.35)';
	const textSecondary = styles.getPropertyValue('--text-secondary').trim() || '#94a3b8';
	const gridColor = styles.getPropertyValue('--border').trim() || '#e2e8f0';

	const candleMap = new Map(candles.map(item => [item.x, item]));
	const dataset = volumes.map(point => {
		const candle = candleMap.get(point.x);
		const isUp = candle ? candle.c >= candle.o : true;
		return {
			x: point.x,
			y: point.y,
			isUp
		};
	});
	const colors = dataset.map(item => (item.isUp ? upColor : downColor));

	const ctx = canvas.getContext('2d');
	dashboardState.charts.volume = new Chart(ctx, {
		type: 'bar',
		data: {
			datasets: [
				{
					label: 'Volume',
					data: dataset,
					parsing: {
						xAxisKey: 'x',
						yAxisKey: 'y'
					},
					backgroundColor: colors,
					borderRadius: 6,
					maxBarThickness: 18
				}
			]
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
			plugins: {
				legend: { display: false },
				tooltip: {
					callbacks: {
						label: context => `Volume: ${formatNumber(context.parsed.y)}`,
						title: items => (items.length ? formatTooltipDate(items[0].parsed.x) : '')
					}
				}
			},
			scales: {
				x: {
					type: 'time',
					time: {
						unit: 'day',
						displayFormats: {
							day: 'MMM dd',
							week: 'MMM dd'
						}
					},
					ticks: { color: textSecondary, autoSkip: true, maxTicksLimit: 6 },
					grid: { display: false }
				},
				y: {
					ticks: { color: textSecondary, callback: value => formatNumber(value) },
					grid: { color: gridColor }
				}
			}
		}
	});
}

// ===== AUTO REFRESH =====
function startAutoRefresh() {
	stopAutoRefresh();
	dashboardState.autoRefresh = setInterval(() => {
		fetchStockData(dashboardState.ticker, dashboardState.days, { skipLoading: true });
	}, 60000);
}

function stopAutoRefresh() {
	if (dashboardState.autoRefresh) {
		clearInterval(dashboardState.autoRefresh);
		dashboardState.autoRefresh = null;
	}
}

// ===== NEWS =====
async function fetchNews(ticker, onComplete) {
	const container = document.getElementById('newsContainer');
	if (container) {
		container.innerHTML = `
			<div class="news-loading">
				<i class="fas fa-spinner fa-spin"></i> Loading news...
			</div>
		`;
	}

	const encodedTicker = encodeURIComponent(ticker);
	const apiUrl = buildApiUrl(`/api/news/${encodedTicker}?days=7&_=${Date.now()}`);

	try {
		const response = await fetch(apiUrl, { cache: 'no-cache' });
		const data = await response.json();

		if (data.success && Array.isArray(data.news) && data.news.length > 0) {
			displayNews(data.news);
		} else {
			displayNoNews();
		}
	} catch (error) {
		console.error('News fetch error:', error);
		displayNoNews();
	} finally {
		if (typeof onComplete === 'function') {
			onComplete();
		}
	}
}

function displayNews(newsArticles) {
	const container = document.getElementById('newsContainer');
	if (!container) {
		return;
	}

	container.innerHTML = '';

	newsArticles.slice(0, 6).forEach(article => {
		const item = document.createElement('article');
		item.className = 'news-item';
		item.addEventListener('click', () => {
			if (article.url) {
				window.open(article.url, '_blank');
			}
		});

		const relativeTime = formatRelativeTime(article.timestamp);
		const imageMarkup = article.image
			? `<img src="${article.image}" alt="${article.headline}" class="news-thumb" onerror="this.style.display='none'">`
			: '<div class="news-thumb" style="background: rgba(99, 107, 132, 0.12);"></div>';

		item.innerHTML = `
			${imageMarkup}
			<div class="news-body">
				<span class="news-source">${article.source || 'News'}</span>
				<div class="news-title">${article.headline || 'No headline provided'}</div>
				<div class="news-summary">${article.summary || 'No summary available.'}</div>
				<div class="news-time"><i class="fas fa-clock"></i> ${relativeTime}</div>
			</div>
		`;

		container.appendChild(item);
	});
}

function displayNoNews() {
	const container = document.getElementById('newsContainer');
	if (!container) {
		return;
	}
	container.innerHTML = `
		<div class="news-loading">
			<i class="fas fa-newspaper"></i> No recent articles available.
		</div>
	`;
}

// ===== SENTIMENT =====
async function fetchSentiment(ticker) {
	dashboardState.sentimentData = null;
	applyTradingSignal();
	try {
		const encodedTicker = encodeURIComponent(ticker);
		const apiUrl = buildApiUrl(`/api/sentiment/${encodedTicker}?_=${Date.now()}`);
		const response = await fetch(apiUrl, { cache: 'no-cache' });
		const data = await response.json();

		if (data.success && data.sentiment) {
			displaySentiment(data.sentiment);
		}
	} catch (error) {
		console.error('Sentiment fetch error:', error);
	}
}

function displaySentiment(sentiment) {
	dashboardState.sentimentData = sentiment;

	const labelEl = document.getElementById('sentimentLabel');
	if (labelEl) {
		const positive = Number(sentiment.bullish_percent) || 0;
		labelEl.textContent = `${sentiment.sentiment} • ${positive.toFixed(1)}% bullish`;
	}

	const canvas = document.getElementById('sentimentGauge');
	if (!canvas) {
		return;
	}

	destroyChartInstance(canvas, 'sentiment');

	const ctx = canvas.getContext('2d');
	const styles = getComputedStyle(document.documentElement);
	const positiveColor = styles.getPropertyValue('--accent-primary').trim() || '#1ec997';
	const negativeColor = styles.getPropertyValue('--danger').trim() || '#f0524d';
	const neutralColor = styles.getPropertyValue('--accent-blue').trim() || '#2d6dfa';

	const bullish = Math.max(0, Number(sentiment.bullish_percent) || 0);
	const bearish = Math.max(0, Number(sentiment.bearish_percent) || 0);
	const neutral = Math.max(0, 100 - bullish - bearish);

	dashboardState.charts.sentiment = new Chart(ctx, {
		type: 'doughnut',
		data: {
			labels: ['Positive', 'Neutral', 'Negative'],
			datasets: [
				{
					data: [bullish, neutral, bearish],
					backgroundColor: [positiveColor, neutralColor, negativeColor],
					borderWidth: 0
				}
			]
		},
		options: {
			responsive: true,
			maintainAspectRatio: true,
			cutout: '72%',
			circumference: 180,
			rotation: 270,
			plugins: {
				legend: { display: false },
				tooltip: {
					callbacks: {
						label: context => `${context.label}: ${context.parsed.toFixed(1)}%`
					}
				}
			}
		}
	});

	applyTradingSignal();
}

// ===== TECHNICAL INDICATORS =====
async function fetchTechnicalIndicators(ticker) {
	try {
		const encodedTicker = encodeURIComponent(ticker);
		const apiUrl = buildApiUrl(`/api/technical/${encodedTicker}`);
		const response = await fetch(apiUrl, { cache: 'no-cache' });
		const data = await response.json();

		if (data.success && data.indicators) {
			displayTechnicalIndicators(data.indicators);
		}
	} catch (error) {
		console.error('Technical indicators fetch error:', error);
	}
}

function displayTechnicalIndicators(indicators) {
	dashboardState.indicators = indicators;

	const rsiValueEl = document.getElementById('rsiValue');
	if (rsiValueEl && indicators.RSI) {
		rsiValueEl.textContent = indicators.RSI.value.toFixed(2);
	}

	const emaValueEl = document.getElementById('emaValue');
	if (emaValueEl && indicators.EMA) {
		emaValueEl.textContent = formatCurrency(indicators.EMA.value);
	}

	const macdValueEl = document.getElementById('macdValue');
	if (macdValueEl && indicators.MACD) {
		macdValueEl.textContent = indicators.MACD.value.toFixed(2);
	}

	if (indicators.RSI) {
		createMiniChart('rsiMiniChart', indicators.RSI.trend_data, indicators.RSI.trend_dates, '#9C27B0');
	}

	if (indicators.MACD) {
		createMiniChart(
			'macdMiniChart',
			indicators.MACD.trend_data,
			indicators.MACD.trend_dates,
			'#2196F3',
			indicators.MACD.signal_data
		);
	}

	updatePerformanceChart(indicators);
}

function createMiniChart(canvasId, data, labels, primaryColor, secondaryData) {
	const canvas = document.getElementById(canvasId);
	if (!canvas || !Array.isArray(data) || data.length === 0) {
		return;
	}

	if (canvasId === 'rsiMiniChart') {
		destroyChartInstance(canvas, 'rsi');
	}
	if (canvasId === 'macdMiniChart') {
		destroyChartInstance(canvas, 'macd');
	}

	const datasets = [
		{
			data,
			borderColor: primaryColor,
			backgroundColor: primaryColor + '20',
			borderWidth: 2,
			fill: true,
			tension: 0.4,
			pointRadius: 0
		}
	];

	if (secondaryData) {
		datasets.push({
			data: secondaryData,
			borderColor: '#FF9800',
			borderWidth: 2,
			borderDash: [6, 4],
			fill: false,
			tension: 0.4,
			pointRadius: 0
		});
	}

	const ctx = canvas.getContext('2d');
	const instance = new Chart(ctx, {
		type: 'line',
		data: {
			labels,
			datasets
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
			plugins: { legend: { display: false }, tooltip: { enabled: false } },
			scales: { x: { display: false }, y: { display: false } }
		}
	});

	if (canvasId === 'rsiMiniChart') {
		dashboardState.charts.rsi = instance;
	} else if (canvasId === 'macdMiniChart') {
		dashboardState.charts.macd = instance;
	}
}

function updatePerformanceChart(indicators) {
	const canvas = document.getElementById('performanceChart');
	const valueEl = document.getElementById('performanceValue');
	if (!canvas || !valueEl || !indicators.RSI) {
		return;
	}

	const dataSeries = indicators.RSI.trend_data.slice(-7);
	const labelSeries = indicators.RSI.trend_dates.slice(-7);

	destroyChartInstance(canvas, 'performance');

	const styles = getComputedStyle(document.documentElement);
	const lineColor = styles.getPropertyValue('--accent-primary').trim() || '#1ec997';
	const fillColor = 'rgba(30, 201, 151, 0.12)';
	const textSecondary = styles.getPropertyValue('--text-secondary').trim() || '#94a3b8';
	const gridColor = styles.getPropertyValue('--border').trim() || '#e2e8f0';

	const ctx = canvas.getContext('2d');
	dashboardState.charts.performance = new Chart(ctx, {
		type: 'line',
		data: {
			labels: labelSeries,
			datasets: [
				{
					data: dataSeries,
					borderColor: lineColor,
					backgroundColor: fillColor,
					borderWidth: 2,
					fill: true,
					tension: 0.35,
					pointRadius: 0
				}
			]
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
			plugins: { legend: { display: false } },
			scales: {
				x: { grid: { display: false }, ticks: { color: textSecondary, font: { size: 9 } } },
				y: { grid: { color: gridColor }, ticks: { color: textSecondary, font: { size: 9 } } }
			}
		}
	});

	if (dataSeries.length >= 2 && dataSeries[0] !== 0) {
		const change = ((dataSeries[dataSeries.length - 1] - dataSeries[0]) / dataSeries[0]) * 100;
		valueEl.textContent = `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
		valueEl.style.color = change >= 0 ? 'var(--success)' : 'var(--danger)';
	} else {
		valueEl.textContent = '--';
		valueEl.style.color = 'var(--text-secondary)';
	}
}

// ===== UTILITIES =====
function showLoading() {
	const spinner = document.getElementById('loadingSpinner');
	if (spinner) {
		spinner.classList.remove('hidden');
	}
	const content = document.getElementById('dashboardContent');
	if (content) {
		content.classList.add('hidden');
	}
}

function hideLoading() {
	const spinner = document.getElementById('loadingSpinner');
	if (spinner) {
		spinner.classList.add('hidden');
	}
}

function showError(message) {
	const errorEl = document.getElementById('errorMessage');
	if (errorEl) {
		errorEl.textContent = message;
		errorEl.classList.remove('hidden');
	}
}

function hideError() {
	const errorEl = document.getElementById('errorMessage');
	if (errorEl) {
		errorEl.classList.add('hidden');
	}
}

function updateLiveClock() {
	const liveTimeEl = document.getElementById('liveTime');
	if (!liveTimeEl) {
		return;
	}

	const now = new Date();
	liveTimeEl.textContent = now.toLocaleTimeString('en-US', {
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit'
	});
}

function formatMarketCap(value) {
	if (value === 'N/A' || value === null || value === undefined) {
		return 'N/A';
	}

	const numeric = Number(value);
	if (Number.isNaN(numeric)) {
		return 'N/A';
	}

	if (numeric >= 1e12) return `$${(numeric / 1e12).toFixed(2)}T`;
	if (numeric >= 1e9) return `$${(numeric / 1e9).toFixed(2)}B`;
	if (numeric >= 1e6) return `$${(numeric / 1e6).toFixed(2)}M`;
	if (numeric >= 1e3) return `$${(numeric / 1e3).toFixed(2)}K`;
	return `$${numeric.toFixed(2)}`;
}

function formatNumber(value) {
	if (value === null || value === undefined) {
		return '0';
	}

	const numeric = Number(value);
	if (Number.isNaN(numeric)) {
		return '0';
	}

	if (numeric >= 1e9) return `${(numeric / 1e9).toFixed(2)}B`;
	if (numeric >= 1e6) return `${(numeric / 1e6).toFixed(2)}M`;
	if (numeric >= 1e3) return `${(numeric / 1e3).toFixed(2)}K`;
	return numeric.toString();
}

function parseTimestamp(value) {
	if (value === null || value === undefined) {
		return null;
	}

	if (typeof value === 'number' && Number.isFinite(value)) {
		return value;
	}

	if (value instanceof Date) {
		return value.getTime();
	}

	if (typeof value === 'string' && value.trim().length) {
		if (typeof luxon !== 'undefined' && luxon.DateTime) {
			const { DateTime } = luxon;
			let dt = DateTime.fromISO(value, { zone: 'utc' });
			if (!dt.isValid) {
				dt = DateTime.fromFormat(value, 'yyyy-LL-dd');
			}
			if (!dt.isValid) {
				dt = DateTime.fromRFC2822(value);
			}
			if (!dt.isValid) {
				dt = DateTime.fromSQL(value);
			}
			if (dt.isValid) {
				return dt.toMillis();
			}
		}

		const parsed = Date.parse(value);
		if (!Number.isNaN(parsed)) {
			return parsed;
		}
	}

	return null;
}

function normalizeCandleSeries(series) {
	if (!Array.isArray(series)) {
		return [];
	}

	return series
		.map(item => {
			if (!item) {
				return null;
			}

			const rawTime = item.x ?? item.t ?? item.time ?? item.date ?? item.datetime;
			const timestamp = parseTimestamp(rawTime);
			const open = Number(item.o ?? item.open);
			const high = Number(item.h ?? item.high);
			const low = Number(item.l ?? item.low);
			const close = Number(item.c ?? item.close);

			if (
				timestamp === null ||
				Number.isNaN(open) ||
				Number.isNaN(high) ||
				Number.isNaN(low) ||
				Number.isNaN(close)
			) {
				return null;
			}

			return {
				x: timestamp,
				o: open,
				h: high,
				l: low,
				c: close
			};
		})
		.filter(Boolean)
		.sort((a, b) => a.x - b.x);
}

function normalizeVolumeSeries(series) {
	if (!Array.isArray(series)) {
		return [];
	}

	return series
		.map(item => {
			if (!item) {
				return null;
			}

			const rawTime = item.x ?? item.t ?? item.time ?? item.date ?? item.datetime;
			const timestamp = parseTimestamp(rawTime);
			const volumeValue = Number(item.y ?? item.volume ?? item.v ?? item.value);

			if (timestamp === null || Number.isNaN(volumeValue)) {
				return null;
			}

			return {
				x: timestamp,
				y: volumeValue
			};
		})
		.filter(Boolean)
		.sort((a, b) => a.x - b.x);
}

function normalizeLineSeries(series) {
	if (!Array.isArray(series)) {
		return [];
	}

	return series
		.map(item => {
			if (!item) {
				return null;
			}

			const rawTime = item.x ?? item.t ?? item.time ?? item.date ?? item.datetime;
			const timestamp = parseTimestamp(rawTime);
			const value = Number(item.y ?? item.value ?? item.price ?? item.close);

			if (timestamp === null || Number.isNaN(value)) {
				return null;
			}

			return {
				x: timestamp,
				y: value
			};
		})
		.filter(Boolean)
		.sort((a, b) => a.x - b.x);
}

function formatCurrency(value) {
	const numeric = Number(value);
	if (Number.isNaN(numeric)) {
		return '$0.00';
	}
	return `$${numeric.toFixed(2)}`;
}

function formatRelativeTime(unixSeconds) {
	if (!unixSeconds) {
		return 'Just now';
	}

	const elapsed = Date.now() - unixSeconds * 1000;
	const minutes = Math.floor(elapsed / 60000);
	if (minutes < 1) return 'Just now';
	if (minutes < 60) return `${minutes}m ago`;

	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}h ago`;

	const days = Math.floor(hours / 24);
	return `${days}d ago`;
}

function formatTooltipDate(value) {
	if (value === null || value === undefined) {
		return '';
	}

	if (typeof luxon !== 'undefined' && luxon.DateTime) {
		const dt = luxon.DateTime.fromMillis(Number(value));
		if (dt.isValid) {
			return dt.toFormat('MMM dd, yyyy');
		}
	}

	const date = new Date(value);
	if (!Number.isNaN(date.getTime())) {
		return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
	}

	return '';
}

function toggleTheme() {
	const root = document.documentElement;
	const currentTheme = root.getAttribute('data-theme') || 'light';
	const newTheme = currentTheme === 'light' ? 'dark' : 'light';
	root.setAttribute('data-theme', newTheme);

	if (dashboardState.latestData) {
		renderMainChart(dashboardState.latestData);
		renderTechnicalChart(dashboardState.latestData.technical_chart);
		renderVolumeChart(dashboardState.latestData.technical_chart);
	}

	if (dashboardState.indicators) {
		displayTechnicalIndicators(dashboardState.indicators);
	}

	if (dashboardState.sentimentData) {
		displaySentiment(dashboardState.sentimentData);
	}

	applyTradingSignal();
}

function buildApiUrl(path) {
	if (!path) {
		return '';
	}

	if (path.startsWith('http://') || path.startsWith('https://')) {
		return path;
	}

	const normalizedPath = path.startsWith('/') ? path : `/${path}`;
	const origin = window.location.origin;

	if (!origin || origin === 'null' || origin === 'file://') {
		return `http://127.0.0.1:5000${normalizedPath}`;
	}

	return `${origin}${normalizedPath}`;
}

function destroyChartInstance(canvas, chartKey) {
	if (!canvas) {
		return;
	}

	if (chartKey && dashboardState.charts[chartKey] && typeof dashboardState.charts[chartKey].destroy === 'function') {
		dashboardState.charts[chartKey].destroy();
		dashboardState.charts[chartKey] = null;
	}

	if (typeof Chart !== 'undefined') {
		const existing = typeof Chart.getChart === 'function'
			? Chart.getChart(canvas)
			: (Chart.instances
				? Object.values(Chart.instances).find(chart => chart?.canvas === canvas)
				: null);
		if (existing && (!chartKey || existing !== dashboardState.charts[chartKey])) {
			existing.destroy();
		}
	}
}

	function registerFinancialControllers() {
		if (typeof Chart === 'undefined') {
			console.warn('Chart.js not available; candlestick controller registration skipped.');
			return;
		}

		if (window.__financialControllersRegistered) {
			return;
		}

		const namespace = window['chartjs-chart-financial'] || window.chartjsChartFinancial || window.ChartFinancial;
		if (!namespace) {
			console.warn('chartjs-chart-financial plugin not detected; candlestick charts will not render.');
			return;
		}

		const registerables = [
			namespace.CandlestickController,
			namespace.CandlestickElement,
			namespace.OhlcController,
			namespace.OhlcElement
		].filter(Boolean);

		if (!registerables.length) {
			console.warn('chartjs-chart-financial exports missing; candlestick charts will not render.');
			return;
		}

		Chart.register(...registerables);
		window.__financialControllersRegistered = true;
	}

function ensureDateAdapter() {
	if (typeof Chart === 'undefined' || !Chart._adapters || !Chart._adapters._date || typeof Chart._adapters._date.override !== 'function') {
		console.warn('Chart.js date adapter container not available; time-series charts may not render correctly.');
		return;
	}

	if (typeof luxon === 'undefined' || !luxon.DateTime) {
		console.warn('Luxon is required for time-based charts. Please confirm the Luxon script is loaded.');
		return;
	}

	const { DateTime } = luxon;
	const UNIT_MAP = {
		millisecond: 'milliseconds',
		second: 'seconds',
		minute: 'minutes',
		hour: 'hours',
		day: 'days',
		week: 'weeks',
		isoWeek: 'weeks',
		month: 'months',
		quarter: 'quarters',
		year: 'years'
	};

	const FORMATS = {
		datetime: 'yyyy-LL-dd HH:mm',
		millisecond: 'HH:mm:ss.SSS',
		second: 'HH:mm:ss',
		minute: 'HH:mm',
		hour: 'HH:mm',
		day: 'yyyy-LL-dd',
		week: "kkkk-'W'WW",
		month: 'yyyy-LL',
		quarter: "yyyy-'Q'q",
		year: 'yyyy'
	};

	const coerceMillis = value => {
		if (value === null || value === undefined) {
			return null;
		}
		if (typeof value === 'number' && Number.isFinite(value)) {
			return value;
		}
		if (value instanceof Date) {
			return value.getTime();
		}
		if (typeof value === 'string' && value.trim().length) {
			let dt = DateTime.fromISO(value);
			if (!dt.isValid) {
				dt = DateTime.fromRFC2822(value);
			}
			if (!dt.isValid) {
				dt = DateTime.fromSQL(value);
			}
			return dt.isValid ? dt.toMillis() : null;
		}
		if (typeof value === 'object' && value !== null && 'x' in value) {
			return coerceMillis(value.x);
		}
		return null;
	};

	const safeParse = (value, format) => {
		if (format && typeof value === 'string') {
			const dt = DateTime.fromFormat(value, format);
			return dt.isValid ? dt.toMillis() : null;
		}
		return coerceMillis(value);
	};

	const asLuxonUnit = unit => UNIT_MAP[unit] || unit;

	Chart._adapters._date.override({
		_id: 'luxon-fallback',
		formats() {
			return FORMATS;
		},
		parse(value, format) {
			return safeParse(value, format);
		},
		format(time, format) {
			const dt = DateTime.fromMillis(time);
			return dt.isValid ? dt.toFormat(format || FORMATS.datetime) : '';
		},
		add(time, amount, unit) {
			const targetUnit = asLuxonUnit(unit);
			return DateTime.fromMillis(time).plus({ [targetUnit]: amount }).toMillis();
		},
		diff(max, min, unit) {
			const targetUnit = asLuxonUnit(unit);
			const duration = DateTime.fromMillis(max).diff(DateTime.fromMillis(min), targetUnit);
			if (typeof duration.as === 'function') {
				return duration.as(targetUnit);
			}
			return duration[targetUnit] || 0;
		},
		startOf(time, unit, weekday) {
			let dt = DateTime.fromMillis(time);
			if (unit === 'isoWeek') {
				const isoWeekday = weekday || 1;
				dt = dt.set({ weekday: isoWeekday }).startOf('day');
				if (dt.weekday !== isoWeekday) {
					dt = dt.minus({ weeks: 1 });
				}
				return dt.startOf('day').toMillis();
			}
			return dt.startOf(unit).toMillis();
		},
		endOf(time, unit) {
			if (unit === 'isoWeek') {
				return DateTime.fromMillis(time).endOf('week').toMillis();
			}
			return DateTime.fromMillis(time).endOf(unit).toMillis();
		}
	});
}

// ===== CLEANUP =====
window.addEventListener('beforeunload', () => {
	stopAutoRefresh();
	Object.values(dashboardState.charts).forEach(instance => {
		if (instance && typeof instance.destroy === 'function') {
			instance.destroy();
		}
	});
});

