<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/auth.php';

authenticate();

$db     = getDB();
$id     = !empty($_GET['id']) ? (int)$_GET['id'] : 0;
$search = $_GET['search'] ?? '';
$status = $_GET['status'] ?? '';
$page   = (int)($_GET['page']  ?? 1);
$limit  = (int)($_GET['limit'] ?? 10);

if ($id) {
    $sql = "SELECT a.*, 
              c.name as category_name, 
              b.name as brand_name, 
              cl.name as client_name 
            FROM assets a
            LEFT JOIN asset_categories c ON a.category_id = c.id
            LEFT JOIN asset_brands b ON a.brand_id = b.id
            LEFT JOIN clients cl ON a.client_id = cl.id
            WHERE a.id = ? AND a.deleted_at IS NULL";
    $stmt = $db->prepare($sql);
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $data = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $stmt->close();
    $db->close();
    echo json_encode(['success' => true, 'data' => $data]);
    exit;
}

$offset = ($page - 1) * $limit;
$where  = "a.deleted_at IS NULL";
$params = [];
$types  = '';

if ($search) {
    $where   .= " AND (a.name LIKE ? OR a.asset_code LIKE ? OR a.serial_number LIKE ?)";
    $params[] = "%$search%";
    $params[] = "%$search%";
    $params[] = "%$search%";
    $types   .= 'sss';
}

if ($status) {
    $where   .= " AND a.status = ?";
    $params[] = $status;
    $types   .= 's';
}

$count_sql = "SELECT COUNT(*) as total FROM assets a WHERE $where";
$count_stmt = $db->prepare($count_sql);
if ($types) $count_stmt->bind_param($types, ...$params);
$count_stmt->execute();
$total = $count_stmt->get_result()->fetch_assoc()['total'];
$count_stmt->close();

$sql = "SELECT a.*, 
          c.name as category_name, 
          b.name as brand_name, 
          cl.name as client_name 
        FROM assets a
        LEFT JOIN asset_categories c ON a.category_id = c.id
        LEFT JOIN asset_brands b ON a.brand_id = b.id
        LEFT JOIN clients cl ON a.client_id = cl.id
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
