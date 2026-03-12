<?php
// api/config.php

// Load Environment Variables
$envPath = __DIR__ . '/env.php';

if (file_exists($envPath)) {
    // Local development - load from env.php
    $env = require $envPath;
}
else {
    // Railway production - load from environment variables
    $env = [
        'DB_HOST' => getenv('DB_HOST'),
        'DB_PORT' => getenv('DB_PORT'),
        'DB_NAME' => getenv('DB_NAME'),
        'DB_USER' => getenv('DB_USER'),
        'DB_PASS' => getenv('DB_PASSWORD'),
        'OPENWEATHER_API_KEY' => getenv('OPENWEATHER_API_KEY'),
        'WAQI_API_KEY' => getenv('WAQI_API_KEY'),
    ];
}

// Database configuration
define('DB_HOST', $env['DB_HOST']);
define('DB_PORT', $env['DB_PORT']);
define('DB_NAME', $env['DB_NAME']);
define('DB_USER', $env['DB_USER']);
define('DB_PASS', $env['DB_PASS']);

// API Keys
define('OPENWEATHER_API_KEY', $env['OPENWEATHER_API_KEY']);
define('WAQI_API_KEY', $env['WAQI_API_KEY']);

// CORS Headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}
?>