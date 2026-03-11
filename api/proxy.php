<?php
/**
 * api/proxy.php
 * Acts as a secure middleman between the frontend JS and 3rd party APIs.
 * This hides the OPENWEATHER_API_KEY and WAQI_API_KEY from the public GitHub repo.
 */
require_once 'config.php';

header('Content-Type: application/json');

if (!isset($_GET['service'])) {
    die(json_encode(['error' => 'No service specified']));
}

$service = $_GET['service'];

if ($service === 'weather') {
    // Current Weather
    $lat = $_GET['lat'] ?? '';
    $lon = $_GET['lon'] ?? '';
    
    if (empty($lat) || empty($lon)) die(json_encode(['error' => 'Missing coordinates']));
    
    $url = "https://api.openweathermap.org/data/2.5/weather?lat={$lat}&lon={$lon}&units=metric&appid=" . OPENWEATHER_API_KEY;
    $response = file_get_contents($url);
    echo $response;
    
} elseif ($service === 'forecast') {
    // 5-Day Forecast
    $lat = $_GET['lat'] ?? '';
    $lon = $_GET['lon'] ?? '';
    
    if (empty($lat) || empty($lon)) die(json_encode(['error' => 'Missing coordinates']));
    
    $url = "https://api.openweathermap.org/data/2.5/forecast?lat={$lat}&lon={$lon}&units=metric&appid=" . OPENWEATHER_API_KEY;
    $response = file_get_contents($url);
    echo $response;
    
} elseif ($service === 'geocode') {
    // City to Coordinates mapping
    $city = urlencode($_GET['city'] ?? '');
    
    if (empty($city)) die(json_encode(['error' => 'Missing city']));
    
    $url = "https://api.openweathermap.org/geo/1.0/direct?q={$city}&limit=1&appid=" . OPENWEATHER_API_KEY;
    $response = file_get_contents($url);
    echo $response;

} elseif ($service === 'aqi') {
    // Air Quality Index (WAQI)
    $lat = $_GET['lat'] ?? '';
    $lon = $_GET['lon'] ?? '';
    
    if (empty($lat) || empty($lon)) die(json_encode(['error' => 'Missing coordinates']));
    
    $url = "https://api.waqi.info/feed/geo:{$lat};{$lon}/?token=" . WAQI_API_KEY;
    $response = file_get_contents($url);
    echo $response;
    
} else {
    echo json_encode(['error' => 'Invalid service requested']);
}
?>
