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
$cause_id    = (int)($input['cause_id']   ?? 0) ?: null;
$impact_id   = (int)($input['impact_id']  ?? 0) ?: null;

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

    $prefix = "SR-" . date('Ymd') . "-";
    $query = $db->query("SELECT sr_no FROM service_requests WHERE sr_no LIKE '$prefix%' ORDER BY sr_no DESC LIMIT 1");
    if ($query->num_rows > 0) {
        $last = $query->fetch_assoc()['sr_no'];
        $num = intval(substr($last, -3)) + 1;
    } else {
        $num = 1;
    }
    $sr_no = $prefix . str_pad($num, 3, '0', STR_PAD_LEFT);

    $stmt = $db->prepare("INSERT INTO service_requests (sr_no, asset_id, client_id, user_id, priority, severity, description, cause_id, impact_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("siiisssii", $sr_no, $asset_id, $client_id, $user_id, $priority, $severity, $description, $cause_id, $impact_id);

if ($stmt->execute()) {
    echo json_encode([
        'success'   => true,
        'message'   => 'Service Request berhasil dibuat',
        'id'        => $db->insert_id,
        'sr_no' => $sr_no
    ]);
    logAudit($db, $user['id'], 'CREATE', 'SERVICE REQUEST', "Membuat request baru: {$sr_no}");
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Gagal membuat ticket']);
}

$stmt->close();
$db->close();
