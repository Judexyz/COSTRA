<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

require_once '../../config/db.php';
require_once '../../middleware/auth.php';

$user = authenticate();
if (!$user || !in_array($user->role, ['hr', 'admin', 'super_admin'])) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Forbidden']);
    exit();
}

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->id) || !isset($data->status)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Missing required fields']);
    exit();
}

if (!in_array($data->status, ['Approved', 'Rejected'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid status']);
    exit();
}

$db = getDB();
$stmt = $db->prepare("UPDATE overtime_requests SET status = ?, approver_id = ? WHERE id = ?");
$stmt->bind_param("sii", $data->status, $user->id, $data->id);

if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Request ' . strtolower($data->status)]);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error', 'error' => $stmt->error]);
}
?>
