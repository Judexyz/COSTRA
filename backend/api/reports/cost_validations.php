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

$status_filter = $_GET['status'] ?? 'all'; 

$where = "m.cost > 0";
if ($status_filter === 'validated') {
    $where .= " AND m.validation_status = 'validated'";
} else if ($status_filter === 'pending') {
    $where .= " AND m.validation_status = 'pending'";
} else if ($status_filter === 'rejected') {
    $where .= " AND m.validation_status = 'rejected'";
}

$sql = "
    SELECT 
        m.id, 
        m.schedule, 
        m.status as maintenance_status, 
        m.cost, 
        m.notes,
        m.validation_status,
        m.validation_notes,
        a.asset_code,
        a.name as asset_name,
        u.name as technician_name
    FROM maintenance m
    LEFT JOIN assets a ON m.asset_id = a.id
    LEFT JOIN users u ON m.user_id = u.id
    WHERE $where
    ORDER BY m.schedule DESC, m.created_at DESC
    LIMIT 100
";

$result = $db->query($sql);
$validations = [];

if ($result) {
    while ($row = $result->fetch_assoc()) {
        $validations[] = [
            'id' => (int)$row['id'],
            'schedule' => $row['schedule'],
            'maintenance_status' => $row['maintenance_status'],
            'cost' => (float)$row['cost'],
            'notes' => $row['notes'],
            'validation_status' => $row['validation_status'],
            'validation_notes' => $row['validation_notes'],
            'asset_code' => $row['asset_code'] ?: '-',
            'asset_name' => $row['asset_name'] ?: 'Aset Dihapus',
            'technician_name' => $row['technician_name'] ?: '-'
        ];
    }
}

echo json_encode([
    'success' => true,
    'data' => $validations
]);
$db->close();
