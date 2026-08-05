<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/auth.php';

authenticate();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method tidak diizinkan']);
    exit();
}

function generateSerialNumber(string $prefix = 'HD', int $randomLen = 8, int $seqLen = 3): string {
    $random = str_pad((string)mt_rand(
        (int)str_repeat('1', $randomLen),
        (int)str_repeat('9', $randomLen)
    ), $randomLen, '0', STR_PAD_LEFT);
    
    $now = new DateTime();
    $startOfDay = new DateTime($now->format('Y-m-d 00:00:00'));
    $seconds = $now->getTimestamp() - $startOfDay->getTimestamp();
    $seq = str_pad((string)(($seconds % 900) + 100), $seqLen, '0', STR_PAD_LEFT);
    
    return "{$prefix}-{$random}-{$seq}";
}

$name           = trim($_POST['name']           ?? '');
$category_id    = !empty($_POST['category_id']) ? (int)$_POST['category_id'] : null;
$sub_cat_id     = !empty($_POST['sub_cat_id'])  ? (int)$_POST['sub_cat_id']  : null;
$brand_id       = !empty($_POST['brand_id'])    ? (int)$_POST['brand_id']    : null;
$client_id      = !empty($_POST['client_id'])   ? (int)$_POST['client_id']   : null;
$purchase_date  = $_POST['purchase_date']        ?? null;
$warranty_exp   = $_POST['warranty_exp']         ?? null;
$serial_number  = trim($_POST['serial_number']   ?? '');
$status         = $_POST['status']               ?? 'active';
$location       = trim($_POST['location']        ?? '');
$description    = trim($_POST['description']     ?? '');

if (!$name) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Nama asset wajib diisi']);
    exit();
}

$allowed_status = ['active', 'damaged', 'maintenance'];
if (!in_array($status, $allowed_status)) $status = 'active';

$db = getDB();

if (empty($serial_number)) {
    $serial_number = generateSerialNumber();
}

$check = $db->prepare('SELECT id FROM assets WHERE serial_number = ? AND deleted_at IS NULL');
$check->bind_param('s', $serial_number);
$check->execute();
if ($check->get_result()->num_rows > 0) {
    $serial_number = generateSerialNumber() . '-' . str_pad((string)mt_rand(1, 999), 3, '0', STR_PAD_LEFT);
}
$check->close();

$year  = date('Y');
$count = $db->query("SELECT COUNT(*) as total FROM assets WHERE YEAR(created_at) = $year")->fetch_assoc()['total'];
$asset_code = 'AST-' . $year . '-' . str_pad($count + 1, 4, '0', STR_PAD_LEFT);

$photo = null;
if (isset($_FILES['photo']) && $_FILES['photo']['error'] === 0) {
    $allowed_ext  = ['jpg', 'jpeg', 'png', 'webp'];
    $max_size     = 2 * 1024 * 1024;
    $file         = $_FILES['photo'];
    $ext          = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));

    if (!in_array($ext, $allowed_ext)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Format foto tidak valid (jpg, jpeg, png, webp)']);
        $db->close();
        exit();
    }
    if ($file['size'] > $max_size) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Ukuran foto maksimal 2MB']);
        $db->close();
        exit();
    }

    $filename = 'asset_' . time() . '_' . uniqid() . '.' . $ext;
    $dest     = __DIR__ . '/../../../uploads/assets/' . $filename;

    if (move_uploaded_file($file['tmp_name'], $dest)) {
        $photo = $filename;
    }
}

$stmt = $db->prepare('INSERT INTO assets
    (asset_code, name, category_id, sub_category_id, brand_id, client_id,
     purchase_date, warranty_exp, serial_number, status, location, photo, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');

$stmt->bind_param(
    'ssiiiisssssss',
    $asset_code, $name, $category_id, $sub_cat_id, $brand_id, $client_id,
    $purchase_date, $warranty_exp, $serial_number, $status, $location, $photo, $description
);

if ($stmt->execute()) {
    echo json_encode([
        'success'       => true,
        'message'       => 'Asset berhasil ditambahkan',
        'id'            => $db->insert_id,
        'asset_code'    => $asset_code,
        'serial_number' => $serial_number
    ]);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Gagal menyimpan data: ' . $stmt->error]);
}

$stmt->close();
$db->close();
