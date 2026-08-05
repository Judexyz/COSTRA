<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../utils/backup.php';

$user = authenticate();
if ($user['role'] !== 'admin' && $user['role'] !== 'super_admin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Hanya Admin yang dapat menjalankan arsip manual']);
    exit();
}

$db = getDB();
$result = runTicketArchiving($db, $user['id']);
$db->close();

echo json_encode($result);
