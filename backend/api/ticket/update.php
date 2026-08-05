<?php

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: PUT');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../utils/audit.php';

$user = authenticate();

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method tidak diizinkan']);
    exit();
}

$input       = json_decode(file_get_contents('php://input'), true);
$id          = (int)($input['id']          ?? 0);
$asset_id    = (int)($input['asset_id']    ?? 0) ?: null;
$client_id   = (int)($input['client_id']   ?? 0) ?: null;
$user_id     = (int)($input['user_id']     ?? 0) ?: null;
$priority    = $input['priority']           ?? 'medium';
$severity    = $input['severity']           ?? 'minor';
$status      = $input['status']             ?? 'open';
$description = trim($input['description']  ?? '');

if (!$id) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'ID wajib diisi']);
    exit();
}
if (!$description) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Deskripsi wajib diisi']);
    exit();
}

$allowed_priority = ['low', 'medium', 'high', 'critical'];
$allowed_severity = ['minor', 'major', 'critical'];
$allowed_status   = ['open', 'assigned', 'progress', 'pending', 'closed'];

if (!in_array($priority, $allowed_priority)) $priority = 'medium';
if (!in_array($severity, $allowed_severity)) $severity = 'minor';
if (!in_array($status,   $allowed_status))   $status   = 'open';

$db = getDB();

$check = $db->prepare('SELECT id FROM tickets WHERE id = ? AND deleted_at IS NULL');
$check->bind_param('i', $id);
$check->execute();
if ($check->get_result()->num_rows === 0) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Ticket tidak ditemukan']);
    $check->close();
    $db->close();
    exit();
}
$check->close();

$stmt = $db->prepare('UPDATE tickets SET
    asset_id = ?, client_id = ?, user_id = ?,
    priority = ?, severity = ?, status = ?,
    description = ?, updated_at = NOW()
    WHERE id = ?');

$stmt->bind_param('iiissssi',
    $asset_id, $client_id, $user_id,
    $priority, $severity, $status,
    $description, $id
);

if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Ticket berhasil diperbarui']);
    logAudit($db, $user['id'], 'UPDATE', 'TICKET', "Memperbarui tiket dengan ID: {$id}");
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Gagal memperbarui ticket']);
}

$stmt->close();
$db->close();
