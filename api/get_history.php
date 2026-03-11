<?php
// api/get_history.php
require_once 'db.php';

header('Content-Type: application/json');

$city_name = isset($_GET['city']) ? $_GET['city'] : 'Pune';
$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 7;

try {
    $pdo = getDBConnection();
    
    $stmt = $pdo->prepare("SELECT * FROM WeatherHistory WHERE city_name = :city ORDER BY recorded_at DESC LIMIT :limit");
    $stmt->bindParam(':city', $city_name);
    $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
    $stmt->execute();
    
    $result = $stmt->fetchAll();
    
    // Sort array in ascending order based on date for charting
    usort($result, function($a, $b) {
        return strtotime($a['recorded_at']) - strtotime($b['recorded_at']);
    });
    
    echo json_encode(['status' => 'success', 'data' => $result]);
} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
