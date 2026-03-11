<?php
// api/get_alerts.php
require_once 'db.php';

header('Content-Type: application/json');

$area = isset($_GET['area']) ? $_GET['area'] : null;

try {
    $pdo = getDBConnection();
    
    if ($area) {
        // Fetch alerts for specific area that haven't expired
        $stmt = $pdo->prepare("SELECT * FROM Alerts WHERE target_area ILIKE :area AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP) ORDER BY created_at DESC");
        // Using ILIKE for case-insensitive match (e.g. 'mumbai' matches 'Mumbai')
        $searchTerm = '%' . $area . '%';
        $stmt->bindParam(':area', $searchTerm);
    } else {
        // Fetch all active alerts globally
        $stmt = $pdo->prepare("SELECT * FROM Alerts WHERE expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP ORDER BY created_at DESC");
    }
    
    $stmt->execute();
    $result = $stmt->fetchAll();
    
    echo json_encode(['status' => 'success', 'data' => $result]);
} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
