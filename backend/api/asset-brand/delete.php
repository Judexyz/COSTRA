<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/auth.php';

authenticate();

$db = getDB();
$input = json_decode(file_get_contents('php://input'), true);
$id = !empty($input['id']) ? (int)$input['id'] : 0;

if (!$id) {
    echo json_encode(['success' => false, 'message' => 'ID asset wajib diisi']);
    exit;
}

$stmt = $db->prepare("UPDATE asset_brands SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL");
$stmt->bind_param('i', $id);

if ($stmt->execute()) {
    if ($stmt->affected_rows > 0) {
        echo json_encode(['success' => true, 'message' => 'Brand berhasil dihapus']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Brand tidak ditemukan atau sudah dihapus']);
    }
} else {
    echo json_encode(['success' => false, 'message' => $stmt->error]);
}
