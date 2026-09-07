<?php
/**
 * Environment configuration.
 *
 * On Railway, the MySQL connection details and JWT secret are injected as
 * environment variables (MYSQLHOST, MYSQLPORT, MYSQLUSER, MYSQLPASSWORD,
 * MYSQL_DATABASE, JWT_SECRET). When those are not present (e.g. local
 * development), sensible defaults are used instead.
 */

function env_var($name, $default = null) {
    $value = getenv($name);

    if ($value === false) {
        $value = isset($_ENV[$name]) ? $_ENV[$name] : (isset($_SERVER[$name]) ? $_SERVER[$name] : false);
    }

    return $value !== false && $value !== '' ? $value : $default;
}

define('DB_HOST', env_var('MYSQLHOST', 'localhost'));
define('DB_NAME', env_var('MYSQL_DATABASE', 'himawari_digi'));
define('DB_USER', env_var('MYSQLUSER', 'root'));
define('DB_PASS', env_var('MYSQLPASSWORD', ''));
define('DB_PORT', (int) env_var('MYSQLPORT', 3306));

define('JWT_SECRET', env_var('JWT_SECRET', 'himawari_secret_key_2026'));

$railwayDomain = env_var('RAILWAY_PUBLIC_DOMAIN', null);

if ($railwayDomain) {
    define('APP_URL', 'https://' . $railwayDomain);
} else {
    define('APP_URL', 'http://localhost/backend');
}
