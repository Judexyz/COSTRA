<?php
$ch = curl_init('http://localhost/Project%20A/backend/api/auth/login.php');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['email' => 'client@demo.com', 'password' => 'password123']));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
$res = curl_exec($ch);
$data = json_decode($res, true);
$token = $data['token'] ?? '';

if (!$token) {
    echo "Login failed: $res";
    exit;
}

$ch2 = curl_init('http://localhost/Project%20A/backend/api/ticket/get.php');
curl_setopt($ch2, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch2, CURLOPT_HTTPHEADER, ["Authorization: Bearer $token"]);
$res2 = curl_exec($ch2);
echo "RAW OUTPUT OF GET.PHP:\n";
echo $res2;
