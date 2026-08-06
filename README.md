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
