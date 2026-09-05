<?php
require 'd:/Project A/backend/config/db.php';
$db = getDB();
$res = $db->query("SELECT email, role FROM users WHERE email = 'client@demo.com'");
print_r($res->fetch_assoc());
