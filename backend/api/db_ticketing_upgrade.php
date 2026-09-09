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

// 4. Buat tabel causes
$sql = "CREATE TABLE IF NOT EXISTS causes (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    description TEXT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at  TIMESTAMP NULL DEFAULT NULL
)";
if ($db->query($sql)) {
    echo "Table causes is ready.\n";
} else {
    echo "Error creating causes: " . $db->error . "\n";
}

// 5. Buat tabel impacts
$sql = "CREATE TABLE IF NOT EXISTS impacts (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    description TEXT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at  TIMESTAMP NULL DEFAULT NULL
)";
if ($db->query($sql)) {
    echo "Table impacts is ready.\n";
} else {
    echo "Error creating impacts: " . $db->error . "\n";
}

// 6. Buat tabel audit_logs
$sql = "CREATE TABLE IF NOT EXISTS audit_logs (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    user_id    INT NULL,
    action     VARCHAR(50) NOT NULL,
    module     VARCHAR(50) NOT NULL,
    detail     TEXT NULL,
    ip_address VARCHAR(50) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
)";
if ($db->query($sql)) {
    echo "Table audit_logs is ready.\n";
} else {
    echo "Error creating audit_logs: " . $db->error . "\n";
}

// 7. Buat tabel maintenance (just in case)
$sql = "CREATE TABLE IF NOT EXISTS maintenance (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    asset_id    INT NULL,
    user_id     INT NULL,
    schedule    DATE NOT NULL,
    status      ENUM('scheduled','in_progress','done','cancelled') DEFAULT 'scheduled',
    notes       TEXT NULL,
    cost        DECIMAL(12,2) NULL DEFAULT 0.00,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at  TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (asset_id) REFERENCES assets(id),
    FOREIGN KEY (user_id)  REFERENCES users(id)
)";
if ($db->query($sql)) {
    echo "Table maintenance is ready.\n";
} else {
    echo "Error creating maintenance: " . $db->error . "\n";
}

// 8. Buat tabel incidents
$sql = "CREATE TABLE IF NOT EXISTS incidents (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    incident_no VARCHAR(50) NOT NULL UNIQUE,
    asset_id    INT NULL,
    client_id   INT NULL,
    user_id     INT NULL,
    cause_id    INT NULL,
    impact_id   INT NULL,
    priority    ENUM('low','medium','high','critical') DEFAULT 'medium',
    severity    ENUM('minor','major','critical') DEFAULT 'minor',
    status      ENUM('open','assigned','progress','pending','closed') DEFAULT 'open',
    sla_due_date DATETIME NULL,
    sla_status  ENUM('ok','warning','breached') NOT NULL DEFAULT 'ok',
    description TEXT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at  TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (asset_id)  REFERENCES assets(id),
    FOREIGN KEY (client_id) REFERENCES clients(id),
    FOREIGN KEY (user_id)   REFERENCES users(id),
    FOREIGN KEY (cause_id)  REFERENCES causes(id),
    FOREIGN KEY (impact_id) REFERENCES impacts(id)
)";
if ($db->query($sql)) {
    echo "Table incidents is ready.\n";
} else {
    echo "Error creating incidents: " . $db->error . "\n";
}

// 9. Buat tabel service_requests
$sql = "CREATE TABLE IF NOT EXISTS service_requests (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    sr_no       VARCHAR(50) NOT NULL UNIQUE,
    asset_id    INT NULL,
    client_id   INT NULL,
    user_id     INT NULL,
    cause_id    INT NULL,
    impact_id   INT NULL,
    priority    ENUM('low','medium','high','critical') DEFAULT 'medium',
    severity    ENUM('minor','major','critical') DEFAULT 'minor',
    status      ENUM('open','assigned','progress','pending','closed') DEFAULT 'open',
    sla_due_date DATETIME NULL,
    sla_status  ENUM('ok','warning','breached') NOT NULL DEFAULT 'ok',
    description TEXT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at  TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (asset_id)  REFERENCES assets(id),
    FOREIGN KEY (client_id) REFERENCES clients(id),
    FOREIGN KEY (user_id)   REFERENCES users(id),
    FOREIGN KEY (cause_id)  REFERENCES causes(id),
    FOREIGN KEY (impact_id) REFERENCES impacts(id)
)";
if ($db->query($sql)) {
    echo "Table service_requests is ready.\n";
} else {
    echo "Error creating service_requests: " . $db->error . "\n";
}

// 10. Tambahkan kolom cost pada tabel maintenance
$sql = "SHOW COLUMNS FROM maintenance LIKE 'cost'";
if ($db->query($sql)->num_rows === 0) {
    $db->query("ALTER TABLE maintenance ADD COLUMN cost DECIMAL(12,2) NULL DEFAULT 0.00 AFTER notes");
    echo "Added cost column to maintenance table.\n";
} else {
    echo "Cost column already exists in maintenance table.\n";
}

// 11. Pastikan kolom cause_id dan impact_id ada di incidents
$sql = "SHOW COLUMNS FROM incidents LIKE 'cause_id'";
if ($db->query($sql)->num_rows === 0) {
    $db->query("ALTER TABLE incidents ADD COLUMN cause_id INT NULL AFTER user_id");
    $db->query("ALTER TABLE incidents ADD FOREIGN KEY (cause_id) REFERENCES causes(id)");
    echo "Added cause_id to incidents table.\n";
}
$sql = "SHOW COLUMNS FROM incidents LIKE 'impact_id'";
if ($db->query($sql)->num_rows === 0) {
    $db->query("ALTER TABLE incidents ADD COLUMN impact_id INT NULL AFTER cause_id");
    $db->query("ALTER TABLE incidents ADD FOREIGN KEY (impact_id) REFERENCES impacts(id)");
    echo "Added impact_id to incidents table.\n";
}

// 12. Pastikan kolom cause_id dan impact_id ada di service_requests
$sql = "SHOW COLUMNS FROM service_requests LIKE 'cause_id'";
if ($db->query($sql)->num_rows === 0) {
    $db->query("ALTER TABLE service_requests ADD COLUMN cause_id INT NULL AFTER user_id");
    $db->query("ALTER TABLE service_requests ADD FOREIGN KEY (cause_id) REFERENCES causes(id)");
    echo "Added cause_id to service_requests table.\n";
}
$sql = "SHOW COLUMNS FROM service_requests LIKE 'impact_id'";
if ($db->query($sql)->num_rows === 0) {
    $db->query("ALTER TABLE service_requests ADD COLUMN impact_id INT NULL AFTER cause_id");
    $db->query("ALTER TABLE service_requests ADD FOREIGN KEY (impact_id) REFERENCES impacts(id)");
    echo "Added impact_id to service_requests table.\n";
}

echo "Database upgrade complete.\n";
$db->close();
