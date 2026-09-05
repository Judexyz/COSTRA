<?php

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: DELETE');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/auth.php';

$current_user = authenticate();

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method tidak diizinkan']);
    exit();
}

$input = json_decode(file_get_contents('php://input'), true);
$id    = (int)($input['id'] ?? $_GET['id'] ?? 0);

if (!$id) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'ID wajib diisi']);
    exit();
}

if ($id === (int)$current_user['id']) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Tidak dapat menghapus akun sendiri']);
    exit();
}

$db = getDB();

$check = $db->prepare('SELECT id FROM users WHERE id = ? AND deleted_at IS NULL');
$check->bind_param('i', $id);
$check->execute();
if ($check->get_result()->num_rows === 0) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'User tidak ditemukan']);
    $check->close();
    $db->close();
    exit();
}
$check->close();

$stmt = $db->prepare('UPDATE users SET deleted_at = NOW() WHERE id = ?');
$stmt->bind_param('i', $id);

if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'User berhasil dihapus']);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Gagal menghapus user']);
}

$stmt->close();
$db->close();
