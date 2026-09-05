<?php
require 'd:/Project A/backend/config/db.php';
$db = getDB();
$res = $db->query('SHOW COLUMNS FROM tickets');
while($row = $res->fetch_assoc()) {
    echo $row['Field'] . "\n";
}
