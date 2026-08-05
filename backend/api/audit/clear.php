<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../utils/audit.php';

$user = authenticate();

if ($user['role'] !== 'admin' && $user['role'] !== 'super_admin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Hanya Admin yang dapat menghapus log']);
    exit();
}

$db = getDB();

$stmt = $db->prepare('TRUNCATE TABLE audit_logs');
if ($stmt->execute()) {
    logAudit($db, $user['id'], 'DELETE', 'SYSTEM', 'Seluruh Audit Log telah dikosongkan secara paksa (Cleared)');
    echo json_encode(['success' => true, 'message' => 'Seluruh Audit Log berhasil dihapus']);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Gagal menghapus audit log']);
}

$stmt->close();
$db->close();
