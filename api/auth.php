<?php
// api/auth.php
require_once 'db.php';
session_start();

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['status' => 'error', 'message' => 'Invalid request method']);
    exit();
}

$input = json_decode(file_get_contents('php://input'), true);
$action = isset($input['action']) ? $input['action'] : '';

try {
    $pdo = getDBConnection();

    // ============================================
    // REGISTRATION
    // ============================================
    if ($action === 'register') {
        $username = trim($input['username']);
        $email = trim($input['email']);
        $password = trim($input['password']);

        if (empty($username) || empty($email) || empty($password)) {
            echo json_encode(['status' => 'error', 'message' => 'All fields are required.']);
            exit();
        }

        // Check if user already exists
        $stmt = $pdo->prepare("SELECT id FROM Users WHERE username = :username OR email = :email");
        $stmt->bindParam(':username', $username);
        $stmt->bindParam(':email', $email);
        $stmt->execute();

        if ($stmt->rowCount() > 0) {
            echo json_encode(['status' => 'error', 'message' => 'Username or Email already exists.']);
            exit();
        }

        // Hash the password securely
        $hashed_password = password_hash($password, PASSWORD_BCRYPT);

        // Insert new user
        $stmt = $pdo->prepare("INSERT INTO Users (username, email, password_hash) VALUES (:username, :email, :password_hash)");
        $stmt->bindParam(':username', $username);
        $stmt->bindParam(':email', $email);
        $stmt->bindParam(':password_hash', $hashed_password);
        
        if ($stmt->execute()) {
            // Log them in immediately
            $_SESSION['user_id'] = $pdo->lastInsertId();
            $_SESSION['username'] = $username;
            echo json_encode(['status' => 'success', 'message' => 'Registration successful.', 'redirect' => 'index.html']);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Failed to register user.']);
        }
        exit();
    }

    // ============================================
    // LOGIN
    // ============================================
    if ($action === 'login') {
        $username = trim($input['username']);
        $password = trim($input['password']);

        if (empty($username) || empty($password)) {
            echo json_encode(['status' => 'error', 'message' => 'Username and password are required.']);
            exit();
        }

        // Find user (Case-insensitive support for both Username and Email)
        $stmt = $pdo->prepare("SELECT id, username, password_hash FROM Users WHERE LOWER(username) = LOWER(:identifier) OR LOWER(email) = LOWER(:identifier)");
        $stmt->bindParam(':identifier', $username);
        $stmt->execute();
        $user = $stmt->fetch();

        // Verify password against hash
        if ($user && password_verify($password, $user['password_hash'])) {
            // Set session variables
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['username'] = $user['username'];
            echo json_encode(['status' => 'success', 'message' => 'Login successful.', 'redirect' => 'index.html']);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Invalid username or password.']);
        }
        exit();
    }
    
    // ============================================
    // CHECK LOGIN (AUTH GUARD)
    // ============================================
    if ($action === 'check') {
        if (isset($_SESSION['user_id'])) {
            echo json_encode([
                'status' => 'success', 
                'logged_in' => true, 
                'user' => [
                    'id' => $_SESSION['user_id'], 
                    'username' => $_SESSION['username']
                ]
            ]);
        } else {
            echo json_encode(['status' => 'success', 'logged_in' => false]);
        }
        exit();
    }

    echo json_encode(['status' => 'error', 'message' => 'Invalid action specified.']);
} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'System error. Please try again later.']);
}
?>
