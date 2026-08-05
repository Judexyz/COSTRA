<?php
$incident_js = __DIR__ . '/../../frontend/js/modules/incident/ticket.js';
$incident_html = __DIR__ . '/../../frontend/pages/incident.html';

if (file_exists($incident_js)) {
    $c = file_get_contents($incident_js);
    $c = str_replace('TicketPage', 'IncidentPage', $c);
    $c = str_replace('loadTickets', 'loadIncidents', $c);
    $c = str_replace('saveTicket', 'saveIncident', $c);
    $c = str_replace('deleteTicket', 'deleteIncident', $c);
    $c = str_replace("ticket/get.php", "incident/get.php", $c);
    $c = str_replace("ticket/create.php", "incident/create.php", $c);
    $c = str_replace("ticket/update.php", "incident/update.php", $c);
    $c = str_replace("ticket/delete.php", "incident/delete.php", $c);
    $c = str_replace("ticket/update_status.php", "incident/update_status.php", $c);
    $c = str_replace('Laporan_Tiket.pdf', 'Laporan_Insiden.pdf', $c);
    $c = str_replace('Laporan Data Tiket', 'Laporan Data Insiden', $c);
    $c = str_replace('No. Tiket', 'No. Insiden', $c);
    $c = str_replace('ticket_no', 'incident_no', $c);
    $c = str_replace('Tambah Tiket', 'Tambah Insiden', $c);
    $c = str_replace('Edit Tiket', 'Edit Insiden', $c);
    $c = str_replace('Hapus Tiket', 'Hapus Insiden', $c);
    $c = str_replace('Menyimpan tiket', 'Menyimpan insiden', $c);
    file_put_contents(__DIR__ . '/../../frontend/js/modules/incident/incident.js', $c);
    unlink($incident_js);
}

if (file_exists($incident_html)) {
    $c = file_get_contents($incident_html);
    $c = str_replace('Tiket & Helpdesk', 'Manajemen Insiden', $c);
    $c = str_replace('Kelola laporan insiden dan permintaan layanan terkait asset', 'Kelola laporan insiden tak terduga (gangguan)', $c);
    $c = str_replace('Buat Tiket', 'Buat Insiden', $c);
    $c = str_replace('Tambah Tiket', 'Tambah Insiden', $c);
    $c = str_replace('Cari No Tiket', 'Cari No Insiden', $c);
    $c = str_replace('No Tiket', 'No Insiden', $c);
    $c = str_replace('ticket/ticket.js', 'incident/incident.js', $c);
    $c = str_replace('TicketPage', 'IncidentPage', $c);
    file_put_contents($incident_html, $c);
}

$sr_js = __DIR__ . '/../../frontend/js/modules/service-request/ticket.js';
$sr_html = __DIR__ . '/../../frontend/pages/service-request.html';

if (file_exists($sr_js)) {
    $c = file_get_contents($sr_js);
    $c = str_replace('TicketPage', 'ServiceRequestPage', $c);
    $c = str_replace('loadTickets', 'loadServiceRequests', $c);
    $c = str_replace('saveTicket', 'saveServiceRequest', $c);
    $c = str_replace('deleteTicket', 'deleteServiceRequest', $c);
    $c = str_replace("ticket/get.php", "service_request/get.php", $c);
    $c = str_replace("ticket/create.php", "service_request/create.php", $c);
    $c = str_replace("ticket/update.php", "service_request/update.php", $c);
    $c = str_replace("ticket/delete.php", "service_request/delete.php", $c);
    $c = str_replace("ticket/update_status.php", "service_request/update_status.php", $c);
    $c = str_replace('Laporan_Tiket.pdf', 'Laporan_Service_Request.pdf', $c);
    $c = str_replace('Laporan Data Tiket', 'Laporan Service Request', $c);
    $c = str_replace('No. Tiket', 'No. Request', $c);
    $c = str_replace('ticket_no', 'sr_no', $c);
    $c = str_replace('Tambah Tiket', 'Tambah Request', $c);
    $c = str_replace('Edit Tiket', 'Edit Request', $c);
    $c = str_replace('Hapus Tiket', 'Hapus Request', $c);
    $c = str_replace('Menyimpan tiket', 'Menyimpan request', $c);
    file_put_contents(__DIR__ . '/../../frontend/js/modules/service-request/service-request.js', $c);
    unlink($sr_js);
}

if (file_exists($sr_html)) {
    $c = file_get_contents($sr_html);
    $c = str_replace('Tiket & Helpdesk', 'Service Request', $c);
    $c = str_replace('Kelola laporan insiden dan permintaan layanan terkait asset', 'Kelola permintaan layanan rutin operasional', $c);
    $c = str_replace('Buat Tiket', 'Buat Request', $c);
    $c = str_replace('Tambah Tiket', 'Tambah Request', $c);
    $c = str_replace('Cari No Tiket', 'Cari No Request', $c);
    $c = str_replace('No Tiket', 'No Request', $c);
    $c = str_replace('ticket/ticket.js', 'service-request/service-request.js', $c);
    $c = str_replace('TicketPage', 'ServiceRequestPage', $c);
    file_put_contents($sr_html, $c);
}

echo "Renamed perfectly!";
