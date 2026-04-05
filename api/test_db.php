<?php
require_once 'config.php';

$dsn = "pgsql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";sslmode=require;";

try {
    $pdo = new PDO($dsn, DB_USER, DB_PASS);
    echo "Connected successfully!";
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>