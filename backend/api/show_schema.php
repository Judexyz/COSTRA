<?php
require 'd:/Project A/backend/config/db.php';
$db = getDB();
$res = $db->query("SHOW CREATE TABLE users");
echo $res->fetch_row()[1];
