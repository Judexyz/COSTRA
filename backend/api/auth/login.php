<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../utils/audit.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method tidak diizinkan']);
    exit();
}

$input    = json_decode(file_get_contents('php://input'), true);
$email    = trim($input['email']    ?? '');
$password = trim($input['password'] ?? '');

if (!$email || !$password) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Email dan password wajib diisi']);
    exit();
}

$db   = getDB();
$stmt = $db->prepare('SELECT id, name, email, password, role FROM users WHERE email = ? AND deleted_at IS NULL LIMIT 1');
$stmt->bind_param('s', $email);
$stmt->execute();
$user = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$user || !password_verify($password, $user['password'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Email atau password salah']);
    exit();
}

$token = generateToken([
    'id'   => $user['id'],
    'email'=> $user['email'],
    'role' => $user['role']
]);

echo json_encode([
    'success' => true,
    'token'   => $token,
    'user'    => [
        'id'    => $user['id'],
        'name'  => $user['name'],
        'email' => $user['email'],
        'role'  => $user['role']
    ]
]);

logAudit($db, $user['id'], 'LOGIN', 'AUTH', "Pengguna {$user['email']} berhasil login");

if ($user['role'] === 'admin' || $user['role'] === 'super_admin') {
    $backupDir = __DIR__ . '/../../uploads/backups';
    $lastRunFile = $backupDir . '/.last_run';
    $shouldRun = true;
    
    if (file_exists($lastRunFile)) {
        $lastRun = file_get_contents($lastRunFile);
        if (time() - intval($lastRun) < 86400) { // 24 hours
            $shouldRun = false;
        }
    }
    
    if ($shouldRun) {
        require_once __DIR__ . '/../../utils/backup.php';
        runTicketArchiving($db, $user['id']);
        if (!is_dir($backupDir)) mkdir($backupDir, 0777, true);
        file_put_contents($lastRunFile, time());
    }
}

$db->close();
