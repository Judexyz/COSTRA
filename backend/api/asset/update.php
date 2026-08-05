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
$id = !empty($data['id']) ? (int)$data['id'] : 0;

if (!$id) {
    echo json_encode(['success' => false, 'message' => 'ID asset wajib diisi']);
    exit;
}

$fields = [];
$params = [];
$types = '';

if (isset($data['name'])) {
    $fields[] = "name = ?";
    $params[] = $data['name'];
    $types .= 's';
}
if (isset($data['category_id'])) {
    $fields[] = "category_id = ?";
    $params[] = !empty($data['category_id']) ? (int)$data['category_id'] : null;
    $types .= 'i';
}
if (isset($data['brand_id'])) {
    $fields[] = "brand_id = ?";
    $params[] = !empty($data['brand_id']) ? (int)$data['brand_id'] : null;
    $types .= 'i';
}
if (isset($data['client_id'])) {
    $fields[] = "client_id = ?";
    $params[] = !empty($data['client_id']) ? (int)$data['client_id'] : null;
    $types .= 'i';
}
if (isset($data['status'])) {
    $fields[] = "status = ?";
    $params[] = $data['status'];
    $types .= 's';
}
if (isset($data['serial_number'])) {
    $fields[] = "serial_number = ?";
    $params[] = $data['serial_number'];
    $types .= 's';
}
if (isset($data['location'])) {
    $fields[] = "location = ?";
    $params[] = $data['location'];
    $types .= 's';
}
if (isset($data['purchase_date'])) {
    $fields[] = "purchase_date = ?";
    $params[] = !empty($data['purchase_date']) ? $data['purchase_date'] : null;
    $types .= 's';
}
if (isset($data['warranty_exp'])) {
    $fields[] = "warranty_exp = ?";
    $params[] = !empty($data['warranty_exp']) ? $data['warranty_exp'] : null;
    $types .= 's';
}
if (isset($data['description'])) {
    $fields[] = "description = ?";
    $params[] = $data['description'];
    $types .= 's';
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
    
    $fields[] = "photo = ?";
    $params[] = 'uploads/assets/' . $photo_name;
    $types .= 's';
}

if (empty($fields)) {
    echo json_encode(['success' => false, 'message' => 'Tidak ada data yang diupdate']);
    exit;
}

$params[] = $id;
$types .= 'i';

$sql = "UPDATE assets SET " . implode(', ', $fields) . " WHERE id = ?";
$stmt = $db->prepare($sql);
$stmt->bind_param($types, ...$params);

if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Asset berhasil diperbarui']);
    logAudit($db, $user['id'], 'UPDATE', 'ASSET', "Memperbarui aset dengan ID: {$id}");
} else {
    echo json_encode(['success' => false, 'message' => $stmt->error]);
}
