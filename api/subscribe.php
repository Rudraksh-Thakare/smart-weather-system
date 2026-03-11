<?php
// api/subscribe.php
require_once 'db.php';
session_start();

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['status' => 'error', 'message' => 'Invalid request']);
    exit();
}

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
    exit();
}

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['subscription']['endpoint']) || !isset($input['subscription']['keys']['p256dh'])) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid subscription object']);
    exit();
}

$lat = $input['lat'] ?? null;
$lon = $input['lon'] ?? null;

try {
    $pdo = getDBConnection();
    
    // UPSERT style logic to store or update the user's browser details with location
    $stmt = $pdo->prepare("
        INSERT INTO PushSubscriptions (user_id, endpoint, p256dh, auth, latitude, longitude) 
        VALUES (:user_id, :endpoint, :p256dh, :auth, :lat, :lon)
        ON CONFLICT (endpoint) DO UPDATE 
        SET user_id = EXCLUDED.user_id, p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude
    ");
    
    $stmt->execute([
        ':user_id' => $_SESSION['user_id'],
        ':endpoint' => $input['subscription']['endpoint'],
        ':p256dh' => $input['subscription']['keys']['p256dh'],
        ':auth' => $input['subscription']['keys']['auth'],
        ':lat' => $lat,
        ':lon' => $lon
    ]);
    
    echo json_encode(['status' => 'success', 'message' => 'Device subscribed for personalized alerts']);
} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
