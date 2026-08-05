<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/auth.php';

authenticate();

$db      = getDB();
$search  = $_GET['search']    ?? '';
$status  = $_GET['status']    ?? '';
$priority = $_GET['priority'] ?? '';
$sort    = $_GET['sort']      ?? 't.id';
$order   = $_GET['order']     ?? 'DESC';
$page    = (int)($_GET['page']  ?? 1);
$limit   = (int)($_GET['limit'] ?? 10);
$offset  = ($page - 1) * $limit;

$allowed_sort = ['t.id', 't.sr_no', 't.status', 't.priority', 't.created_at'];
if (!in_array($sort, $allowed_sort)) $sort = 't.id';
$order = strtoupper($order) === 'ASC' ? 'ASC' : 'DESC';

$where  = "t.deleted_at IS NULL";
$params = [];
$types  = '';

if ($search) {
    $where   .= " AND (t.sr_no LIKE ? OR t.description LIKE ?)";
    $kw       = "%$search%";
    $params   = [$kw, $kw];
    $types   .= 'ss';
}
if ($status) {
    $where   .= " AND t.status = ?";
    $params[] = $status;
    $types   .= 's';
}
if ($priority) {
    $where   .= " AND t.priority = ?";
    $params[] = $priority;
    $types   .= 's';
}

$count_stmt = $db->prepare("SELECT COUNT(*) as total FROM service_requests t WHERE $where");
if ($types) $count_stmt->bind_param($types, ...$params);
$count_stmt->execute();
$total = $count_stmt->get_result()->fetch_assoc()['total'];
$count_stmt->close();

$sql = "SELECT t.*, a.asset_code, a.name as asset_name, c.name as client_name, u.name as assignee_name, ca.name as cause_name, im.name as impact_name 
        FROM service_requests t 
        LEFT JOIN assets a ON t.asset_id = a.id 
        LEFT JOIN clients c ON t.client_id = c.id 
        LEFT JOIN users u ON t.user_id = u.id 
        LEFT JOIN causes ca ON t.cause_id = ca.id 
        LEFT JOIN impacts im ON t.impact_id = im.id 
        WHERE $where
ORDER BY $sort $order
LIMIT ? OFFSET ?";

$stmt = $db->prepare($sql);
if ($types) {
    $params[] = $limit;
    $params[] = $offset;
    $stmt->bind_param($types . 'ii', ...$params);
} else {
    $stmt->bind_param('ii', $limit, $offset);
}
$stmt->execute();
$data = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
$stmt->close();
$db->close();

echo json_encode([
    'success'    => true,
    'data'       => $data,
    'pagination' => [
        'total'        => (int)$total,
        'per_page'     => $limit,
        'current_page' => $page,
        'last_page'    => (int)ceil($total / $limit)
    ]
]);
