<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/auth.php';

authenticate();

$db     = getDB();
$search = $_GET['search'] ?? '';
$sort   = $_GET['sort']   ?? 'id';
$order  = $_GET['order']  ?? 'DESC';
$page   = (int)($_GET['page']  ?? 1);
$limit  = (int)($_GET['limit'] ?? 10);
$offset = ($page - 1) * $limit;

$allowed_sort = ['id', 'name', 'email', 'created_at'];
if (!in_array($sort, $allowed_sort)) $sort = 'id';
$order = strtoupper($order) === 'ASC' ? 'ASC' : 'DESC';

$where  = "deleted_at IS NULL";
$params = [];
$types  = '';

if ($search) {
    $where   .= " AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)";
    $keyword  = "%$search%";
    $params   = [$keyword, $keyword, $keyword];
    $types    = 'sss';
}

$count_stmt = $db->prepare("SELECT COUNT(*) as total FROM clients WHERE $where");
if ($types) $count_stmt->bind_param($types, ...$params);
$count_stmt->execute();
$total = $count_stmt->get_result()->fetch_assoc()['total'];
$count_stmt->close();

$stmt = $db->prepare("SELECT id, name, email, phone, address, description, created_at FROM clients WHERE $where ORDER BY $sort $order LIMIT ? OFFSET ?");
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
