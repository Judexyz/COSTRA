<?php
function logAudit($db, $user_id, $action, $module, $detail) {
    $ip_address = $_SERVER['REMOTE_ADDR'] ?? null;
    
    if (isset($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        $ip_address = $_SERVER['HTTP_X_FORWARDED_FOR'];
    }

    $stmt = $db->prepare('INSERT INTO audit_logs (user_id, action, module, detail, ip_address) VALUES (?, ?, ?, ?, ?)');
    if ($stmt) {
        $stmt->bind_param('issss', $user_id, $action, $module, $detail, $ip_address);
        $stmt->execute();
        $stmt->close();
    }
}
