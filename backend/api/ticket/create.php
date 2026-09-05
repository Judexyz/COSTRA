<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../utils/audit.php';

$user = authenticate();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method tidak diizinkan']);
    exit();
}

$input       = json_decode(file_get_contents('php://input'), true);
$asset_id    = (int)($input['asset_id']   ?? 0) ?: null;
$client_id   = (int)($input['client_id']  ?? 0) ?: null;
$user_id     = (int)($input['user_id']    ?? 0) ?: null;
$priority    = $input['priority']          ?? 'medium';
$severity    = $input['severity']          ?? 'minor';
$description = trim($input['description'] ?? '');

if (!$description) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Deskripsi wajib diisi']);
    exit();
}

$allowed_priority = ['low', 'medium', 'high', 'critical'];
$allowed_severity = ['minor', 'major', 'critical'];
if (!in_array($priority, $allowed_priority)) $priority = 'medium';
if (!in_array($severity, $allowed_severity)) $severity = 'minor';

$db = getDB();

if (!$user_id) {
    if ($asset_id) {
        $res = $db->query("SELECT category_id FROM assets WHERE id = $asset_id");
        if ($res && $res->num_rows > 0) {
            $cat_id = $res->fetch_assoc()['category_id'];
            $tech_res = $db->query("SELECT id FROM users WHERE role IN ('technician', 'admin') ORDER BY RAND() LIMIT 1");
            if ($tech_res && $tech_res->num_rows > 0) {
                $user_id = $tech_res->fetch_assoc()['id'];
            }
        }
    }
    if (!$user_id) $user_id = 1; 
}

$sla_hours = 48;
if ($priority === 'critical') $sla_hours = 4;
elseif ($priority === 'high') $sla_hours = 12;
elseif ($priority === 'low') $sla_hours = 120;
$sla_due_date = date('Y-m-d H:i:s', strtotime("+$sla_hours hours"));
$sla_status = 'ok';

$year   = date('Y');
$count  = $db->query("SELECT COUNT(*) as total FROM tickets WHERE YEAR(created_at) = $year")->fetch_assoc()['total'];
$ticket_no = 'TKT-' . $year . '-' . str_pad($count + 1, 4, '0', STR_PAD_LEFT);

$stmt = $db->prepare('INSERT INTO tickets
    (ticket_no, asset_id, client_id, user_id, priority, severity, status, description, sla_due_date, sla_status, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');

$status = 'open';
$created_by = $user['id'];
$stmt->bind_param('siiissssssi',
    $ticket_no, $asset_id, $client_id, $user_id,
    $priority, $severity, $status, $description, $sla_due_date, $sla_status, $created_by
);

if ($stmt->execute()) {
    echo json_encode([
        'success'   => true,
        'message'   => 'Ticket berhasil dibuat',
        'id'        => $db->insert_id,
        'ticket_no' => $ticket_no
    ]);
    logAudit($db, $user['id'], 'CREATE', 'TICKET', "Membuat tiket baru: {$ticket_no}");
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Gagal membuat ticket']);
}

$stmt->close();
$db->close();
