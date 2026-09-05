<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/auth.php';

$user = authenticate();
$ticket_id = (int)($_GET['ticket_id'] ?? 0);

if (!$ticket_id) {
    echo json_encode(['success' => false, 'message' => 'Ticket ID is required']);
    exit;
}

$db = getDB();
$sql = "SELECT c.id, c.message, c.created_at, u.name as user_name, u.role as user_role,
        a.file_path, a.file_name
        FROM ticket_comments c
        LEFT JOIN users u ON c.user_id = u.id
        LEFT JOIN ticket_attachments a ON a.comment_id = c.id
        WHERE c.ticket_id = ?
        ORDER BY c.created_at ASC";

$stmt = $db->prepare($sql);
$stmt->bind_param('i', $ticket_id);
$stmt->execute();
$data = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

echo json_encode(['success' => true, 'data' => $data]);
