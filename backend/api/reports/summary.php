<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/auth.php';

$user = authenticate();

$start_date = $_GET['start_date'] ?? null;
$end_date = $_GET['end_date'] ?? null;

if ($start_date && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $start_date)) {
    $start_date = null;
}
if ($end_date && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $end_date)) {
    $end_date = null;
}

$db = getDB();

function getDateWhere($col, $start, $end) {
    if ($start && $end) {
        return " AND DATE($col) >= '$start' AND DATE($col) <= '$end'";
    } elseif ($start) {
        return " AND DATE($col) >= '$start'";
    } elseif ($end) {
        return " AND DATE($col) <= '$end'";
    }
    return "";
}

$summary = [
    'assets' => [],
    'incidents' => [],
    'service_requests' => [],
    'maintenances' => []
];

$asset_where = getDateWhere('created_at', $start_date, $end_date);
$res = $db->query("SELECT 
    COUNT(*) as total,
    SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
    SUM(CASE WHEN status = 'damaged' THEN 1 ELSE 0 END) as damaged,
    SUM(CASE WHEN status = 'maintenance' THEN 1 ELSE 0 END) as maintenance
    FROM assets WHERE deleted_at IS NULL" . $asset_where);
$summary['assets'] = $res->fetch_assoc();

$inc_where = getDateWhere('created_at', $start_date, $end_date);
$res = $db->query("SELECT 
    COUNT(*) as total,
    SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open,
    SUM(CASE WHEN status = 'in_progress' OR status = 'assigned' OR status = 'progress' THEN 1 ELSE 0 END) as in_progress,
    SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
    FROM incidents WHERE 1=1" . $inc_where);
$summary['incidents'] = $res->fetch_assoc();

$sr_where = getDateWhere('created_at', $start_date, $end_date);
$res = $db->query("SELECT 
    COUNT(*) as total,
    SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open,
    SUM(CASE WHEN status = 'in_progress' OR status = 'assigned' OR status = 'progress' THEN 1 ELSE 0 END) as in_progress,
    SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
    FROM service_requests WHERE 1=1" . $sr_where);
$summary['service_requests'] = $res->fetch_assoc();

$mnt_where = getDateWhere('created_at', $start_date, $end_date);
$res = $db->query("SELECT 
    COUNT(*) as total,
    SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) as scheduled,
    SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
    SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled
    FROM maintenance WHERE 1=1" . $mnt_where);
$summary['maintenances'] = $res->fetch_assoc();

echo json_encode([
    'success' => true,
    'data' => $summary
]);

$db->close();
