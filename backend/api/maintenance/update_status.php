<?php

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../utils/audit.php';

$user = authenticate();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method tidak diizinkan']);
    exit();
}

$input  = json_decode(file_get_contents('php://input'), true);
$id     = (int)($input['id'] ?? 0);
$status = $input['status']   ?? '';

if (!$id || !$status) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'ID dan Status wajib diisi']);
    exit();
}

$allowed_status = ['scheduled', 'in_progress', 'done', 'cancelled'];
if (!in_array($status, $allowed_status)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Status tidak valid']);
    exit();
}

$db = getDB();

$check = $db->prepare('SELECT id FROM maintenance WHERE id = ? AND deleted_at IS NULL');
$check->bind_param('i', $id);
$check->execute();
if ($check->get_result()->num_rows === 0) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Jadwal tidak ditemukan']);
    $check->close();
    $db->close();
    exit();
}
$check->close();

$stmt = $db->prepare('UPDATE maintenance SET status = ? WHERE id = ?');
$stmt->bind_param('si', $status, $id);

if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Status maintenance berhasil diperbarui']);
    logAudit($db, $user['id'], 'UPDATE', 'MAINTENANCE', "Mengubah status jadwal maintenance ID {$id} menjadi {$status}");
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Gagal memperbarui status']);
}

$stmt->close();
$db->close();
