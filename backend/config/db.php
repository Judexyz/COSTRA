<?php
require_once __DIR__ . '/env.php';

function getDB() {
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);

    if ($conn->connect_error) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Koneksi database gagal'
        ]);
        exit();
    }

    $conn->query("
    CREATE TABLE IF NOT EXISTS audit_logs (
        id         INT AUTO_INCREMENT PRIMARY KEY,
        user_id    INT NULL,
        action     VARCHAR(50) NOT NULL,
        module     VARCHAR(50) NOT NULL,
        detail     TEXT NULL,
        ip_address VARCHAR(50) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )");

    $conn->set_charset('utf8mb4');
    return $conn;
}
