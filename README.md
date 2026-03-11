# Smart Weather Advisory System

A full-stack, hyper-local weather advisory web application built for an MCA final project. It features real-time weather tracking, API integrations, farmer-specific advisories, background push notifications, and historical weather trends.

## 🚀 Features
- **Intelligent Weather Dashboard:** Dynamic outfit/activity suggestions based on time of day (Day/Night).
- **Interactive Map:** Leaflet.js map allowing you to click anywhere globally for instant weather and AQI.
- **Farmer Dashboard:** 7-day rainfall forecasts and context-aware harvesting/pesticide alerts.
- **Air Quality Index:** WAQI integration.
- **Trends:** Chart.js historical data charts querying the Open-Meteo REST API.
- **Web Push Notifications:** Service Worker logic and a dedicated PowerShell daemon (`start_automation.ps1`) for background alerts.
- **Secure Authentication:** PHP Bcrypt hashing and Session Management.

## 💻 Tech Stack
- Frontend: HTML5, CSS3 (Glassmorphism), Vanilla JavaScript
- Backend: PHP 8+, PostgreSQL (PDO)
- Libraries: Chart.js, Leaflet.js
- APIs: OpenWeatherMap, WAQI, Open-Meteo

## 🛠️ How to Run Locally

1. **Install XAMPP** (with PostgreSQL enabled in `php.ini`).
2. Clone this repository into `C:\xampp\htdocs\smart weather`.
3. Open pgAdmin, create a database named `smart_weather`.
4. Run the queries inside `database.sql` to generate the tables.
5. Rename `api/env.php.example` to `api/env.php`.
6. Open `api/env.php` and insert your PostgreSQL password and your Free API keys.
7. Navigate to `http://localhost/smart weather` in your browser.

## 🌐 Deploying to Production (InfinityFree, Render, etc.)
This repository is pre-configured with a Secure PHP Proxy (`api/proxy.php`). 
- **Your API Keys and Database Passwords are NOT exposed in the frontend.** 
- Make sure that when you upload your files, you create a new `env.php` on the server and do **NOT** upload your local `.env` keys to GitHub.
