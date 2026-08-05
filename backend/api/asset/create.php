<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../utils/audit.php';

$user = authenticate();

$db = getDB();
$data = $_POST;

if (empty($data['name'])) {
    echo json_encode(['success' => false, 'message' => 'Nama asset wajib diisi']);
    exit;
}

$date = date('Ymd');
$countStmt = $db->query("SELECT COUNT(*) as count FROM assets WHERE DATE(created_at) = CURDATE()");
$count = (int)$countStmt->fetch_assoc()['count'] + 1;
$asset_code = 'AST-' . $date . '-' . str_pad($count, 3, '0', STR_PAD_LEFT);

$fields = ['asset_code', 'name', 'status', 'serial_number'];
$values = [$asset_code, $data['name'], $data['status'] ?? 'active', $data['serial_number'] ?? ''];
$types  = 'ssss';

if (!empty($data['category_id']) && (int)$data['category_id'] > 0) {
    $fields[] = 'category_id'; $values[] = (int)$data['category_id']; $types .= 'i';
}
if (!empty($data['brand_id']) && (int)$data['brand_id'] > 0) {
    $fields[] = 'brand_id';    $values[] = (int)$data['brand_id'];    $types .= 'i';
}
if (!empty($data['client_id']) && (int)$data['client_id'] > 0) {
    $fields[] = 'client_id';   $values[] = (int)$data['client_id'];   $types .= 'i';
}

if (!empty($data['location'])) {
    $fields[] = 'location'; $values[] = $data['location']; $types .= 's';
}
if (!empty($data['purchase_date'])) {
    $fields[] = 'purchase_date'; $values[] = $data['purchase_date']; $types .= 's';
}
if (!empty($data['warranty_exp'])) {
    $fields[] = 'warranty_exp'; $values[] = $data['warranty_exp']; $types .= 's';
}
if (!empty($data['description'])) {
    $fields[] = 'description'; $values[] = $data['description']; $types .= 's';
}

if (!empty($_FILES['photo']['tmp_name'])) {
    if ($_FILES['photo']['error'] !== UPLOAD_ERR_OK) {
        echo json_encode(['success' => false, 'message' => 'Upload foto gagal. Error code: ' . $_FILES['photo']['error']]);
        exit;
    }
    
    $uploadDir = __DIR__ . '/../../../uploads/assets/';
    
    if (!is_dir($uploadDir)) {
        if (!mkdir($uploadDir, 0777, true)) {
            echo json_encode(['success' => false, 'message' => 'Gagal membuat folder upload']);
            exit;
        }
    }
    
    $ext = strtolower(pathinfo($_FILES['photo']['name'], PATHINFO_EXTENSION));
    $allowed = ['jpg', 'jpeg', 'png', 'webp'];
    
    if (!in_array($ext, $allowed)) {
        echo json_encode(['success' => false, 'message' => 'Format foto harus JPG, PNG, atau WebP']);
        exit;
    }
    
    if ($_FILES['photo']['size'] > 2 * 1024 * 1024) {
        echo json_encode(['success' => false, 'message' => 'Ukuran foto maksimal 2MB']);
        exit;
    }
    
    $photo_name = uniqid('asset_') . '.' . $ext;
    $targetPath = $uploadDir . $photo_name;
    
    if (!move_uploaded_file($_FILES['photo']['tmp_name'], $targetPath)) {
        echo json_encode(['success' => false, 'message' => 'Gagal memindahkan file foto']);
        exit;
    }
    
    $fields[] = 'photo';
    $values[] = 'uploads/assets/' . $photo_name;
    $types   .= 's';
}

$placeholders = implode(', ', array_fill(0, count($fields), '?'));
$sql = "INSERT INTO assets (" . implode(', ', $fields) . ") VALUES ($placeholders)";

$stmt = $db->prepare($sql);
$stmt->bind_param($types, ...$values);

if ($stmt->execute()) {
    echo json_encode([
        'success'    => true, 
        'message'    => 'Asset berhasil ditambahkan', 
        'id'         => $db->insert_id,
        'asset_code' => $asset_code
    ]);
    
    logAudit($db, $user['id'], 'CREATE', 'ASSET', "Menambahkan aset baru: {$asset_code}");
} else {
    echo json_encode(['success' => false, 'message' => $stmt->error]);
}
