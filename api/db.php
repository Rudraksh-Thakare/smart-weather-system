<?php
// api/db.php
require_once 'config.php';

function getDBConnection() {
$dsn = "pgsql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";sslmode=require;";    
    try {
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::PGSQL_ATTR_DISABLE_PREPARES => true,
        ]);
        
        return $pdo;
    } catch (PDOException $e) {
        // Return JSON error response instead of plain text
        header('Content-Type: application/json');
        echo json_encode([
            "status" => "error",
            "message" => "Database connection failed",
            "error_detail" => $e->getMessage()
        ]);
        exit();
    }
}
?>
