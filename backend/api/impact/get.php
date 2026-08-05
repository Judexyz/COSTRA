<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

set_error_handler(function($errno, $errstr, $errfile, $errline) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => "$errstr in $errfile on line $errline"]);
    exit;
});
set_exception_handler(function($e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage() . ' in ' . $e->getFile() . ' on line ' . $e->getLine()]);
    exit;
});

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/auth.php';

authenticate();

$db = getDB();

$id      = (int)($_GET['id'] ?? 0);
$search  = $_GET['search']  ?? '';
$sort    = $_GET['sort']    ?? 'id';
$order   = $_GET['order']   ?? 'DESC';
$page    = (int)($_GET['page']  ?? 1);
$limit   = (int)($_GET['limit'] ?? 10);
$offset  = ($page - 1) * $limit;

$allowed_sort = ['id', 'name', 'created_at'];
if (!in_array($sort, $allowed_sort)) $sort = 'id';
$order = strtoupper($order) === 'ASC' ? 'ASC' : 'DESC';

if ($id) {
    $stmt = $db->prepare('SELECT * FROM impacts WHERE id = ? AND deleted_at IS NULL');
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        echo json_encode(['success' => true, 'data' => [$result->fetch_assoc()]]);
    } else {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Dampak tidak ditemukan']);
    }
    $stmt->close();
    $db->close();
    exit();
}

$where = "deleted_at IS NULL";
$params = [];
$types  = '';

if ($search) {
    $where   .= " AND (name LIKE ? OR description LIKE ?)";
    $keyword  = "%$search%";
    $params   = [$keyword, $keyword];
    $types    = 'ss';
}

$count_sql  = "SELECT COUNT(*) as total FROM impacts WHERE $where";
$count_stmt = $db->prepare($count_sql);
if ($types) $count_stmt->bind_param($types, ...$params);
$count_stmt->execute();
$total = $count_stmt->get_result()->fetch_assoc()['total'];
$count_stmt->close();

$sql  = "SELECT id, name, description, created_at FROM impacts WHERE $where ORDER BY $sort $order LIMIT ? OFFSET ?";
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
