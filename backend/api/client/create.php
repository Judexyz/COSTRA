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

$input       = json_decode(file_get_contents('php://input'), true);
$name        = trim($input['name']        ?? '');
$email       = trim($input['email']       ?? '');
$phone       = trim($input['phone']       ?? '');
$address     = trim($input['address']     ?? '');
$description = trim($input['description'] ?? '');

if (!$name) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Nama client wajib diisi']);
    exit();
}

if ($email && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Format email tidak valid']);
    exit();
}

$db = getDB();

if ($email) {
    $dup = $db->prepare('SELECT id FROM clients WHERE email = ? AND deleted_at IS NULL');
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
}

$stmt = $db->prepare('INSERT INTO clients (name, email, phone, address, description) VALUES (?, ?, ?, ?, ?)');
$stmt->bind_param('sssss', $name, $email, $phone, $address, $description);

if ($stmt->execute()) {
    echo json_encode([
        'success' => true,
        'message' => 'Client berhasil ditambahkan',
        'id'      => $db->insert_id
    ]);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Gagal menyimpan data']);
}

$stmt->close();
$db->close();
