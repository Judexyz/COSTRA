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
    echo json_encode(['success' => false, 'message' => 'Akses ditolak. Membutuhkan hak akses admin.']);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method tidak diizinkan']);
    exit();
}

$input = json_decode(file_get_contents('php://input'), true);
$id = (int)($input['id'] ?? 0);
$action = $input['action'] ?? 'approve';
$notes = $input['notes'] ?? '';

if ($id <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'ID maintenance tidak valid']);
    exit();
}

$db = getDB();

// Check if it exists
$stmt = $db->prepare("SELECT id, cost FROM maintenance WHERE id = ?");
$stmt->bind_param("i", $id);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Data maintenance tidak ditemukan']);
    exit();
}

$maint = $result->fetch_assoc();

if ($action === 'reject') {
    $updateStmt = $db->prepare("UPDATE maintenance SET validation_status = 'rejected', validation_notes = ? WHERE id = ?");
    $updateStmt->bind_param("si", $notes, $id);
    $actionText = 'Menolak (Reject)';
} else {
    $updateStmt = $db->prepare("UPDATE maintenance SET validation_status = 'validated', validation_notes = NULL WHERE id = ?");
    $updateStmt->bind_param("i", $id);
    $actionText = 'Memvalidasi';
}

if ($updateStmt->execute()) {
    logAudit($db, $user['id'], 'VALIDATE', 'MAINTENANCE', "{$actionText} biaya maintenance ID: {$id} sejumlah Rp" . number_format($maint['cost'], 0, ',', '.'));
    echo json_encode(['success' => true, 'message' => 'Status biaya berhasil diperbarui']);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Gagal memperbarui status biaya']);
}

$updateStmt->close();
$stmt->close();
$db->close();
