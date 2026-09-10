<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
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

$db = getDB();

if ($user->role === 'hr' || $user->role === 'admin' || $user->role === 'super_admin') {
    // HR can see all requests
    $query = "
        SELECT o.id, o.date, o.start_time, o.end_time, o.reason, o.status, 
               u.name as user_name,
               a.name as approver_name
        FROM overtime_requests o
        JOIN users u ON o.user_id = u.id
        LEFT JOIN users a ON o.approver_id = a.id
        ORDER BY o.created_at DESC
    ";
    $stmt = $db->prepare($query);
} else {
    // Staff can only see their own requests
    $query = "
        SELECT o.id, o.date, o.start_time, o.end_time, o.reason, o.status, 
               u.name as user_name,
               a.name as approver_name
        FROM overtime_requests o
        JOIN users u ON o.user_id = u.id
        LEFT JOIN users a ON o.approver_id = a.id
        WHERE o.user_id = ?
        ORDER BY o.created_at DESC
    ";
    $stmt = $db->prepare($query);
    $stmt->bind_param("i", $user->id);
}

$stmt->execute();
$result = $stmt->get_result();

$requests = [];
while ($row = $result->fetch_assoc()) {
    $requests[] = $row;
}

echo json_encode([
    'success' => true,
    'data' => $requests
]);
?>
