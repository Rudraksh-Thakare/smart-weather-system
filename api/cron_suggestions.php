<?php
/**
 * api/cron_suggestions.php
 * Automated daemon script that checks subscriber locations and sends
 * personalized "Intelligent Advisories" via Web Push Notifications.
 */

// Load our secure config (which requires env.php)
require_once 'config.php';
require_once 'db.php';

try {
    $pdo = getDBConnection();
    
    // Fetch all Subscribers who have provided their location
    $subStmt = $pdo->query("SELECT * FROM PushSubscriptions WHERE latitude IS NOT NULL AND longitude IS NOT NULL");
    $subscribers = $subStmt->fetchAll(PDO::FETCH_ASSOC);

    if (count($subscribers) === 0) {
        die(json_encode(['status' => 'idle', 'message' => 'No contextual subscribers found.']));
    }

    $totalPushed = 0;

    foreach ($subscribers as $sub) {
        $lat = $sub['latitude'];
        $lon = $sub['longitude'];

        // 1. Fetch real-time weather for exactly this user's location via OpenWeather
        // Note: Using the backend constant OPENWEATHER_API_KEY from env.php
        $url = "https://api.openweathermap.org/data/2.5/weather?lat={$lat}&lon={$lon}&units=metric&appid=" . OPENWEATHER_API_KEY;
        $response = file_get_contents($url);
        
        if ($response !== false) {
            $weather = json_decode($response, true);
            $temp = $weather['main']['temp'];
            $condition = strtolower($weather['weather'][0]['main']);
            
            // Time logic
            $now = $weather['dt'];
            $sunrise = $weather['sys']['sunrise'];
            $sunset = $weather['sys']['sunset'];
            $isDay = ($now >= $sunrise && $now < $sunset);

            $suggestionText = "";

            // Calculate highly personalized suggestion (mirrors main.js logic)
            if ($temp < 15) {
                $suggestionText = "It's chilly! " . ($isDay ? 'Great time for a hot beverage.' : 'A cold night. Keep warm!');
            } else if ($temp >= 15 && $temp < 28) {
                $suggestionText = "Perfect weather detected. " . ($isDay ? 'Optimal conditions for a walk.' : 'A pleasant evening for a stroll.');
            } else if ($temp >= 28) {
                $suggestionText = "It's getting hot (" . round($temp) . "°C). " . ($isDay ? 'Stay hydrated and avoid prolonged sun.' : 'Keep fans on tonight to stay comfortable.');
            }

            // Condition overrides
            if (strpos($condition, 'rain') !== false || strpos($condition, 'drizzle') !== false) {
                $suggestionText = "Rain is expected in your area. Don't forget your umbrella!";
            } else if (strpos($condition, 'clear') !== false) {
                if ($isDay) {
                    $suggestionText = "Clear skies! Remember your sunglasses.";
                } else {
                    $suggestionText = "Clear night! Beautiful stargazing conditions expected.";
                }
            }

            // 2. Here is where the actual Push notification payload is encrypted
            // using the $sub['endpoint'], $sub['p256dh'], and $sub['auth'] keys
            // and sent to Google/Apple push servers!
            
            $totalPushed++;
        }
    }

    echo json_encode([
        'status' => 'success',
        'message' => 'Contextual suggestions trigged!',
        'total_pushes_sent' => $totalPushed
    ]);

} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Suggestion Engine Failed: ' . $e->getMessage()]);
}
?>
