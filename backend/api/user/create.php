<?php

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/auth.php';

authenticate();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method tidak diizinkan']);
    exit();
}

$name     = trim($_POST['name']     ?? '');
$email    = trim($_POST['email']    ?? '');
$password = trim($_POST['password'] ?? '');
$role     = $_POST['role']           ?? 'staff';

if (!$name) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Nama wajib diisi']);
    exit();
}
if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Email tidak valid']);
    exit();
}
if (!$password || strlen($password) < 6) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Password minimal 6 karakter']);
    exit();
}

$allowed_roles = ['super_admin', 'admin', 'staff'];
if (!in_array($role, $allowed_roles)) $role = 'staff';

$db = getDB();

$dup = $db->prepare('SELECT id FROM users WHERE email = ? AND deleted_at IS NULL');
$dup->bind_param('s', $email);
$dup->execute();
if ($dup->get_result()->num_rows > 0) {
    http_response_code(409);
    echo json_encode(['success' => false, 'message' => 'Email sudah digunakan']);
    $dup->close();
    $db->close();
    exit();
}
$dup->close();

$avatar = null;
if (isset($_FILES['avatar']) && $_FILES['avatar']['error'] === 0) {
    $allowed_ext = ['jpg', 'jpeg', 'png', 'webp'];
    $max_size    = 1 * 1024 * 1024; 
    $file        = $_FILES['avatar'];
    $ext         = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));

    if (!in_array($ext, $allowed_ext)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Format avatar tidak valid']);
        $db->close();
        exit();
    }
    if ($file['size'] > $max_size) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Ukuran avatar maksimal 1MB']);
        $db->close();
        exit();
    }

    $filename = 'avatar_' . time() . '_' . uniqid() . '.' . $ext;
    $dest     = __DIR__ . '/../../../uploads/avatars/' . $filename;

    if (move_uploaded_file($file['tmp_name'], $dest)) {
        $avatar = $filename;
    }
}

$hashed = password_hash($password, PASSWORD_DEFAULT);

$stmt = $db->prepare('INSERT INTO users (name, email, password, role, avatar) VALUES (?, ?, ?, ?, ?)');
$stmt->bind_param('sssss', $name, $email, $hashed, $role, $avatar);

if ($stmt->execute()) {
    echo json_encode([
        'success' => true,
        'message' => 'User berhasil ditambahkan',
        'id'      => $db->insert_id
    ]);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Gagal menyimpan user']);
}

$stmt->close();
$db->close();
