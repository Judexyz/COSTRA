# COSTRA (Cost Control & Helpdesk Management System)

COSTRA adalah aplikasi web *Enterprise-grade* yang dirancang secara komprehensif untuk menyederhanakan proses Manajemen Layanan TI (IT Service Management). Aplikasi ini mengintegrasikan Tiket Helpdesk, Manajemen Aset, Pelaporan Insiden, Permintaan Layanan (*Service Requests*), serta Pengarsipan Data Otomatis ke dalam satu platform yang kohesif.

Proyek ini dibangun dari nol menggunakan **Vanilla JavaScript (Frontend)** dan **PHP Murni (Backend REST API)**, menunjukkan pemahaman mendalam terhadap teknologi inti web, arsitektur perangkat lunak, dan desain API yang aman tanpa bergantung pada *framework frontend* yang berat.

---

## 🚀 Fitur Utama

*   **Autentikasi Stateless:** Sistem autentikasi berbasis JWT yang aman dengan Kontrol Akses Berbasis Peran (*Role-Based Access Control* / RBAC).
*   **Manajemen Inventaris & Aset TI:** Pelacakan aset perangkat keras/perangkat lunak, kategori, merek, dan nomor seri.
*   **Sistem Tiket Helpdesk:** Manajemen siklus penuh untuk tiket TI, insiden, dan permintaan layanan.
*   **Pengarsipan Data Otomatis:** Proses asinkron di latar belakang yang secara otomatis mengarsipkan tiket yang berumur lebih dari 6 bulan ke dalam file format JSON untuk mengoptimalkan performa *database*.
*   **Jejak Audit Komprehensif (*Audit Trail*):** Pencatatan seluruh sistem terhadap semua tindakan penting pengguna (CRUD) untuk kebutuhan kepatuhan dan pemantauan keamanan.
*   **UI Modern & Responsif:** Sistem desain CSS yang sepenuhnya *custom* dan termodularisasi, memastikan pengalaman pengguna yang mulus di berbagai perangkat.
*   **Ekspor Data:** Kemampuan untuk membuat dan mengekspor laporan (dalam format PDF/JSON).

---

## 🛠️ Teknologi yang Digunakan (*Tech Stack*)

*   **Frontend:** HTML5, Vanilla CSS3, Vanilla JavaScript (ES6+), FontAwesome, Chart.js, jsPDF.
*   **Backend:** Native PHP 8+, Arsitektur RESTful.
*   **Database:** MySQL (Relational Database Management System).
*   **Keamanan:** JSON Web Tokens (JWT), Bcrypt Password Hashing, Prepared Statements (Pencegahan SQL Injection).

---

## 📁 Arsitektur Sistem & Struktur Direktori

Aplikasi ini secara tegas memisahkan lapisan presentasi (*client-side*) dari logika bisnis (*server-side*).

### 1. Frontend (Client-Side)
Terletak di direktori `frontend/`. Struktur kode menggunakan pendekatan yang sangat termodularisasi, memisahkan manipulasi DOM, manajemen *state*, dan komunikasi API.

```text
frontend/
├── css/
│   ├── style.css             # Global style
│   ├── dashboard.css         # Analytic dashboard
│   ├── login.css             # Login Page Styling
│   └── pages.css             # Global UI
├── js/
│   ├── modules/              # Project Modules
│   │   ├── asset/
│   │   │     └── asset.js
│   │   ├── asset-brand/
│   │   │     └── asset-brand.js
│   │   ├── asset-category/
│   │   │     └── asset-category.js
│   │   ├── audit-log/
│   │   │     └── audit-log.js
│   │   ├── auth/
│   │   │     └── login.js
│   │   ├── backup/
│   │   │     └── backup.js
│   │   ├── cause/
│   │   │     └── cause.js
│   │   ├── client/
│   │   │     └── client.js
│   │   ├── dashboard/
│   │   │     └── dashboard.js
│   │   ├── impact/
│   │   │     └── impact.js
│   │   ├── incident/
│   │   │     └── incident.js
│   │   ├── maintenance/
│   │   │     └── maintenance.js
│   │   ├── reports/
│   │   │     └── reports.js
│   │   ├── service-request/
│   │   │     └── service-request.js
│   │   ├── ticket/
│   │   │     └── ticket.js
│   │   └── user/
│   │         └── users.js
│   ├── shared/               # Shared UI
│   │   ├── sidebar.js
│   │   ├── toast.js
│   │   └── topbar.js
│   └── utils/                # System Core
│       ├── serial.js
│       ├── storage.js
│       └── validator.js
├── pages/                    # HTML
│   ├── asset-brands.html
│   ├── asset-categories.html
│   ├── assets.html
│   ├── audit-log.html
│   ├── backups.html
│   ├── causes.html
│   ├── clients.html
│   ├── dashboard.html
│   ├── impacts.html
│   ├── incidents.html
│   ├── maintenance.html
│   ├── reports.html
│   ├── service-requests.html
│   ├── ticket.html
│   └── users.html
└── index.html                # Login Page
```

### 2. Backend (REST API)
Terletak di direktori `backend/`. Dirancang sebagai REST API yang *stateless*, secara ketat mengembalikan standar respons JSON dan kode status HTTP.

```text
backend/
├── api/
│   ├── auth/
│   │     └── login.php
│   ├── dashboard/
│   │     └── stats.php
│   ├── ticket/
│   │     ├── create.php
│   │     ├── get.php
│   │     ├── update.php
│   │     ├── update_status.php
│   │     └── delete.php
│   ├── incident/
│   │     ├── create.php
│   │     ├── get.php
│   │     ├── update.php
│   │     ├── update_status.php
│   │     └── delete.php
│   ├── service_request/
│   │     ├── create.php
│   │     ├── get.php
│   │     ├── update.php
│   │     ├── update_status.php
│   │     └── delete.php
│   ├── maintenance/
│   │     ├── create.php
│   │     ├── get.php
│   │     ├── update.php
│   │     ├── update_status.php
│   │     └── delete.php
│   ├── asset/
│   │     ├── create.php
│   │     ├── get.php
│   │     ├── update.php
│   │     └── delete.php
│   ├── asset-category/
│   │     ├── create.php
│   │     ├── get.php
│   │     ├── update.php
│   │     └── delete.php
│   ├── asset-brand/
│   │     ├── create.php
│   │     ├── get.php
│   │     ├── update.php
│   │     └── delete.php
│   ├── client/
│   │     ├── create.php
│   │     ├── get.php
│   │     ├── update.php
│   │     └── delete.php
│   ├── cause/
│   ├── impact/
│   ├── user/
│   ├── audit/
│   ├── backup/
│   │     ├── archive.php
│   │     ├── list.php
│   │     └── download.php
│   └── cleanup_all.php
├── config/
│   ├── db.php
│   └── env.php
├── middleware/
│   └── auth.php
├── utils/
│   ├── audit.php
│   ├── backup.php
│   └── jwt.php
└── uploads/
    ├── avatars/
    └── backups/
```
*   **Logika Pengarsipan (`backend/utils/backup.php`)**:
    *   Mengeksekusi kueri selektif untuk menemukan tiket yang berumur lebih dari 6 bulan.
    *   Menserialisasi kumpulan data tersebut ke dalam file JSON dengan format ketat di dalam `backend/uploads/backups/`.
    *   Mengeksekusi *Hard Delete* transaksional pada *database* SQL untuk mengosongkan kapasitas, diikuti dengan penulisan *event* ke dalam Catatan Audit (*Audit Log*).
