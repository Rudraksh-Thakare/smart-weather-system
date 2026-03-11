/* assets/js/map.js */

document.addEventListener('DOMContentLoaded', () => {
    // Only execute if we have a map container on the page
    const mapElement = document.getElementById('weather-map');
    if (!mapElement) return;

    let map = null;
    let currentMarker = null;

    // Default to Pune coordinates if geolocation fails or before it loads
    const defaultLat = 18.5204;
    const defaultLng = 73.8567;

    initLeafletMap(defaultLat, defaultLng);

    // Try to get user's real location to center the map
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                map.setView([pos.coords.latitude, pos.coords.longitude], 10);
                triggerMapClick(pos.coords.latitude, pos.coords.longitude);
            },
            (error) => {
                console.log("Geolocation denied for map, staying at default.");
                triggerMapClick(defaultLat, defaultLng);
            }
        );
    } else {
        triggerMapClick(defaultLat, defaultLng);
    }

    // ----------------------------------------------------
    // INITIALIZATION
    // ----------------------------------------------------
    function initLeafletMap(lat, lng) {
        // Create the map, zoom level 5 (country/state level)
        map = L.map('weather-map').setView([lat, lng], 5);

        // Add standard OpenStreetMap tiles
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(map);

        // Map Click Event Listener
        map.on('click', function (e) {
            triggerMapClick(e.latlng.lat, e.latlng.lng);
        });
    }

    // ----------------------------------------------------
    // DATA FETCHING AGGREGATOR
    // ----------------------------------------------------
    async function triggerMapClick(lat, lng) {
        // Place a temporary marker saying "Loading"
        if (currentMarker) {
            map.removeLayer(currentMarker);
        }

        currentMarker = L.marker([lat, lng]).addTo(map)
            .bindPopup('<div class="map-loading"><i class="fa-solid fa-circle-notch fa-spin"></i> Analyzing area...</div>')
            .openPopup();

        try {
            // 1. Fetch Weather from Secure Proxy
            const weatherRes = await fetch(`${API_BASE_URL}proxy.php?service=weather&lat=${lat}&lon=${lng}`);
            const weatherData = await weatherRes.json();

            // 2. Fetch AQI from Secure Proxy
            const aqiRes = await fetch(`${API_BASE_URL}proxy.php?service=aqi&lat=${lat}&lon=${lng}`);
            const aqiData = await aqiRes.json();

            // Compile everything into a beautiful popup
            renderPopupDetails(lat, lng, weatherData, aqiData);

        } catch (e) {
            console.error(e);
            currentMarker.bindPopup('<div style="color:red; padding:10px;">Failed to load data for this location.</div>').openPopup();
        }
    }

    // ----------------------------------------------------
    // POPUP RENDERER
    // ----------------------------------------------------
    function renderPopupDetails(lat, lng, w, a) {
        // Handle cases where clicking in the ocean returns no direct city name for weather
        const locationName = w.name && w.name.trim() !== "" ? `${w.name}, ${w.sys.country}` : `Lat: ${lat.toFixed(2)}, Lng: ${lng.toFixed(2)}`;

        // Weather Vars
        const temp = w.main ? Math.round(w.main.temp) : '--';
        const humidity = w.main ? w.main.humidity : '--';
        const condition = w.weather ? w.weather[0].description : 'Unknown';
        const icon = w.weather ? `https://openweathermap.org/img/wn/${w.weather[0].icon}.png` : '';

        // AQI Vars
        let aqiStr = '<span style="color:gray">AQI Data Unavailable</span>';
        if (a.status === 'ok' && a.data && a.data.aqi) {
            const aqiVal = a.data.aqi;
            const aqiMeta = getAQIMetadata(aqiVal);
            aqiStr = `<span style="color:${aqiMeta.color}; font-weight:bold;">${aqiVal} - ${aqiMeta.label}</span>`;
        }

        // Generate Smart Farm/Suggestion Advisory based on Temp/Condition
        let advisory = "Conditions are stable. Favorable for general outdoor activities.";
        let advisoryIcon = "fa-check";
        let advisoryColor = "var(--alert-success)";

        if (w.weather) {
            const lowerCond = w.weather[0].main.toLowerCase();
            if (lowerCond.includes('rain') || lowerCond.includes('thunderstorm') || lowerCond.includes('drizzle')) {
                advisory = "<b>Farmer Alert:</b> Heavy soil moisture expected. Pause pesticide spraying to prevent runoff.";
                advisoryIcon = "fa-spray-can-sparkles";
                advisoryColor = "var(--alert-danger)";
            } else if (temp > 35) {
                advisory = "<b>Health Warning:</b> Extreme heat temperatures. High heatstroke risk over prolonged exposure.";
                advisoryIcon = "fa-temperature-arrow-up";
                advisoryColor = "var(--alert-warning)";
            } else if (temp < 10) {
                advisory = "<b>Farmer Alert:</b> Cold wave potential. Consider frost protection measures for sensitive crops.";
                advisoryIcon = "fa-snowflake";
                advisoryColor = "var(--alert-info)";
            }
        }

        // Build HTML for Popup Inside Map
        const html = `
            <div style="min-width: 220px;">
                <div class="map-popup-header">
                    <i class="fa-solid fa-location-dot" style="color:var(--accent)"></i> ${locationName}
                </div>
                
                <div style="display:flex; align-items:center; gap:0.5rem; justify-content:center; margin-bottom:10px;">
                    ${icon ? `<img src="${icon}" style="width:40px; height:40px; background:rgba(0,0,0,0.1); border-radius:50%;">` : ''}
                    <div style="font-size:1.8rem; font-weight:700;">${temp}°C</div>
                </div>

                <div class="map-stat-row">
                    <i class="fa-solid fa-cloud" style="color:var(--text-secondary); width:20px;"></i>
                    <span style="text-transform:capitalize;">${condition}</span>
                </div>
                <div class="map-stat-row">
                    <i class="fa-solid fa-droplet" style="color:var(--accent); width:20px;"></i>
                    <span>Humidity: ${humidity}%</span>
                </div>
                <div class="map-stat-row">
                    <i class="fa-solid fa-lungs" style="color:#a855f7; width:20px;"></i>
                    <span>${aqiStr}</span>
                </div>

                <div class="map-advisory" style="border-left-color:${advisoryColor};">
                    <i class="fa-solid ${advisoryIcon}" style="color:${advisoryColor}"></i> ${advisory}
                </div>
            </div>
        `;

        currentMarker.bindPopup(html).openPopup();
    }

    // Helper for AQI Coloring inside map
    function getAQIMetadata(aqi) {
        if (aqi <= 50) return { label: 'Good', color: '#009966' };
        if (aqi <= 100) return { label: 'Moderate', color: '#ffde33' };
        if (aqi <= 150) return { label: 'Sensitive', color: '#ff9933' };
        if (aqi <= 200) return { label: 'Unhealthy', color: '#cc0033' };
        if (aqi <= 300) return { label: 'Very Unhealthy', color: '#660099' };
        return { label: 'Hazardous', color: '#7e0023' };
    }
});
