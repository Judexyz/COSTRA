<?php
require_once __DIR__ . '/backend/config/db.php';

$db = getDB();

echo "Memulai proses migrasi tabel...<br>";

$query = "
CREATE TABLE IF NOT EXISTS overtime_requests (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT NOT NULL,
    date        DATE NOT NULL,
    start_time  TIME NOT NULL,
    end_time    TIME NOT NULL,
    reason      TEXT NULL,
    status      ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
    approver_id INT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (approver_id) REFERENCES users(id) ON DELETE SET NULL
)";

if ($db->query($query)) {
    echo "Berhasil membuat tabel overtime_requests!<br>";
} else {
    echo "Gagal membuat tabel overtime_requests: " . $db->error . "<br>";
}

echo "<br><b>Selesai!</b> Silakan hapus file ini jika sudah tidak digunakan.";
?>
