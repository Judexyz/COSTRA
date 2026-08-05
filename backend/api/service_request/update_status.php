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
$cause_id = isset($input['cause_id']) ? (int)$input['cause_id'] : null;
$impact_id = isset($input['impact_id']) ? (int)$input['impact_id'] : null;
$solution_note = $input['solution_note'] ?? null;

if (!$id || !$status) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'ID dan Status wajib diisi']);
    exit();
}

$allowed_status = ['open', 'assigned', 'progress', 'pending', 'solved', 'closed', 'rejected'];
if (!in_array($status, $allowed_status)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Status tidak valid']);
    exit();
}

if ($status === 'solved' && (!$cause_id || !$impact_id)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Akar masalah dan Dampak wajib diisi untuk menyelesaikan tiket']);
    exit();
}

$db = getDB();

$check = $db->prepare('SELECT id FROM service_requests WHERE id = ? AND deleted_at IS NULL');
$check->bind_param('i', $id);
$check->execute();
if ($check->get_result()->num_rows === 0) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Service Request tidak ditemukan']);
    $check->close();
    $db->close();
    exit();
}
$check->close();

if ($status === 'solved') {
    $stmt = $db->prepare('UPDATE service_requests SET status = ?, cause_id = ?, impact_id = ?, solution_note = ?, updated_at = NOW() WHERE id = ? AND deleted_at IS NULL');
    $stmt->bind_param('siisi', $status, $cause_id, $impact_id, $solution_note, $id);
} else {
    $stmt = $db->prepare('UPDATE service_requests SET status = ?, updated_at = NOW() WHERE id = ? AND deleted_at IS NULL');
    $stmt->bind_param('si', $status, $id);
}

if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Status tiket berhasil diperbarui']);
    logAudit($db, $user['id'], 'UPDATE', 'SERVICE REQUEST', "Mengubah status request ID {$id} menjadi {$status}");
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Gagal memperbarui status']);
}

$stmt->close();
$db->close();
