<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/auth.php';

$user = authenticate();

if ($user['role'] !== 'admin' && $user['role'] !== 'super_admin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Akses ditolak. Membutuhkan hak akses admin.']);
    exit();
}

$db = getDB();

$sql = "
    SELECT 
        a.id, 
        a.asset_code, 
        a.name, 
        a.status,
        c.name as category_name,
        b.name as brand_name,
        (SELECT COUNT(*) FROM tickets t WHERE t.asset_id = a.id) as total_tickets,
        (SELECT COALESCE(SUM(cost), 0) FROM maintenance m WHERE m.asset_id = a.id) as total_maintenance_cost
    FROM assets a
    LEFT JOIN asset_categories c ON a.category_id = c.id
    LEFT JOIN asset_brands b ON a.brand_id = b.id
    ORDER BY (total_tickets * 10) + total_maintenance_cost DESC
    LIMIT 100
";

$result = $db->query($sql);
$assets = [];

if ($result) {
    while ($row = $result->fetch_assoc()) {
        $assets[] = [
            'id' => (int)$row['id'],
            'asset_code' => $row['asset_code'],
            'name' => $row['name'],
            'status' => $row['status'],
            'category_name' => $row['category_name'] ?: '-',
            'brand_name' => $row['brand_name'] ?: '-',
            'total_tickets' => (int)$row['total_tickets'],
            'total_maintenance_cost' => (float)$row['total_maintenance_cost']
        ];
    }
}

echo json_encode([
    'success' => true,
    'data' => $assets
]);
$db->close();
