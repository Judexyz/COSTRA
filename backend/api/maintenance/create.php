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

$input    = json_decode(file_get_contents('php://input'), true);
$asset_id = (int)($input['asset_id'] ?? 0) ?: null;
$user_id  = (int)($input['user_id']  ?? 0) ?: null;
$schedule = trim($input['schedule']  ?? '');
$notes    = trim($input['notes']     ?? '');
$cost     = (float)($input['cost']   ?? 0);

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

$db = getDB();

$stmt = $db->prepare('INSERT INTO maintenance
    (asset_id, user_id, schedule, status, notes, cost)
    VALUES (?, ?, ?, ?, ?, ?)');

$status = 'scheduled';
$stmt->bind_param('iisssd', $asset_id, $user_id, $schedule, $status, $notes, $cost);

if ($stmt->execute()) {
    echo json_encode([
        'success' => true,
        'message' => 'Jadwal maintenance berhasil dibuat',
        'id'      => $db->insert_id
    ]);
    logAudit($db, $user['id'], 'CREATE', 'MAINTENANCE', "Membuat jadwal maintenance baru untuk aset ID: {$asset_id}");
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Gagal membuat jadwal maintenance']);
}

$stmt->close();
$db->close();
