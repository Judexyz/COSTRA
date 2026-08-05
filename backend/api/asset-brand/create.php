<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/auth.php';

authenticate();

$db = getDB();
$data = $_POST;

if (empty($data['name'])) {
    echo json_encode(['success' => false, 'message' => 'Nama brand wajib diisi']);
    exit;
}

$name = $data['name'];
$logo = null;

if (!empty($_FILES['logo']['tmp_name'])) {
    $uploadDir = __DIR__ . '/../../uploads/brands/';
    if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);
    
    $ext = strtolower(pathinfo($_FILES['logo']['name'], PATHINFO_EXTENSION));
    $allowed = ['jpg', 'jpeg', 'png', 'webp'];
    
    if (!in_array($ext, $allowed)) {
        echo json_encode(['success' => false, 'message' => 'Format logo harus JPG, PNG, atau WebP']);
        exit;
    }
    
    if ($_FILES['logo']['size'] > 2 * 1024 * 1024) {
        echo json_encode(['success' => false, 'message' => 'Ukuran logo maksimal 2MB']);
        exit;
    }
    
    $logo_name = uniqid('brand_') . '.' . $ext;
    move_uploaded_file($_FILES['logo']['tmp_name'], $uploadDir . $logo_name);
    $logo = 'uploads/brands/' . $logo_name;
}

$stmt = $db->prepare("INSERT INTO asset_brands (name, logo) VALUES (?, ?)");
$stmt->bind_param('ss', $name, $logo);

if ($stmt->execute()) {
    echo json_encode([
        'success' => true,
        'message' => 'Brand berhasil ditambahkan',
        'id' => $db->insert_id
    ]);
} else {
    echo json_encode(['success' => false, 'message' => $stmt->error]);
}
