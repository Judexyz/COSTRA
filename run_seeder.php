<?php
require_once __DIR__ . '/backend/config/db.php';

$db = getDB();

echo "Memulai proses seeder...<br>";

// Tambahkan role HR jika belum ada
$db->query("INSERT IGNORE INTO roles (name) VALUES ('hr')");
echo "Role 'hr' dipastikan ada.<br>";

// Array user baru
$users = [
    [
        'name' => 'HR',
        'email' => 'hr@himawaridigi.com',
        'password' => password_hash('admin123', PASSWORD_DEFAULT),
        'role' => 'hr'
    ],
    [
        'name' => 'Jude',
        'email' => 'jude@himawaridigi.com',
        'password' => password_hash('admin123', PASSWORD_DEFAULT),
        'role' => 'staff'
    ],
    [
        'name' => 'Yashir',
        'email' => 'yashir@himawaridigi.com',
        'password' => password_hash('admin123', PASSWORD_DEFAULT),
        'role' => 'staff'
    ],
    [
        'name' => 'Jimbo',
        'email' => 'jimbo@himawaridigi.com',
        'password' => password_hash('admin123', PASSWORD_DEFAULT),
        'role' => 'staff'
    ]
];

foreach ($users as $u) {
    // Cek apakah email sudah ada
    $stmt = $db->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->bind_param("s", $u['email']);
    $stmt->execute();
    $res = $stmt->get_result();
    
    if ($res->num_rows == 0) {
        $insert = $db->prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)");
        $insert->bind_param("ssss", $u['name'], $u['email'], $u['password'], $u['role']);
        if ($insert->execute()) {
            echo "Akun " . $u['name'] . " (" . $u['email'] . ") berhasil dibuat!<br>";
        } else {
            echo "Gagal membuat akun " . $u['name'] . ": " . $insert->error . "<br>";
        }
    } else {
        echo "Akun " . $u['name'] . " (" . $u['email'] . ") sudah ada dalam database.<br>";
    }
}

echo "<br><b>Selesai!</b> Silakan hapus file ini jika sudah tidak digunakan.";
?>
