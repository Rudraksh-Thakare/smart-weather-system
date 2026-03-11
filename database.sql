-- Smart Weather Database Schema (PostgreSQL)

-- 1. Users Table (for potential login/preferences)
CREATE TABLE IF NOT EXISTS Users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. PushSubscriptions Table (for background alerts/suggestions)
CREATE TABLE IF NOT EXISTS PushSubscriptions (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES Users(id) ON DELETE CASCADE,
    endpoint TEXT UNIQUE NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. SavedLocations Table (for user's favorite cities)
CREATE TABLE IF NOT EXISTS SavedLocations (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES Users(id) ON DELETE CASCADE,
    city_name VARCHAR(100) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. WeatherHistory Table (for trends and charts)
CREATE TABLE IF NOT EXISTS WeatherHistory (
    id SERIAL PRIMARY KEY,
    city_name VARCHAR(100) NOT NULL,
    temperature DECIMAL(5, 2) NOT NULL,
    humidity INT NOT NULL,
    rainfall DECIMAL(5, 2) DEFAULT 0.0,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Alerts Table (for hyperlocal alerts pushed by admin/system)
CREATE TABLE IF NOT EXISTS Alerts (
    id SERIAL PRIMARY KEY,
    alert_type VARCHAR(50) NOT NULL, -- e.g., 'Heavy Rain', 'Storm', 'High UV'
    description TEXT NOT NULL,
    target_area VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL, -- e.g., 'Low', 'Medium', 'High', 'Critical'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    push_sent BOOLEAN DEFAULT FALSE
);


