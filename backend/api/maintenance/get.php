<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/auth.php';

authenticate();

$db      = getDB();
$search  = $_GET['search'] ?? '';
$status  = $_GET['status'] ?? '';
$sort    = $_GET['sort']   ?? 'm.id';
$order   = $_GET['order']  ?? 'DESC';
$page    = (int)($_GET['page']  ?? 1);
$limit   = (int)($_GET['limit'] ?? 10);
$offset  = ($page - 1) * $limit;

$allowed_sort = ['m.id', 'm.schedule', 'm.status', 'm.created_at'];
if (!in_array($sort, $allowed_sort)) $sort = 'm.id';
$order = strtoupper($order) === 'ASC' ? 'ASC' : 'DESC';

$where  = "m.deleted_at IS NULL";
$params = [];
$types  = '';

if ($search) {
    $where   .= " AND (a.name LIKE ? OR a.asset_code LIKE ?)";
    $kw       = "%$search%";
    $params   = [$kw, $kw];
    $types   .= 'ss';
}
if ($status) {
    $where   .= " AND m.status = ?";
    $params[] = $status;
    $types   .= 's';
}

$count_sql = "SELECT COUNT(*) as total
    FROM maintenance m
    LEFT JOIN assets a ON m.asset_id = a.id
    WHERE $where";
$count_stmt = $db->prepare($count_sql);
if ($types) $count_stmt->bind_param($types, ...$params);
$count_stmt->execute();
$total = $count_stmt->get_result()->fetch_assoc()['total'];
$count_stmt->close();

$sql = "SELECT
    m.id, m.schedule, m.status, m.notes, m.cost, m.created_at,
    m.asset_id, m.user_id,
    a.name      AS asset_name,
    a.asset_code,
    u.name      AS technician
FROM maintenance m
LEFT JOIN assets a ON m.asset_id = a.id
LEFT JOIN users  u ON m.user_id  = u.id
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
