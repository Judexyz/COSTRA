#seeder awal
USE railway;
#roles
INSERT INTO roles (name) VALUES
('super_admin'),
('admin'),
('staff'),
('hr');

#users
INSERT INTO users (name, email, password, role) VALUES
(
    'Super Admin',
    'superadmin@himawaridigi.com',
    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'super_admin'
),
(
    'Admin',
    'admin@himawaridigi.com',
    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'admin'
),
(
    'Staff',
    'staff@himawaridigi.com',
    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'staff'
),
(
    'HR',
    'hr@himawaridigi.com',
    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'hr'
),
(
    'Jude',
    'jude@himawaridigi.com',
    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'staff'
),
(
    'Yashir',
    'yashir@himawaridigi.com',
    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'staff'
),
(
    'Jimbo',
    'jimbo@himawaridigi.com',
    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'staff'
);
#password all account:admin123

#sample asset ctgr
INSERT INTO asset_categories (name, description) VALUES
('Hardware', 'Perangkat keras komputer dan elektronik'),
('Software', 'Lisensi dan aplikasi'),
('Networking', 'Perangkat jaringan');

#sample asset brand
INSERT INTO asset_brands (name) VALUES
('Dell'),
('HP'),
('Lenovo'),
('Cisco'),
('Apple');

#sample client
INSERT INTO clients (name, email, phone, address) VALUES
('PT Himawari Digi', 'info@himawaridigi.com', '021-12345678', 'Jakarta Selatan'),
('PT Maju Bersama', 'info@majubersama.com', '021-87654321', 'Jakarta Pusat');

#sample causes
INSERT INTO causes (name, description) VALUES
('Human Error', 'Kesalahan yang disebabkan oleh kelalaian pengguna'),
('Hardware Failure', 'Kerusakan pada perangkat keras'),
('Software Bug', 'Kesalahan pada program atau aplikasi'),
('Power Outage', 'Pemadaman listrik yang menyebabkan gangguan sistem');

#sample impacts
INSERT INTO impacts (name, description) VALUES
('Low', 'Dampak kecil, tidak mengganggu operasional'),
('Medium', 'Dampak sedang, mengganggu sebagian operasional'),
('High', 'Dampak besar, menghentikan operasional utama'),
('Critical', 'Dampak kritis, menyebabkan kerugian signifikan');
