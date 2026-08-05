<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/auth.php';

authenticate();

$db = getDB();

$stmt = $db->query("SELECT id, name, logo FROM asset_brands WHERE deleted_at IS NULL ORDER BY name");
$data = $stmt->fetch_all(MYSQLI_ASSOC);

echo json_encode(['success' => true, 'data' => $data]);
