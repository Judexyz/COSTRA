<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/auth.php';

$user = authenticate();
if ($user['role'] !== 'admin' && $user['role'] !== 'super_admin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Akses ditolak']);
    exit();
}

$backupDir = __DIR__ . '/../../uploads/backups';
$files = [];

if (is_dir($backupDir)) {
    $scan = scandir($backupDir);
    foreach ($scan as $file) {
        if ($file !== '.' && $file !== '..' && pathinfo($file, PATHINFO_EXTENSION) === 'json') {
            $filepath = $backupDir . '/' . $file;
            $files[] = [
                'filename' => $file,
                'size' => filesize($filepath),
                'created_at' => date('Y-m-d H:i:s', filectime($filepath))
            ];
        }
    }
}

usort($files, function($a, $b) {
    return strtotime($b['created_at']) - strtotime($a['created_at']);
});

echo json_encode([
    'success' => true,
    'data' => $files
]);
