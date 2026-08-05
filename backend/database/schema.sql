CREATE DATABASE IF NOT EXISTS himawari_digi CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE himawari_digi;

#tabel roles
CREATE TABLE roles (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL
);

#tabel user
CREATE TABLE users (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(100) NOT NULL,
    email      VARCHAR(100) NOT NULL UNIQUE,
    password   VARCHAR(255) NOT NULL,
    role       ENUM('super_admin','admin','staff') DEFAULT 'staff',
    avatar     VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL
);

#asset categories
CREATE TABLE asset_categories (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    description TEXT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at  TIMESTAMP NULL DEFAULT NULL
);

#sub asset categories
CREATE TABLE sub_asset_categories (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,
    name        VARCHAR(100) NOT NULL,
    description TEXT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at  TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (category_id) REFERENCES asset_categories(id)
);

#asset brand
CREATE TABLE asset_brands (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(100) NOT NULL,
    logo       VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL
);

#clients
CREATE TABLE clients (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    email       VARCHAR(100) NULL,
    phone       VARCHAR(20)  NULL,
    address     TEXT NULL,
    description TEXT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at  TIMESTAMP NULL DEFAULT NULL
);

#assets
CREATE TABLE assets (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    asset_code      VARCHAR(50) NOT NULL UNIQUE,
    name            VARCHAR(150) NOT NULL,
    category_id     INT NULL,
    sub_category_id INT NULL,
    brand_id        INT NULL,
    client_id       INT NULL,
    purchase_date   DATE NULL,
    warranty_exp    DATE NULL,
    serial_number   VARCHAR(100) NULL,
    status          ENUM('active','damaged','maintenance') DEFAULT 'active',
    location        VARCHAR(150) NULL,
    photo           VARCHAR(255) NULL,
    description     TEXT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at      TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (category_id)     REFERENCES asset_categories(id),
    FOREIGN KEY (sub_category_id) REFERENCES sub_asset_categories(id),
    FOREIGN KEY (brand_id)        REFERENCES asset_brands(id),
    FOREIGN KEY (client_id)       REFERENCES clients(id)
);

#tickets
CREATE TABLE tickets (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    ticket_no   VARCHAR(50) NOT NULL UNIQUE,
    asset_id    INT NULL,
    client_id   INT NULL,
    user_id     INT NULL,
    priority    ENUM('low','medium','high','critical') DEFAULT 'medium',
    severity    ENUM('minor','major','critical') DEFAULT 'minor',
    status      ENUM('open','assigned','progress','pending','closed') DEFAULT 'open',
    description TEXT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at  TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (asset_id)  REFERENCES assets(id),
    FOREIGN KEY (client_id) REFERENCES clients(id),
    FOREIGN KEY (user_id)   REFERENCES users(id)
);

#maintenance
CREATE TABLE maintenance (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    asset_id    INT NULL,
    user_id     INT NULL,
    schedule    DATE NOT NULL,
    status      ENUM('scheduled','in_progress','done','cancelled') DEFAULT 'scheduled',
    notes       TEXT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at  TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (asset_id) REFERENCES assets(id),
    FOREIGN KEY (user_id)  REFERENCES users(id)
);

#audit_logs
CREATE TABLE audit_logs (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    user_id    INT NULL,
    action     VARCHAR(50) NOT NULL,
    module     VARCHAR(50) NOT NULL,
    detail     TEXT NULL,
    ip_address VARCHAR(50) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
