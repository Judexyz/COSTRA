<?php
require 'd:/Project A/backend/config/db.php';
$db = getDB();
$db->query("ALTER TABLE users MODIFY COLUMN role ENUM('super_admin','admin','staff','client') DEFAULT 'staff'");
$db->query("UPDATE users SET role = 'client' WHERE email = 'client@demo.com'");
echo "Role fixed.";
