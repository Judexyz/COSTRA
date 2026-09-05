<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/auth.php';

$db = getDB();

$db->query("CREATE TABLE IF NOT EXISTS incidents LIKE tickets");
$db->query("CREATE TABLE IF NOT EXISTS service_requests LIKE tickets");

$asset_stats = $db->query("
    SELECT
        COUNT(*) as total_asset,
        SUM(status = 'active')      as active_asset,
        SUM(status = 'damaged')     as damaged_asset,
        SUM(status = 'maintenance') as maintenance_asset
    FROM assets WHERE deleted_at IS NULL
")->fetch_assoc();

$total_ticket = $db->query("SELECT COUNT(*) as total FROM tickets")->fetch_assoc()['total'];
$open_ticket = $db->query("SELECT COUNT(*) as total FROM tickets WHERE status = 'open' AND deleted_at IS NULL")->fetch_assoc()['total'];

$total_client = $db->query("SELECT COUNT(*) as total FROM clients WHERE deleted_at IS NULL")->fetch_assoc()['total'];

$monthly = $db->query("
    SELECT DATE_FORMAT(created_at, '%b %Y') as month, COUNT(*) as total
    FROM tickets
    WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
    GROUP BY YEAR(created_at), MONTH(created_at)
    ORDER BY created_at ASC
")->fetch_all(MYSQLI_ASSOC);

$db->close();

echo json_encode([
    'success' => true,
    'stats'   => [
        'total_asset'       => (int)$asset_stats['total_asset'],
        'active_asset'      => (int)$asset_stats['active_asset'],
        'damaged_asset'     => (int)$asset_stats['damaged_asset'],
        'maintenance_asset' => (int)$asset_stats['maintenance_asset'],
        'total_ticket'      => (int)$total_ticket,
        'open_ticket'       => (int)$open_ticket,
        'total_client'      => (int)$total_client
    ],
    'monthly_tickets' => $monthly
]);
