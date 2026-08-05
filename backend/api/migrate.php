<?php
header('Content-Type: text/plain');
require_once __DIR__ . '/../config/db.php';
$db = getDB();

$sqlIncident = "CREATE TABLE IF NOT EXISTS incidents (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    incident_no VARCHAR(50) NOT NULL UNIQUE,
    asset_id    INT NULL,
    client_id   INT NULL,
    user_id     INT NULL,
    priority    ENUM('low','medium','high','critical') DEFAULT 'medium',
    severity    ENUM('minor','major','critical') DEFAULT 'minor',
    status      ENUM('open','assigned','progress','pending','solved','closed') DEFAULT 'open',
    description TEXT NULL,
    cause_id    INT NULL,
    impact_id   INT NULL,
    solution_note TEXT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at  TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (asset_id)  REFERENCES assets(id),
    FOREIGN KEY (client_id) REFERENCES clients(id),
    FOREIGN KEY (user_id)   REFERENCES users(id),
    FOREIGN KEY (cause_id)  REFERENCES causes(id),
    FOREIGN KEY (impact_id) REFERENCES impacts(id)
) ENGINE=InnoDB;";

$sqlSR = "CREATE TABLE IF NOT EXISTS service_requests (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    sr_no       VARCHAR(50) NOT NULL UNIQUE,
    asset_id    INT NULL,
    client_id   INT NULL,
    user_id     INT NULL,
    priority    ENUM('low','medium','high','critical') DEFAULT 'medium',
    severity    ENUM('minor','major','critical') DEFAULT 'minor',
    status      ENUM('open','assigned','progress','pending','solved','closed') DEFAULT 'open',
    description TEXT NULL,
    cause_id    INT NULL,
    impact_id   INT NULL,
    solution_note TEXT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at  TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (asset_id)  REFERENCES assets(id),
    FOREIGN KEY (client_id) REFERENCES clients(id),
    FOREIGN KEY (user_id)   REFERENCES users(id),
    FOREIGN KEY (cause_id)  REFERENCES causes(id),
    FOREIGN KEY (impact_id) REFERENCES impacts(id)
) ENGINE=InnoDB;";

$sqlCause = "CREATE TABLE IF NOT EXISTS causes (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at  TIMESTAMP NULL DEFAULT NULL
)";

$sqlImpact = "CREATE TABLE IF NOT EXISTS impacts (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at  TIMESTAMP NULL DEFAULT NULL
)";

if ($db->query($sqlIncident)) {
    echo "Table incidents created.\n";
} else {
    echo "Error creating incidents: " . $db->error . "\n";
}

if ($db->query($sqlSR)) {
    echo "Table service_requests created.\n";
} else {
    echo "Error creating service_requests: " . $db->error . "\n";
}

if ($db->query($sqlCause)) {
    echo "Table causes created.\n";
} else {
    echo "Error creating causes: " . $db->error . "\n";
}

if ($db->query($sqlImpact)) {
    echo "Table impacts created.\n";
} else {
    echo "Error creating impacts: " . $db->error . "\n";
}
$db->close();
