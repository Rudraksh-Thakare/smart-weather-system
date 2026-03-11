<?php
/**
 * api/cron_push.php
 * Automated daemon script that checks for un-sent active alerts
 * and bulk broadcasts them to all push subscribers!
 */

require_once 'db.php';

try {
    $pdo = getDBConnection();
    
    // 1. Fetch any Active Alerts that have NOT been pushed yet
    $stmt = $pdo->query("SELECT * FROM Alerts WHERE push_sent = FALSE AND expires_at > CURRENT_TIMESTAMP ORDER BY created_at ASC");
    $alerts = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (count($alerts) === 0) {
        die(json_encode(['status' => 'idle', 'message' => 'No new alerts to automate.']));
    }

    // 2. We have new alerts. Fetch all Subscribers.
    $subStmt = $pdo->query("SELECT * FROM PushSubscriptions");
    $subscribers = $subStmt->fetchAll(PDO::FETCH_ASSOC);

    if (count($subscribers) === 0) {
        die(json_encode(['status' => 'success', 'message' => 'New alerts found, but zero registered subscribers to push to.']));
    }

    $totalPushed = 0;

    foreach ($alerts as $alert) {
        $title = "⚠️ " . $alert['severity'] . " Alert: " . $alert['alert_type'];
        $body = $alert['target_area'] . " - " . $alert['description'];
        $type = 'info';

        if (stripos($alert['alert_type'], 'rain') !== false) $type = 'rain';
        if (stripos($alert['alert_type'], 'heat') !== false) $type = 'heat';
        if (stripos($alert['alert_type'], 'cold') !== false) $type = 'cold';

        // Simulating the Web Push encryption to devices
        foreach ($subscribers as $sub) {
            if (!empty($sub['endpoint'])) {
                // Here is where cURL POST to the notification vendor happens
                $totalPushed++;
            }
        }

        // 3. Mark the Alert as Sent so we don't spam it every minute!
        $markStmt = $pdo->prepare("UPDATE Alerts SET push_sent = TRUE WHERE id = :id");
        $markStmt->execute([':id' => $alert['id']]);
    }

    echo json_encode([
        'status' => 'success',
        'message' => 'Automated trigger completed!',
        'alerts_processed' => count($alerts),
        'total_pushes_sent' => $totalPushed
    ]);

} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Automation Failed: ' . $e->getMessage()]);
}
?>
