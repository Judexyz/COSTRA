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

$charts = [
    'incidents_by_status' => [],
    'maintenance_by_status' => [],
    'top_causes' => []
];

$inc_where = getDateWhere('created_at', $start_date, $end_date);
$res = $db->query("SELECT status, COUNT(*) as count FROM incidents WHERE 1=1 {$inc_where} GROUP BY status");
while ($row = $res->fetch_assoc()) {
    $charts['incidents_by_status'][] = $row;
}

$mnt_where = getDateWhere('created_at', $start_date, $end_date);
$res = $db->query("SELECT status, COUNT(*) as count FROM maintenance WHERE 1=1 {$mnt_where} GROUP BY status");
while ($row = $res->fetch_assoc()) {
    $charts['maintenance_by_status'][] = $row;
}

$cause_where = getDateWhere('i.created_at', $start_date, $end_date);
$query = "SELECT c.name, COUNT(i.id) as count 
          FROM incidents i 
          JOIN causes c ON i.cause_id = c.id 
          WHERE i.cause_id IS NOT NULL {$cause_where}
          GROUP BY i.cause_id 
          ORDER BY count DESC 
          LIMIT 5";
$res = $db->query($query);
if ($res) {
    while ($row = $res->fetch_assoc()) {
        $charts['top_causes'][] = $row;
    }
}

echo json_encode([
    'success' => true,
    'data' => $charts
]);

$db->close();
