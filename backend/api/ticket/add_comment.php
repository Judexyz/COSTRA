<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/auth.php';

$user = authenticate();
$ticket_id = (int)($_POST['ticket_id'] ?? 0);
$message = trim($_POST['message'] ?? '');

if (!$ticket_id || !$message) {
    echo json_encode(['success' => false, 'message' => 'Ticket ID and message are required']);
    exit;
}

$db = getDB();
$stmt = $db->prepare("INSERT INTO ticket_comments (ticket_id, user_id, message) VALUES (?, ?, ?)");
$stmt->bind_param('iis', $ticket_id, $user['id'], $message);
$stmt->execute();
$comment_id = $db->insert_id;

$attachment = null;
if (isset($_FILES['attachment']) && $_FILES['attachment']['error'] === UPLOAD_ERR_OK) {
    $file = $_FILES['attachment'];
    $allowed = ['image/jpeg', 'image/png', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if ($file['size'] > 5242880) { // 5MB
        echo json_encode(['success' => false, 'message' => 'Ukuran file melebihi 5MB']);
        exit;
    }
    
    $upload_dir = __DIR__ . '/../../uploads/tickets/';
    if (!is_dir($upload_dir)) mkdir($upload_dir, 0777, true);
    
    $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = time() . '_' . rand(1000,9999) . '.' . $ext;
    if (move_uploaded_file($file['tmp_name'], $upload_dir . $filename)) {
        $file_path = 'backend/uploads/tickets/' . $filename;
        $file_name = $file['name'];
        $astmt = $db->prepare("INSERT INTO ticket_attachments (ticket_id, comment_id, file_path, file_name, uploaded_by) VALUES (?, ?, ?, ?, ?)");
        $astmt->bind_param('iissi', $ticket_id, $comment_id, $file_path, $file_name, $user['id']);
        $astmt->execute();
        $attachment = ['file_path' => $file_path, 'file_name' => $file_name];
    }
}

echo json_encode(['success' => true, 'message' => 'Komentar terkirim', 'comment_id' => $comment_id, 'attachment' => $attachment]);
