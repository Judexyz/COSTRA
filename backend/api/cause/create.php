<?php
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/php_errors.log');
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/auth.php';
@require_once __DIR__ . '/../../utils/audit.php';

$user = authenticate();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method tidak diizinkan']);
    exit();
}

$input       = json_decode(file_get_contents('php://input'), true);
$name        = trim($input['name']        ?? '');
$description = trim($input['description'] ?? '');

if (!$name) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Nama akar masalah wajib diisi']);
    exit();
}

$db = getDB();

$check = $db->prepare('SELECT id FROM causes WHERE name = ?');
$check->bind_param('s', $name);
$check->execute();
if ($check->get_result()->num_rows > 0) {
    http_response_code(409);
    echo json_encode(['success' => false, 'message' => 'Nama akar masalah sudah ada']);
    $check->close();
    $db->close();
    exit();
}
$check->close();

$stmt = $db->prepare('INSERT INTO causes (name, description) VALUES (?, ?)');
$stmt->bind_param('ss', $name, $description);

if ($stmt->execute()) {
    echo json_encode([
        'success' => true,
        'message' => 'Akar masalah berhasil ditambahkan',
        'id'      => $db->insert_id
    ]);
    if (function_exists('logAudit')) {
        logAudit($db, $user['id'], 'CREATE', 'CAUSE', "Menambahkan akar masalah baru: {$name}");
    }
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Gagal menyimpan data']);
}

$stmt->close();
$db->close();
