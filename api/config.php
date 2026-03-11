<?php
// api/config.php

// Load Environment Variables
$envPath = __DIR__ . '/env.php';
if (!file_exists($envPath)) {
    die("env.php file missing! Please rename env.php.example to env.php and fill in your keys.");
}
$env = require $envPath;

// Database configuration
define('DB_HOST', $env['DB_HOST']);
define('DB_PORT', $env['DB_PORT']);
define('DB_NAME', $env['DB_NAME']);
define('DB_USER', $env['DB_USER']);
define('DB_PASS', $env['DB_PASS']);

// API Keys (Now securely hidden on the server)
define('OPENWEATHER_API_KEY', $env['OPENWEATHER_API_KEY']);
define('WAQI_API_KEY', $env['WAQI_API_KEY']);

// Cross-Origin Resource Sharing (CORS) Headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}
?>
