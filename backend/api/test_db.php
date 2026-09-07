<?php
require_once __DIR__ . '/../config/db.php';

try {
    $db = getDB();
    if ($db && !$db->connect_error) {
        echo json_encode([
            'success' => true,
            'message' => 'Koneksi ke database BERHASIL!',
            'host_info' => $db->host_info,
            'database' => DB_NAME
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Koneksi gagal.',
            'error' => $db->connect_error
        ]);
    }
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Terjadi kesalahan.',
        'error' => $e->getMessage()
    ]);
}
