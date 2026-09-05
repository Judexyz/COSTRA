<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: PUT');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/auth.php';

authenticate();

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method tidak diizinkan']);
    exit();
}

$input       = json_decode(file_get_contents('php://input'), true);
$id          = (int)($input['id']          ?? 0);
$name        = trim($input['name']         ?? '');
$description = trim($input['description']  ?? '');

if (!$id) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'ID wajib diisi']);
    exit();
}
if (!$name) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Nama kategori wajib diisi']);
    exit();
}

$db = getDB();

$check = $db->prepare('SELECT id FROM asset_categories WHERE id = ? AND deleted_at IS NULL');
$check->bind_param('i', $id);
$check->execute();
if ($check->get_result()->num_rows === 0) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Kategori tidak ditemukan']);
    $check->close();
    $db->close();
    exit();
}
$check->close();

$dup = $db->prepare('SELECT id FROM asset_categories WHERE name = ? AND id != ? AND deleted_at IS NULL');
$dup->bind_param('si', $name, $id);
$dup->execute();
if ($dup->get_result()->num_rows > 0) {
    http_response_code(409);
    echo json_encode(['success' => false, 'message' => 'Nama kategori sudah digunakan']);
    $dup->close();
    $db->close();
    exit();
}
$dup->close();

$stmt = $db->prepare('UPDATE asset_categories SET name = ?, description = ?, updated_at = NOW() WHERE id = ?');
$stmt->bind_param('ssi', $name, $description, $id);

if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Kategori berhasil diperbarui']);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Gagal memperbarui data']);
}

$stmt->close();
$db->close();
