<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/auth.php';

authenticate();

$db      = getDB();
$search  = $_GET['search']    ?? '';
$page    = (int)($_GET['page']  ?? 1);
$limit   = (int)($_GET['limit'] ?? 20);
$offset  = ($page - 1) * $limit;

$where  = "1=1";
$params = [];
$types  = '';

if ($search) {
    $where   .= " AND (a.action LIKE ? OR a.module LIKE ? OR a.detail LIKE ? OR u.name LIKE ?)";
    $kw       = "%$search%";
    $params   = [$kw, $kw, $kw, $kw];
    $types   .= 'ssss';
}

$count_stmt = $db->prepare("SELECT COUNT(*) as total FROM audit_logs a LEFT JOIN users u ON a.user_id = u.id WHERE $where");
if ($types) $count_stmt->bind_param($types, ...$params);
$count_stmt->execute();
$total = $count_stmt->get_result()->fetch_assoc()['total'];
$count_stmt->close();

$sql = "SELECT a.*, u.name as user_name 
        FROM audit_logs a 
        LEFT JOIN users u ON a.user_id = u.id 
        WHERE $where 
        ORDER BY a.created_at DESC 
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
