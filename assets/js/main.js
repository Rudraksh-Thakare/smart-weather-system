/* assets/js/main.js */

// ============================================
// CONFIGURATION
// ============================================

// Dynamic Base URL so it works locally and on real hosting (like InfinityFree or Render)
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE_URL = isLocal ? 'http://localhost/smart weather/api/' : `${window.location.origin}/api/`;

// ============================================
// THEME MANAGEMENT
// ============================================
const themeToggle = document.getElementById('theme-toggle');
const rootElement = document.documentElement;

// Check for saved theme preference
const savedTheme = localStorage.getItem('theme') || 'light';
rootElement.setAttribute('data-theme', savedTheme);
updateThemeIcon(savedTheme);

if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        const currentTheme = rootElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';

        rootElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    });
}

function updateThemeIcon(theme) {
    if (!themeToggle) return;
    if (theme === 'dark') {
        themeToggle.innerHTML = '<i class="fa-solid fa-sun"></i>';
    } else {
        themeToggle.innerHTML = '<i class="fa-solid fa-moon"></i>';
    }
}

// ============================================
// GEOLOCATION & INITIAL LOAD
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    // Auth Guard check on initial load for protected pages
    if (!window.location.pathname.includes('login.html')) {
        const isAuth = await checkAuth();
        if (!isAuth) {
            window.location.href = 'login.html';
            return; // Stop execution
        }
    }

    // Add logout listener if button exists
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            await fetch(`${API_BASE_URL}logout.php`);
            window.location.href = 'login.html';
        });
    }

    // Check if on dashboard
    if (document.getElementById('dashboard-content')) {
        initDashboard();
    }

    // Check if on Farmer page
    if (document.getElementById('farmer-content')) {
        initFarmer();
    }

    // Check if on AQI page
    if (document.getElementById('aqi-content')) {
        initAQI();
    }

    // Check if on Alerts page
    if (document.getElementById('alerts-container')) {
        fetchAlerts();
    }
}); // <-- End of DOMContentLoaded

// ============================================
// PUSH NOTIFICATIONS & SERVICE WORKERS
// ============================================

const PUBLIC_VAPID_KEY = 'BC6-x0wM19541hH1H2rO_B0XbMpwf8vN75lJg4y4r9aEwV52z80VnYh0Fw5G0l-d0VjC4GkU1q2b53Z0J5Ww0yE';

async function registerServiceWorkerAndPush() {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
        try {
            const registration = await navigator.serviceWorker.register('sw.js');
            console.log('Service Worker registered successfully');

            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                const subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
                });

                // Get user's location to attach to the subscription
                navigator.geolocation.getCurrentPosition(
                    async (position) => {
                        const subData = {
                            subscription: subscription,
                            lat: position.coords.latitude,
                            lon: position.coords.longitude
                        };

                        await fetch(`${API_BASE_URL}subscribe.php`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(subData)
                        });
                        console.log("Subscribed to personalized push notifications with location.");
                    },
                    async (error) => {
                        // Fallback if they block location but allow notifications
                        console.warn("Location denied for push notifications. Falling back to default (Pune).");
                        const subData = {
                            subscription: subscription,
                            lat: 18.5204,
                            lon: 73.8567
                        };

                        await fetch(`${API_BASE_URL}subscribe.php`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(subData)
                        });
                        console.log("Subscribed to default push notifications.");
                    }
                );
            }
        } catch (e) {
            console.error('Service Worker / Push Registration failed', e);
        }
    }
}

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

// ============================================
// AUTHENTICATION GUARD
// ============================================
async function checkAuth() {
    try {
        const res = await fetch(`${API_BASE_URL}auth.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'check' })
        });
        const data = await res.json();

        if (data.status === 'success' && data.logged_in) {
            registerServiceWorkerAndPush(); // Initiate push sub on verified login
            return true;
        }
        return false;
    } catch (e) {
        console.error("Auth check failed", e);
        return false;
    }
}

function initDashboard() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                fetchWeatherData(lat, lon);
            },
            (error) => {
                showError("Geolocation denied or unavailable. Showing default location (Pune).");
                fetchWeatherData(18.5204, 73.8567); // Default to Pune
            }
        );
    } else {
        showError("Geolocation is not supported by this browser.");
        fetchWeatherData(18.5204, 73.8567);
    }
}

// ============================================
// WEATHER API INTERACTIONS
// ============================================
async function fetchWeatherData(lat, lon) {
    showLoader(true);
    try {
        // Fetch Current Weather via Secure Proxy
        const weatherUrl = `${API_BASE_URL}proxy.php?service=weather&lat=${lat}&lon=${lon}`;
        const weatherResponse = await fetch(weatherUrl);
        const weatherData = await weatherResponse.json();

        // Fetch 5-Day Forecast via Secure Proxy
        const forecastUrl = `${API_BASE_URL}proxy.php?service=forecast&lat=${lat}&lon=${lon}`;
        const forecastResponse = await fetch(forecastUrl);
        const forecastData = await forecastResponse.json();

        if (weatherData.cod === 200 || weatherData.cod === "200") {
            updateDashboardUI(weatherData, forecastData);
            saveHistoryToDB(weatherData); // Save to backend asynchronously
        } else {
            showError("Weather API error inside proxy. Check env.php.");
        }
    } catch (error) {
        showError("Error connecting to weather service.");
        console.error(error);
    } finally {
        showLoader(false);
    }
}

function updateDashboardUI(current, forecast) {
    const locDisplay = document.getElementById('location-display');
    const weatherContainer = document.getElementById('current-weather');
    const forecastContainer = document.getElementById('forecast-container');
    const dashboardContent = document.getElementById('dashboard-content');

    if (locDisplay) locDisplay.innerHTML = `<i class="fa-solid fa-location-dot"></i> ${current.name}, ${current.sys.country}`;

    // Current weather markup
    const iconUrl = `https://openweathermap.org/img/wn/${current.weather[0].icon}@4x.png`;
    weatherContainer.innerHTML = `
        <img src="${iconUrl}" alt="${current.weather[0].description}" class="weather-icon-large">
        <div class="temp-large">${Math.round(current.main.temp)}°C</div>
        <div class="weather-desc">${current.weather[0].description}</div>
        
        <div class="weather-details">
            <div class="detail-item">
                <i class="fa-solid fa-droplet" style="color:var(--accent)"></i>
                <span>Humidity</span>
                <span class="detail-value">${current.main.humidity}%</span>
            </div>
            <div class="detail-item">
                <i class="fa-solid fa-wind" style="color:var(--text-secondary)"></i>
                <span>Wind</span>
                <span class="detail-value">${current.wind.speed} m/s</span>
            </div>
            <div class="detail-item">
                <i class="fa-solid fa-temperature-half" style="color:var(--alert-danger)"></i>
                <span>Feels Like</span>
                <span class="detail-value">${Math.round(current.main.feels_like)}°C</span>
            </div>
        </div>
    `;

    // 5-Day Forecast Processing (OpenWeather returns 3hr intervals, so get one per day around noon)
    forecastContainer.innerHTML = '';
    const dailyForecasts = forecast.list.filter(item => item.dt_txt.includes("12:00:00"));

    dailyForecasts.forEach(day => {
        const date = new Date(day.dt * 1000).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        const icon = `https://openweathermap.org/img/wn/${day.weather[0].icon}.png`;
        forecastContainer.innerHTML += `
            <div class="forecast-item">
                <span style="font-weight: 500;">${date}</span>
                <img src="${icon}" alt="${day.weather[0].description}">
                <span>${Math.round(day.main.temp)}°C</span>
            </div>
        `;
    });

    dashboardContent.style.display = 'grid'; // Enable Grid (it's grid in CSS, not just block)

    // Generate Suggestions based on current weather
    generateSuggestions(current);
}

// ============================================
// FARMER MODE
// ============================================

function initFarmer() {
    // Setup Crop Selector event listener if on farmer page
    const cropSelector = document.getElementById('crop-selector');
    if (cropSelector) {
        // Load saved preference
        const savedCrop = localStorage.getItem('farmer_active_crop');
        if (savedCrop) cropSelector.value = savedCrop;
        
        // Listen for changes
        cropSelector.addEventListener('change', (e) => {
            localStorage.setItem('farmer_active_crop', e.target.value);
            // Re-fetch and re-render data immediately
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (pos) => fetchFarmerData(pos.coords.latitude, pos.coords.longitude),
                    () => fetchFarmerData(18.5204, 73.8567)
                );
            } else {
                fetchFarmerData(18.5204, 73.8567);
            }
        });
    }

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                fetchFarmerData(position.coords.latitude, position.coords.longitude);
            },
            (error) => {
                showError("Geolocation denied or unavailable. Showing default location (Pune).");
                fetchFarmerData(18.5204, 73.8567);
            }
        );
    } else {
        showError("Geolocation is not supported by this browser.");
        fetchFarmerData(18.5204, 73.8567);
    }
}

async function fetchFarmerData(lat, lon) {
    showLoader(true);
    try {
        const forecastUrl = `${API_BASE_URL}proxy.php?service=forecast&lat=${lat}&lon=${lon}`;
        const forecastResponse = await fetch(forecastUrl);
        const forecastData = await forecastResponse.json();

        if (forecastData.cod === 200 || forecastData.cod === "200") {
            updateFarmerUI(forecastData);
        } else {
            showError("Weather API error inside proxy. Check env.php.");
        }
    } catch (error) {
        showError("Error connecting to weather service.");
        console.error(error);
    } finally {
        showLoader(false);
    }
}

function updateFarmerUI(forecast) {
    const listContainer = document.getElementById('farmer-forecast-list');
    const adviceContainer = document.getElementById('farmer-advice-list');
    
    if (!listContainer || !adviceContainer) return;
    
    listContainer.innerHTML = '';
    
    // Process forecast data to get max probability of precipitation per day
    const dailyData = {};
    forecast.list.forEach(item => {
        const date = new Date(item.dt * 1000).toLocaleDateString('en-US');
        if (!dailyData[date]) {
            dailyData[date] = { 
                pop: 0, 
                temp: item.main.temp,
                icon: item.weather[0].icon,
                description: item.weather[0].description,
                rain: 0,
                dt: item.dt
            };
        }
        // Take max POP for the day
        if (item.pop > dailyData[date].pop) {
            dailyData[date].pop = item.pop;
            dailyData[date].icon = item.weather[0].icon;
            dailyData[date].description = item.weather[0].description;
        }
    });

    const days = Object.values(dailyData).slice(0, 5); // 5 days
    let maxRainChance = 0;
    let highRainDay = null;

    days.forEach((day, index) => {
        let label = index === 0 ? "Today" : index === 1 ? "Tomorrow" : `Day ${index + 1}`;
        let popPercent = Math.round(day.pop * 100);
        let iconClass = "fa-cloud-sun";
        let colorStyle = "";
        
        if (popPercent > maxRainChance && index > 0) { // skip checking max for today's past hours
            maxRainChance = popPercent;
            highRainDay = label;
        }

        if (popPercent > 50) {
            iconClass = "fa-cloud-showers-heavy";
            colorStyle = 'style="border-left: 3px solid var(--alert-info)"';
        } else if (popPercent > 20) {
            iconClass = "fa-cloud-rain";
        } else if (day.icon.includes('01')) {
            iconClass = "fa-sun";
        }

        listContainer.innerHTML += `
            <li class="forecast-item" ${colorStyle}>
                <span>${label}</span>
                <span>${popPercent}% chance</span>
                <span><i class="fa-solid ${iconClass}"></i></span>
            </li>
        `;
    });

    // ----------------------------------------------------
    // CROP PROFILE LOGIC
    // ----------------------------------------------------
    // Get the configured crop from localStorage or generic
    const activeCrop = localStorage.getItem('farmer_active_crop') || 'generic';
    
    // Set up threshold profiles for different crops
    const cropProfiles = {
        generic: { minTemp: 15, maxTemp: 25, lowMoisture: 30, okMoisture: 60, name: "Generic crops" },
        wheat:   { minTemp: 12, maxTemp: 25, lowMoisture: 20, okMoisture: 50, name: "Wheat" },
        rice:    { minTemp: 20, maxTemp: 35, lowMoisture: 60, okMoisture: 80, name: "Rice" },
        cotton:  { minTemp: 18, maxTemp: 30, lowMoisture: 35, okMoisture: 55, name: "Cotton" }
    };
    
    const profile = cropProfiles[activeCrop];

    // ----------------------------------------------------
    // ADVANCED SOIL DATA ALGORITHM (Simulated from Current)
    // ----------------------------------------------------
    const currentTemp = days[0].temp;
    
    // Soil Temperature is usually slightly lower than ambient air temperature during the day
    // and slightly higher at night. As a daily average, it closely tracks ambient with a slight lag.
    let soilTemp = currentTemp - 2.5;
    if (soilTemp < 0) soilTemp = 0;

    // Soil Moisture generally depletes over time without rain, but spikes with rain
    // We simulate it based on the recent POP and current humidity
    let baseMoisture = forecast.list[0].main.humidity * 0.4;
    let popMoistureBonus = days[0].pop * 40; 
    let soilMoisture = Math.min(100, Math.max(10, Math.round(baseMoisture + popMoistureBonus)));

    // Evapotranspiration (ET) - approximation of crop water loss
    // Higher temp + lower humidity = higher water loss
    let eto = (currentTemp * 0.15) + ((100 - forecast.list[0].main.humidity) * 0.05);
    if (eto < 0) eto = 0.5;
    
    // Unhide the card and inject data
    const soilCard = document.getElementById('soil-data-card');
    if (soilCard) soilCard.style.display = 'flex';
    
    document.getElementById('farmer-soil-temp').textContent = `${soilTemp.toFixed(1)}°C`;
    document.getElementById('farmer-soil-moisture').textContent = `${soilMoisture}%`;
    document.getElementById('farmer-evapo').textContent = `${eto.toFixed(1)} mm/d`;

    // ----------------------------------------------------
    // SMART ADVICE GENERATOR (Upgraded for Crop Profiles)
    // ----------------------------------------------------
    adviceContainer.innerHTML = '';
    
    // 1. SOWING ADVISORY
    if (soilTemp >= profile.minTemp && soilTemp <= profile.maxTemp && days[0].pop < 0.3) {
        adviceContainer.innerHTML += `
            <div class="suggestion-box success">
                <i class="fa-solid fa-seedling"></i>
                <div>
                    <strong>Sowing Advisory (${profile.name})</strong> <br>
                    Soil temperature is optimal (${soilTemp.toFixed(1)}°C). Favorable dry conditions expected for immediately planting ${profile.name.toLowerCase()}.
                </div>
            </div>
        `;
    } else if (soilTemp < profile.minTemp) {
        adviceContainer.innerHTML += `
            <div class="suggestion-box danger">
                <i class="fa-solid fa-temperature-arrow-down"></i>
                <div>
                    <strong>Sowing Alert (${profile.name})</strong> <br>
                    Soil is too cold for ${profile.name.toLowerCase()} germination (${soilTemp.toFixed(1)}°C). Delay planting until soil warms to at least ${profile.minTemp}°C.
                </div>
            </div>
        `;
    } else {
        adviceContainer.innerHTML += `
            <div class="suggestion-box warning">
                <i class="fa-solid fa-seedling"></i>
                <div>
                    <strong>Sowing Advisory (${profile.name})</strong> <br>
                    Rain expected or soil temperature (${soilTemp.toFixed(1)}°C) is not ideal for ${profile.name.toLowerCase()}. Monitor conditions closures before sowing.
                </div>
            </div>
        `;
    }

    // 2. IRRIGATION ADVISORY (Uses dynamic profile moisture limits)
    if (soilMoisture < profile.lowMoisture && maxRainChance < 30) {
        adviceContainer.innerHTML += `
            <div class="suggestion-box danger">
                <i class="fa-solid fa-droplet-slash"></i>
                <div>
                    <strong>Irrigation Alert (${profile.name})</strong> <br>
                    Critical! Soil moisture is critically low for ${profile.name.toLowerCase()} (${soilMoisture}%) and water loss is ${eto.toFixed(1)} mm/d. <b>Irrigate immediately</b>.
                </div>
            </div>
        `;
    } else if (soilMoisture >= profile.lowMoisture && soilMoisture < profile.okMoisture && maxRainChance < 50) {
        adviceContainer.innerHTML += `
            <div class="suggestion-box warning">
                <i class="fa-solid fa-faucet-drip"></i>
                <div>
                    <strong>Irrigation Advisory (${profile.name})</strong> <br>
                    Soil moisture is dropping (${soilMoisture}%). Schedule light irrigation for your ${profile.name.toLowerCase()} to compensate for ${eto.toFixed(1)} mm/d evaporation.
                </div>
            </div>
        `;
    } else if (soilMoisture >= profile.okMoisture) {
        adviceContainer.innerHTML += `
            <div class="suggestion-box success">
                <i class="fa-solid fa-water"></i>
                <div>
                    <strong>Irrigation Advisory (${profile.name})</strong> <br>
                    Soil moisture is excellent for ${profile.name.toLowerCase()} (${soilMoisture}%). No irrigation required at this time.
                </div>
            </div>
        `;
    }

    // 3. PESTICIDE / HARVEST ADVISORY (Classic)
    if (maxRainChance > 40) {
        adviceContainer.innerHTML += `
            <div class="suggestion-box danger">
                <i class="fa-solid fa-spray-can-sparkles"></i>
                <div>
                    <strong>Pesticide Alert</strong> <br>
                    ${maxRainChance}% chance of rain on ${highRainDay}. <b>Avoid pesticide/fertilizer spraying</b> before this period to prevent wash-off.
                </div>
            </div>
            <div class="suggestion-box warning">
                <i class="fa-solid fa-wheat-awn"></i>
                <div>
                    <strong>Harvesting Advisory</strong> <br>
                    Expected rain on ${highRainDay}. Accelerate harvesting or protect harvested crops.
                </div>
            </div>
        `;
    } else {
        adviceContainer.innerHTML += `
            <div class="suggestion-box success">
                <i class="fa-solid fa-spray-can-sparkles"></i>
                <div>
                    <strong>Spraying Advisory</strong> <br>
                    Low rain chance for the next few days. Ideal conditions for pesticide or fertilizer application.
                </div>
            </div>
        `;
    }
}

// ============================================
// OUTFIT & ACTIVITY SUGGESTION SYSTEM
// ============================================
function generateSuggestions(weather) {
    const temp = weather.main.temp;
    const condition = weather.weather[0].main.toLowerCase(); // Rain, Clear, Clouds, etc.
    const container = document.getElementById('suggestions-container');

    if (!container) return;

    // Check if it's daytime using API timestamps
    const now = weather.dt;
    const sunrise = weather.sys.sunrise;
    const sunset = weather.sys.sunset;
    const isDay = (now >= sunrise && now < sunset);

    container.innerHTML = ''; // Clear previous

    let suggestions = [];

    // Temperature based
    if (temp < 15) {
        suggestions.push({ type: 'info', icon: 'fa-mitten', text: 'It\'s chilly outside! We recommend wearing a warm jacket.' });
        suggestions.push({ type: 'warning', icon: 'fa-mug-hot', text: isDay ? 'Advisory: A great time for indoor activities or a hot beverage.' : 'Advisory: A cold night. Keep warm and enjoy a hot beverage.' });
    } else if (temp >= 15 && temp < 28) {
        suggestions.push({ type: 'success', icon: 'fa-tshirt', text: 'Perfect weather detected. Comfortable, light clothing is fine.' });
        suggestions.push({ type: 'success', icon: 'fa-person-walking', text: isDay ? 'Advisory: Optimal conditions for a walk or outdoor sports.' : 'Advisory: A pleasant evening. Great for an evening stroll.' });
    } else if (temp >= 28) {
        suggestions.push({ type: 'warning', icon: 'fa-hat-cowboy', text: isDay ? 'It\'s getting hot. Breathable clothing and a hat are advised.' : 'It\'s quite warm tonight. Breathable clothing is advised.' });

        if (isDay) {
            suggestions.push({ type: 'danger', icon: 'fa-bottle-water', text: 'Advisory: Please stay hydrated and avoid prolonged sun exposure.' });
        } else {
            suggestions.push({ type: 'danger', icon: 'fa-fan', text: 'Advisory: Hydrate well. Keep your fans or active cooling devices on tonight to stay comfortable.' });
        }
    }

    // Condition based
    if (condition.includes('rain') || condition.includes('drizzle') || condition.includes('thunderstorm')) {
        suggestions.push({ type: 'info', icon: 'fa-umbrella', text: 'Rain is expected. Don\'t forget your umbrella or raincoat!' });
        suggestions.push({ type: 'warning', icon: 'fa-house', text: 'Advisory: Roads may be slippery. Travel with care.' });
    } else if (condition.includes('clear')) {
        if (isDay) {
            suggestions.push({ type: 'success', icon: 'fa-glasses', text: 'Clear skies! Remember your sunglasses and sunscreen.' });
        } else {
            suggestions.push({ type: 'success', icon: 'fa-moon', text: 'Clear night! Beautiful stargazing conditions expected.' });
        }
    }

    suggestions.forEach(s => {
        container.innerHTML += `
            <div class="suggestion-box ${s.type}">
                <i class="fa-solid ${s.icon}"></i>
                <span>${s.text}</span>
            </div>
        `;
    });
}

// ============================================
// BACKEND INTEGRATIONS
// ============================================
async function saveHistoryToDB(weather) {
    try {
        await fetch(`${API_BASE_URL}save_history.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                city_name: weather.name,
                temperature: weather.main.temp,
                humidity: weather.main.humidity,
                rainfall: weather.rain && weather.rain['1h'] ? weather.rain['1h'] : 0.0
            })
        });
        // Silent save, errors logged but not shown to interrupt UI
    } catch (e) {
        console.error("Failed to save history to DB", e);
    }
}

async function fetchAlerts() {
    const container = document.getElementById('alerts-container');
    showLoader(true);
    try {
        const response = await fetch(`${API_BASE_URL}get_alerts.php`);
        const result = await response.json();

        if (result.status === 'success' && result.data.length > 0) {
            container.innerHTML = '';
            result.data.forEach(alert => {
                const typeClass = alert.severity.toLowerCase(); // critical, high, medium, low
                const icon = getAlertIcon(alert.alert_type);
                container.innerHTML += `
                    <div class="card glass alert-card ${typeClass}" style="margin-bottom: 1rem;">
                        <h3 style="display:flex; align-items:center; gap:0.5rem;">
                            <i class="fa-solid ${icon}"></i> ${alert.alert_type}
                        </h3>
                        <p style="margin-top:0.5rem;">${alert.description}</p>
                        <div style="font-size:0.85rem; color:var(--text-secondary); margin-top:1rem; display:flex; justify-content:space-between;">
                            <span><i class="fa-solid fa-location-crosshairs"></i> Area: ${alert.target_area}</span>
                            <span><i class="fa-solid fa-clock"></i> Recorded: ${new Date(alert.created_at).toLocaleString()}</span>
                        </div>
                    </div>
                `;
            });
        } else {
            container.innerHTML = '<div class="card glass"><p>No active alerts at this time.</p></div>';
        }
    } catch (e) {
        if (container) container.innerHTML = '<div style="color:red">Failed to load alerts from DB.</div>';
    } finally {
        showLoader(false);
    }
}

function getAlertIcon(type) {
    const t = type.toLowerCase();
    if (t.includes('rain') || t.includes('flood')) return 'fa-cloud-showers-heavy';
    if (t.includes('storm') || t.includes('thunder')) return 'fa-poo-storm';
    if (t.includes('uv') || t.includes('heat')) return 'fa-fire';
    if (t.includes('cold') || t.includes('snow')) return 'fa-snowflake';
    return 'fa-triangle-exclamation';
}

// ============================================
// AQI AND HEALTH ADVISORY (WAQI)
// ============================================
function initAQI() {
    navigator.geolocation.getCurrentPosition(
        (pos) => fetchAQI(pos.coords.latitude, pos.coords.longitude),
        () => fetchAQI(18.5204, 73.8567) // default
    );
}

async function fetchAQI(lat, lon) {
    showLoader(true);
    const container = document.getElementById('aqi-content');
    try {
        const response = await fetch(`${API_BASE_URL}proxy.php?service=aqi&lat=${lat}&lon=${lon}`);
        const data = await response.json();

        if (data.status === 'ok') {
            const aqi = data.data.aqi;
            const city = data.data.city.name;
            const { category, bg, text, advisory } = getAQIDetails(aqi);

            container.innerHTML = `
                <div class="card glass" style="text-align:center;">
                    <h2>Air Quality in ${city}</h2>
                    <div style="font-size: 5rem; font-weight:700; color:${bg}; margin: 1rem 0;">${aqi}</div>
                    <div style="font-size:1.5rem; font-weight:600; color:${bg};">${category}</div>
                    <p style="margin-top:1rem; color:var(--text-secondary);">${text}</p>
                </div>
                <div class="card glass" style="margin-top:1rem;">
                    <h3><i class="fa-solid fa-notes-medical" style="color:var(--alert-danger)"></i> Health Advisory</h3>
                    <p style="margin-top:0.5rem;">${advisory}</p>
                </div>
            `;
            container.style.display = 'block';
        } else {
            showError("Invalid WAQI Token. Please configure in env.php.");
        }
    } catch (e) {
        console.error("fetchAQI Error Details:", e);
        showError("Failed to fetch Air Quality Data. Check console for details.");
    } finally {
        showLoader(false);
    }
}

function getAQIDetails(aqi) {
    if (aqi <= 50) return { category: 'Good', bg: '#009966', text: 'Air quality is satisfactory, and air pollution poses little or no risk.', advisory: 'No restrictions. Enjoy outdoor activities!' };
    if (aqi <= 100) return { category: 'Moderate', bg: '#ffde33', text: 'Air quality is acceptable. However, there may be a risk for some people.', advisory: 'Unusually sensitive people should consider reducing prolonged or heavy exertion.' };
    if (aqi <= 150) return { category: 'Unhealthy for Sensitive', bg: '#ff9933', text: 'Members of sensitive groups may experience health effects.', advisory: 'People with respiratory or heart disease, the elderly and children should limit prolonged exertion.' };
    if (aqi <= 200) return { category: 'Unhealthy', bg: '#cc0033', text: 'Some members of the general public may experience health effects.', advisory: 'Everyone should begin to limit prolonged outdoor exertion.' };
    if (aqi <= 300) return { category: 'Very Unhealthy', bg: '#660099', text: 'Health warning of emergency conditions: everyone is more likely to be affected.', advisory: 'Avoid prolonged outdoor exertion. Wear an N95 mask if you must go outside.' };
    return { category: 'Hazardous', bg: '#7e0023', text: 'Health alert: everyone may experience more serious health effects.', advisory: 'Remain indoors and keep windows closed. Do not engage in outdoor activities.' };
}

// ============================================
// UTILS
// ============================================
function showLoader(show) {
    const loader = document.getElementById('main-loader');
    if (loader) loader.style.display = show ? 'block' : 'none';
}

function showError(msg) {
    const err = document.getElementById('error-message');
    if (err) {
        err.style.display = 'block';
        err.innerHTML = msg;
    }
}
