<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/auth.php';

$user = authenticate();
if ($user['role'] !== 'client') {
    echo json_encode(['success' => false, 'message' => 'Hanya klien yang dapat melakukan aksi ini']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$id = (int)($input['id'] ?? 0);
$action = $input['action'] ?? ''; // 'accept' or 'reject'
$reason = trim($input['reason'] ?? '');

if (!$id || !in_array($action, ['accept', 'reject'])) {
    echo json_encode(['success' => false, 'message' => 'Data tidak valid']);
    exit;
}

$db = getDB();
$stmt = $db->prepare("SELECT status FROM tickets WHERE id = ? AND created_by = ? AND deleted_at IS NULL");
$stmt->bind_param('ii', $id, $user['id']);
$stmt->execute();
$res = $stmt->get_result();
if ($res->num_rows === 0) {
    echo json_encode(['success' => false, 'message' => 'Tiket tidak ditemukan']);
    exit;
}
$ticket = $res->fetch_assoc();
if ($ticket['status'] !== 'resolved') {
    echo json_encode(['success' => false, 'message' => 'Tiket tidak dalam status menunggu konfirmasi']);
    exit;
}

$new_status = ($action === 'accept') ? 'closed' : 'in_progress';
$ustmt = $db->prepare("UPDATE tickets SET status = ?, updated_at = NOW() WHERE id = ?");
$ustmt->bind_param('si', $new_status, $id);
$ustmt->execute();

$auto_msg = ($action === 'accept') ? 'Klien telah mengkonfirmasi bahwa masalah telah selesai.' : 'Klien menolak penyelesaian. Alasan: ' . $reason;
$cstmt = $db->prepare("INSERT INTO ticket_comments (ticket_id, user_id, message) VALUES (?, ?, ?)");
$cstmt->bind_param('iis', $id, $user['id'], $auto_msg);
$cstmt->execute();

echo json_encode(['success' => true, 'message' => 'Tanggapan berhasil dikirim']);
