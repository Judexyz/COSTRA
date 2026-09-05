<?php
require_once __DIR__ . '/../config/db.php';

$db = getDB();

// 1. Add created_by column
$sql = "SHOW COLUMNS FROM tickets LIKE 'created_by'";
if ($db->query($sql)->num_rows === 0) {
    // Add created_by nullable first
    $db->query("ALTER TABLE tickets ADD COLUMN created_by INT NULL AFTER user_id");
    // Set existing tickets created_by to user_id or 1
    $db->query("UPDATE tickets SET created_by = COALESCE(user_id, 1)");
    // Add foreign key
    $db->query("ALTER TABLE tickets ADD CONSTRAINT fk_ticket_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL");
    echo "Added created_by column.\n";
} else {
    echo "created_by column already exists.\n";
}

// 2. Modify status enum
$sql = "ALTER TABLE tickets MODIFY COLUMN status ENUM('open', 'in_progress', 'resolved', 'closed', 'rejected') NOT NULL DEFAULT 'open'";
if ($db->query($sql)) {
    echo "Modified status ENUM to include 'resolved'.\n";
} else {
    echo "Error modifying status ENUM: " . $db->error . "\n";
}

echo "Database RBAC upgrade complete.\n";
$db->close();
