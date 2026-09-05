<?php
require_once __DIR__ . '/../config/db.php';

$db = getDB();

// 1. Tambahkan kolom SLA pada tabel tickets
$sql = "SHOW COLUMNS FROM tickets LIKE 'sla_due_date'";
if ($db->query($sql)->num_rows === 0) {
    $db->query("ALTER TABLE tickets ADD COLUMN sla_due_date DATETIME NULL AFTER status");
    $db->query("ALTER TABLE tickets ADD COLUMN sla_status ENUM('ok', 'warning', 'breached') NOT NULL DEFAULT 'ok' AFTER sla_due_date");
    echo "Added SLA columns to tickets table.\n";
} else {
    echo "SLA columns already exist.\n";
}

// 2. Buat tabel ticket_comments
$sql = "CREATE TABLE IF NOT EXISTS ticket_comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT NOT NULL,
    user_id INT NOT NULL,
    message TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
)";
if ($db->query($sql)) {
    echo "Table ticket_comments is ready.\n";
} else {
    echo "Error creating ticket_comments: " . $db->error . "\n";
}

// 3. Buat tabel ticket_attachments
$sql = "CREATE TABLE IF NOT EXISTS ticket_attachments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT NOT NULL,
    comment_id INT NULL,
    file_path VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    uploaded_by INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
    FOREIGN KEY (comment_id) REFERENCES ticket_comments(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
)";
if ($db->query($sql)) {
    echo "Table ticket_attachments is ready.\n";
} else {
    echo "Error creating ticket_attachments: " . $db->error . "\n";
}

// Update existing tickets to have SLA due dates (defaulting to +48 hours for simplicity)
$db->query("UPDATE tickets SET sla_due_date = DATE_ADD(created_at, INTERVAL 48 HOUR) WHERE sla_due_date IS NULL");

echo "Database upgrade complete.\n";
$db->close();
