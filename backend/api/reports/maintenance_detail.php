<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/auth.php';

authenticate();

$db         = getDB();
$start_date = $_GET['start_date'] ?? null;
$end_date   = $_GET['end_date']   ?? null;
$page       = (int)($_GET['page'] ?? 1);
$limit      = (int)($_GET['limit'] ?? 10);
$offset     = ($page - 1) * $limit;

if ($start_date && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $start_date)) {
    $start_date = null;
}
if ($end_date && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $end_date)) {
    $end_date = null;
}

$where = "1=1";
if ($start_date && $end_date) {
    $where .= " AND DATE(m.schedule) >= '$start_date' AND DATE(m.schedule) <= '$end_date'";
} elseif ($start_date) {
    $where .= " AND DATE(m.schedule) >= '$start_date'";
} elseif ($end_date) {
    $where .= " AND DATE(m.schedule) <= '$end_date'";
}

$count_sql = "SELECT COUNT(*) as total FROM maintenance m WHERE $where";
$count_res = $db->query($count_sql);
$total = $count_res->fetch_assoc()['total'];

$sql = "SELECT 
    m.id, m.schedule, m.status, m.cost, m.notes,
    a.name AS asset_name, a.asset_code,
    u.name AS technician
FROM maintenance m
LEFT JOIN assets a ON m.asset_id = a.id
LEFT JOIN users u ON m.user_id = u.id
WHERE $where
ORDER BY m.schedule DESC
LIMIT $limit OFFSET $offset";

$res = $db->query($sql);
$data = [];
if ($res) {
    while ($row = $res->fetch_assoc()) {
        $data[] = $row;
    }
}

$db->close();

echo json_encode([
    'success' => true,
    'data' => $data,
    'pagination' => [
        'total' => (int)$total,
        'per_page' => $limit,
        'current_page' => $page,
        'last_page' => (int)ceil($total / $limit)
    ]
]);
