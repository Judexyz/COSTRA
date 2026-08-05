<?php
require_once __DIR__ . '/audit.php';

function runTicketArchiving($db, $triggeredByUserId = null) {
    $cutoff = date('Y-m-d H:i:s', strtotime('-6 months'));
    
    $stmt = $db->prepare("SELECT * FROM tickets WHERE created_at <= ?");
    $stmt->bind_param("s", $cutoff);
    $stmt->execute();
    $result = $stmt->get_result();
    $tickets = $result->fetch_all(MYSQLI_ASSOC);
    
    if (count($tickets) === 0) {
        return ['success' => true, 'message' => 'Tidak ada tiket yang perlu diarsipkan.'];
    }
    $backupDir = __DIR__ . '/../uploads/backups';
    if (!is_dir($backupDir)) {
        mkdir($backupDir, 0777, true);
    }
    
    $filename = 'tickets_archive_' . date('Ymd_His') . '.json';
    $filepath = $backupDir . '/' . $filename;
    $jsonContent = json_encode([
        'archived_at' => date('Y-m-d H:i:s'),
        'total_records' => count($tickets),
        'data' => $tickets
    ], JSON_PRETTY_PRINT);
    
    if (file_put_contents($filepath, $jsonContent)) {
        $delStmt = $db->prepare("DELETE FROM tickets WHERE created_at <= ?");
        $delStmt->bind_param("s", $cutoff);
        if ($delStmt->execute()) {
            $user_id = $triggeredByUserId ?: null;
            logAudit($db, $user_id, 'ARCHIVE', 'SYSTEM', count($tickets) . ' tiket lama (>6 bulan) telah diarsipkan ke ' . $filename . ' dan dihapus permanen.');
            return ['success' => true, 'message' => count($tickets) . ' tiket berhasil diarsipkan.'];
        } else {
            return ['success' => false, 'message' => 'Gagal menghapus tiket dari database setelah backup.'];
        }
    } else {
        return ['success' => false, 'message' => 'Gagal menulis file backup.'];
    }
}
