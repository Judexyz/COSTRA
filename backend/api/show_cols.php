<?php
require __DIR__ . '/../config/db.php';
$db = getDB();
$res = $db->query('SHOW COLUMNS FROM tickets');
while($row = $res->fetch_assoc()) {
    echo $row['Field'] . "\n";
}
