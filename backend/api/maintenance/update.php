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

$input    = json_decode(file_get_contents('php://input'), true);
$id       = (int)($input['id']       ?? 0);
$asset_id = (int)($input['asset_id'] ?? 0) ?: null;
$user_id  = (int)($input['user_id']  ?? 0) ?: null;
$schedule = trim($input['schedule']  ?? '');
$status   = $input['status']          ?? 'scheduled';
$notes    = trim($input['notes']      ?? '');
$cost     = (float)($input['cost']    ?? 0);

if (!$id) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'ID wajib diisi']);
    exit();
}
if (!$schedule) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Tanggal jadwal wajib diisi']);
    exit();
}
if (!strtotime($schedule)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Format tanggal tidak valid']);
    exit();
}

$allowed_status = ['scheduled', 'in_progress', 'done', 'cancelled'];
if (!in_array($status, $allowed_status)) $status = 'scheduled';

$db = getDB();

$check = $db->prepare('SELECT id FROM maintenance WHERE id = ? AND deleted_at IS NULL');
$check->bind_param('i', $id);
$check->execute();
if ($check->get_result()->num_rows === 0) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Data maintenance tidak ditemukan']);
    $check->close();
    $db->close();
    exit();
}
$check->close();

$stmt = $db->prepare('UPDATE maintenance SET
    asset_id = ?, user_id = ?, schedule = ?,
    status = ?, notes = ?, cost = ?, updated_at = NOW()
    WHERE id = ?');

$stmt->bind_param('iisssdi', $asset_id, $user_id, $schedule, $status, $notes, $cost, $id);

if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Data maintenance berhasil diperbarui']);
    logAudit($db, $user['id'], 'UPDATE', 'MAINTENANCE', "Memperbarui jadwal maintenance dengan ID: {$id}");
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Gagal memperbarui data maintenance']);
}

$stmt->close();
$db->close();
