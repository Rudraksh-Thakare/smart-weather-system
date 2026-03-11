<?php
// api/save_history.php
require_once 'db.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['status' => 'error', 'message' => 'Invalid request method']);
    exit();
}

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['city_name']) || !isset($input['temperature']) || !isset($input['humidity'])) {
    echo json_encode(['status' => 'error', 'message' => 'Missing required fields']);
    exit();
}

$city_name = $input['city_name'];
$temperature = $input['temperature'];
$humidity = $input['humidity'];
$rainfall = isset($input['rainfall']) ? $input['rainfall'] : 0.0;

try {
    $pdo = getDBConnection();
    
    $stmt = $pdo->prepare("INSERT INTO WeatherHistory (city_name, temperature, humidity, rainfall) VALUES (:city, :temp, :hum, :rain)");
    $stmt->bindParam(':city', $city_name);
    $stmt->bindParam(':temp', $temperature);
    $stmt->bindParam(':hum', $humidity);
    $stmt->bindParam(':rain', $rainfall);
    
    $stmt->execute();
    
    echo json_encode(['status' => 'success', 'message' => 'Weather data saved successfully']);
} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
