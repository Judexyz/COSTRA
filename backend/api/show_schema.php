<?php
require __DIR__ . '/../config/db.php';
$db = getDB();
$res = $db->query("SHOW CREATE TABLE users");
echo $res->fetch_row()[1];
