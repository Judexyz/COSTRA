<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: DELETE');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/auth.php';
@require_once __DIR__ . '/../../utils/audit.php';

$user = authenticate();

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

$db = getDB();

$check = $db->prepare('SELECT id FROM causes WHERE id = ? AND deleted_at IS NULL');
$check->bind_param('i', $id);
$check->execute();
if ($check->get_result()->num_rows === 0) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Akar masalah tidak ditemukan']);
    $check->close();
    $db->close();
    exit();
}
$check->close();

$stmt = $db->prepare('UPDATE causes SET deleted_at = NOW() WHERE id = ?');
$stmt->bind_param('i', $id);

if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Akar masalah berhasil dihapus']);
    if (function_exists('logAudit')) {
        logAudit($db, $user['id'], 'DELETE', 'CAUSE', "Menghapus akar masalah ID {$id}");
    }
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Gagal menghapus data']);
}

$stmt->close();
$db->close();
