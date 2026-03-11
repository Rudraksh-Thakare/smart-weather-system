/* assets/js/charts.js */

document.addEventListener('DOMContentLoaded', () => {
    const chartsContainer = document.getElementById('charts-container');
    if (!chartsContainer) return;

    let tempChartInstance = null;
    let humidityChartInstance = null;
    let rainChartInstance = null;

    const loadBtn = document.getElementById('load-trends-btn');
    const cityInput = document.getElementById('city-input');

    if (loadBtn) {
        loadBtn.addEventListener('click', () => {
            const city = cityInput.value.trim() || 'Pune';
            fetchAndRenderCharts(city);
        });
    }

    // Load default on start
    fetchAndRenderCharts('Pune');

    async function fetchAndRenderCharts(city) {
        showLoader(true);
        const err = document.getElementById('error-message');
        if (err) err.style.display = 'none';

        try {
            // First, get latitude and longitude for the city using our secure backend Proxy
            const encodedCity = encodeURIComponent(city);
            const geoRes = await fetch(`${API_BASE_URL}proxy.php?service=geocode&city=${encodedCity}`);
            const geoJson = await geoRes.json();

            if (!geoJson || geoJson.length === 0) {
                chartsContainer.style.display = 'none';
                showError(`City "${city}" not found. Please try another city name.`);
                showLoader(false);
                return;
            }

            const lat = geoJson[0].lat;
            const lon = geoJson[0].lon;

            // Calculate date range: Past 7 days to today
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(endDate.getDate() - 7);

            const endStr = endDate.toISOString().split('T')[0];
            const startStr = startDate.toISOString().split('T')[0];

            // Fetch real historical data from Open-Meteo API
            const historyUrl = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${startStr}&end_date=${endStr}&hourly=temperature_2m,relative_humidity_2m,rain&timezone=auto`;

            const res = await fetch(historyUrl);
            const json = await res.json();

            if (json.error) {
                throw new Error("Historical data API error");
            }

            // Reformat data to match our chart drawing function
            const formattedData = [];

            // Open-Meteo returns hourly data, let's sample it to avoid overwhelming the chart (e.g. every 6 hours)
            for (let i = 0; i < json.hourly.time.length; i += 6) {
                // If value is null, default to 0
                const temp = json.hourly.temperature_2m[i] !== null ? json.hourly.temperature_2m[i] : 0;
                const hum = json.hourly.relative_humidity_2m[i] !== null ? json.hourly.relative_humidity_2m[i] : 0;
                const rain = json.hourly.rain[i] !== null ? json.hourly.rain[i] : 0;

                formattedData.push({
                    recorded_at: json.hourly.time[i],
                    temperature: temp,
                    humidity: hum,
                    rainfall: rain
                });
            }

            renderCharts(formattedData);

        } catch (e) {
            chartsContainer.style.display = 'none';
            showError("Failed to fetch real historical data. " + e.message);
            console.error(e);
        } finally {
            showLoader(false);
        }
    }

    function renderCharts(data) {
        chartsContainer.style.display = 'grid';

        // Prepare data arrays
        const labels = data.map(row => {
            const d = new Date(row.recorded_at);
            // Example output: 3/11 14:00
            return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:00`;
        });
        const temps = data.map(row => row.temperature);
        const humidities = data.map(row => row.humidity);
        const rainfalls = data.map(row => row.rainfall);

        // Get CSS variables for colors to match theme
        const style = getComputedStyle(document.body);
        const textColor = style.getPropertyValue('--text-primary').trim() || '#333';
        const gridColor = style.getPropertyValue('--card-border').trim() || 'rgba(0,0,0,0.1)';

        // Chart defaults
        Chart.defaults.color = textColor;
        Chart.defaults.font.family = "'Inter', sans-serif";
        const gridOptions = { color: gridColor };

        // 1. Temperature Line Chart
        if (tempChartInstance) tempChartInstance.destroy();
        const ctxTemp = document.getElementById('tempChart').getContext('2d');
        tempChartInstance = new Chart(ctxTemp, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Temperature (°C)',
                    data: temps,
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.2)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { title: { display: true, text: 'Temperature Trend', font: { size: 16 } } },
                scales: {
                    x: { grid: gridOptions },
                    y: { grid: gridOptions }
                }
            }
        });

        // 2. Humidity Bar Chart
        if (humidityChartInstance) humidityChartInstance.destroy();
        const ctxHum = document.getElementById('humidityChart').getContext('2d');
        humidityChartInstance = new Chart(ctxHum, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Humidity (%)',
                    data: humidities,
                    backgroundColor: '#3b82f6',
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { title: { display: true, text: 'Humidity Levels', font: { size: 16 } } },
                scales: {
                    x: { grid: gridOptions },
                    y: { grid: gridOptions, min: 0, max: 100 }
                }
            }
        });

        // 3. Rainfall Bar/Line Chart
        if (rainChartInstance) rainChartInstance.destroy();
        const ctxRain = document.getElementById('rainChart').getContext('2d');
        rainChartInstance = new Chart(ctxRain, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Rainfall (mm)',
                    data: rainfalls,
                    backgroundColor: '#10b981',
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { title: { display: true, text: 'Rainfall Amount', font: { size: 16 } } },
                scales: {
                    x: { grid: gridOptions },
                    y: { grid: gridOptions, min: 0 }
                }
            }
        });
    }

    // Update charts strictly when theme changes
    const observer = new MutationObserver(() => {
        const city = cityInput.value.trim() || 'Pune';
        fetchAndRenderCharts(city);
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
});
