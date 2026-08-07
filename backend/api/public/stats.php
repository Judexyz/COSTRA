<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

require_once __DIR__ . '/../../config/db.php';

try {
    $db = getDB();
    
    // Total Assets
    $res = $db->query("SELECT COUNT(id) as total FROM assets WHERE deleted_at IS NULL");
    $total_assets = $res->fetch_assoc()['total'];
    
    // Tickets Resolved
    $res = $db->query("SELECT COUNT(id) as total FROM tickets WHERE status = 'closed'");
    $tickets_resolved = $res->fetch_assoc()['total'];
    
    // Perlu Perhatian (Open Tickets yang belum dihapus)
    $res = $db->query("SELECT COUNT(id) as total FROM tickets WHERE status != 'closed' AND deleted_at IS NULL");
    $perlu_perhatian = $res->fetch_assoc()['total'];
    
    echo json_encode([
        'success' => true,
        'data' => [
            'total_assets' => (int)$total_assets,
            'tickets_resolved' => (int)$tickets_resolved,
            'perlu_perhatian' => (int)$perlu_perhatian
        ]
    ]);
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'data' => [
            'total_assets' => 0,
            'tickets_resolved' => 0,
            'perlu_perhatian' => 0
        ]
    ]);
}
