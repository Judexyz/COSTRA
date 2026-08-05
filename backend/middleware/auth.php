<?php
require_once __DIR__ . '/../config/env.php';

function authenticate() {
    $headers = getallheaders();
    $auth    = $headers['Authorization'] ?? '';

    if (!$auth || !str_starts_with($auth, 'Bearer ')) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'message' => 'Token tidak ditemukan'
        ]);
        exit();
    }

    $token   = substr($auth, 7);
    $decoded = verifyToken($token);

    if (!$decoded) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'message' => 'Token tidak valid atau sudah expired'
        ]);
        exit();
    }

    return $decoded;
}

function verifyToken($token) {
    try {
        $parts = explode('.', $token);
        if (count($parts) !== 3) return false;

        $payload   = json_decode(base64_decode($parts[1]), true);
        $signature = hash_hmac('sha256', $parts[0] . '.' . $parts[1], JWT_SECRET);

        if ($signature !== $parts[2]) return false;
        if ($payload['exp'] < time())  return false;

        return $payload;
    } catch (Exception $e) {
        return false;
    }
}

function generateToken($data) {
    $header  = base64_encode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
    $payload = base64_encode(json_encode([
        ...$data,
        'iat' => time(),
        'exp' => time() + (60 * 60 * 24)
    ]));
    $signature = hash_hmac('sha256', "$header.$payload", JWT_SECRET);

    return "$header.$payload.$signature";
}
