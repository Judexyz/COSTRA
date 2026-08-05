<?php
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/auth.php';

$token = $_GET['token'] ?? '';
if (empty($token)) {
    http_response_code(401);
    die('Token required');
}

$user = null;
try {
    $payload = verifyToken($token);
    if (!$payload) {
        throw new Exception('Invalid token');
    }
    $user = $payload;
} catch (Exception $e) {
    http_response_code(401);
    die('Invalid token');
}

if ($user['role'] !== 'admin' && $user['role'] !== 'super_admin') {
    http_response_code(403);
    die('Akses ditolak');
}

$filename = $_GET['file'] ?? '';
if (empty($filename) || strpos($filename, '..') !== false || pathinfo($filename, PATHINFO_EXTENSION) !== 'json') {
    http_response_code(400);
    die('Invalid file');
}

$filepath = __DIR__ . '/../../uploads/backups/' . basename($filename);

if (!file_exists($filepath)) {
    http_response_code(404);
    die('File not found');
}

header('Content-Description: File Transfer');
header('Content-Type: application/json');
header('Content-Disposition: attachment; filename="' . basename($filepath) . '"');
header('Expires: 0');
header('Cache-Control: must-revalidate');
header('Pragma: public');
header('Content-Length: ' . filesize($filepath));
readfile($filepath);
exit;
