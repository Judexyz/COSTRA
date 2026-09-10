<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

require_once '../../config/db.php';
require_once '../../middleware/auth.php';

$user = authenticate();
if (!$user) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit();
}

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->date) || !isset($data->start_time) || !isset($data->end_time)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Missing required fields']);
    exit();
}

$db = getDB();
$stmt = $db->prepare("INSERT INTO overtime_requests (user_id, date, start_time, end_time, reason) VALUES (?, ?, ?, ?, ?)");
$reason = isset($data->reason) ? $data->reason : '';
$stmt->bind_param("issss", $user->id, $data->date, $data->start_time, $data->end_time, $reason);

if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Overtime request submitted']);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error', 'error' => $stmt->error]);
}
?>
