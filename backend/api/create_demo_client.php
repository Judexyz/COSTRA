<?php
header('Content-Type: text/plain');

require_once __DIR__ . '/../config/db.php';
$db = getDB();

// 1. Update the role enum to include 'client'
$sql = "ALTER TABLE users MODIFY COLUMN role ENUM('super_admin','admin','staff','technician','client') NOT NULL DEFAULT 'staff'";
if ($db->query($sql)) {
    echo "Successfully updated users table role ENUM to include 'client'.\n";
} else {
    echo "Error updating users table role ENUM: " . $db->error . "\n";
}

// 2. Check if the demo client already exists
$email = 'client@demo.com';
$stmt = $db->prepare("SELECT id FROM users WHERE email = ?");
$stmt->bind_param('s', $email);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    echo "Demo client account already exists!\n";
    echo "Email: client@demo.com\n";
    echo "Password: password123\n";
} else {
    // 3. Create the demo client account
    $name = 'Demo Client';
    $password = password_hash('password123', PASSWORD_DEFAULT);
    $role = 'client';
    
    $insertStmt = $db->prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)");
    $insertStmt->bind_param('ssss', $name, $email, $password, $role);
    
    if ($insertStmt->execute()) {
        echo "Demo client account successfully created!\n";
        echo "Email: client@demo.com\n";
        echo "Password: password123\n";
    } else {
        echo "Error creating demo client account: " . $insertStmt->error . "\n";
    }
    $insertStmt->close();
}

$stmt->close();
$db->close();
?>
