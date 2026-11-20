import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx_manual_builder import (
    create_base_document,
    add_heading_1,
    add_heading_2,
    add_heading_3,
    add_paragraph,
    add_bullet,
    add_step,
    add_callout,
    add_styled_table,
    add_menu_path,
    add_code_block
)

def build_tech_04_devops():
    output_path = os.path.join("docs", "technical", "04-panduan-deployment-devops.docx")
    
    doc = create_base_document(
        book_series_title="BUKU TEKNIS 4: PANDUAN DEPLOYMENT, INFRASTRUKTUR SERVER & OPERASIONAL DEVOPS",
        book_subtitle="Panduan Resmi Rekayasa Infrastruktur, Instalasi Server Linux (Ubuntu/Debian), Reverse Proxy Nginx & SSL Let's Encrypt, Process Manager PM2, Containerization Docker, CI/CD Pipeline, Manajemen Secrets (.env), Otomasi Backup Basis Data, Serta Prosedur Pemulihan Bencana (Disaster Recovery).",
        doc_id="DOC-SIMS-TECH-04-DEVOPS",
        target_roles="DevOps Engineers, System Administrators, Cloud Architects, Site Reliability Engineers (SRE), IT Infrastructure Lead",
        version="1.0",
        doc_category="Dokumen Teknis"
    )
    
    # ==================== DAFTAR ISI / RINGKASAN ====================
    add_heading_1(doc, "RINGKASAN EKSEKUTIF & DAFTAR ISI DOKUMEN TEKNIS", page_break=False)
    add_paragraph(
        doc,
        "Dokumen Teknis Buku 4 ini menyajikan panduan rekayasa infrastruktur, prosedur deployment produksi, serta tata kelola operasional DevOps komprehensif bagi Sistem Informasi Manajemen Sekolah Terpadu (SIMS) v1.0. Dokumen ini dirancang sebagai manual operasional standar (Standard Operating Procedure / SOP) bagi administrator sistem (SysAdmin), insinyur DevOps, dan pimpinan infrastruktur teknologi informasi dalam mempersiapkan lingkungan server Linux yang aman dan tangguh, melakukan otomatisasi deployment dengan downtime nol (Zero-Downtime Deployment), mengonfigurasi gerbang proksi Nginx dengan enkripsi SSL/TLS, menyusun strategi backup basis data PostgreSQL berlapis, serta menjalankan rencana pemulihan bencana (Disaster Recovery Plan) saat terjadi gangguan perangkat keras atau data."
    )
    
    toc_data = [
        ("BAB 1", "Kebutuhan Sistem & Spesifikasi Perangkat Keras/Lunak", "Kapasitas hardware skala kecil/menengah/besar, dependensi Linux, Node.js, dan PostgreSQL"),
        ("BAB 2", "Konfigurasi Lingkungan & Manajemen Rahasia (.env Secrets)", "Daftar variabel lingkungan kritis, format connection string, chmod 600, dan rotasi secret"),
        ("BAB 3", "Panduan Instalasi & Deployment Produksi (Bare Metal / VPS)", "OS hardening, firewall UFW, instalasi stack, kloning git, npm ci, dan build Next.js"),
        ("BAB 4", "Manajemen Proses Produksi dengan PM2 & Clustering", "Zero-downtime clustering, file ecosystem.config.js, monitoring memori, dan auto-restart"),
        ("BAB 5", "Konfigurasi Web Server Nginx & Enkripsi SSL/TLS HTTPS", "Arsitektur reverse proxy, virtual host Nginx, SSL Let's Encrypt Certbot, dan upload 25M"),
        ("BAB 6", "Alternatif Deployment Berbasis Docker & Containerization", "Multi-stage Dockerfile Next.js standalone, docker-compose.yml multi-service, dan volume"),
        ("BAB 7", "Alur Otomasi CI/CD & Pembaruan Sistem Tanpa Henti", "Pipeline GitHub Actions, pengujian otomatis tsc/lint, dan skrip bash deploy.sh otomatis"),
        ("BAB 8", "Strategi Backup, Monitoring & Pemulihan Bencana (Disaster Recovery)", "Otomasi cron backup pg_dump, off-site cloud storage, RPO/RTO, logrotate, dan troubleshooting"),
    ]
    add_styled_table(
        doc,
        headers=["Bab", "Topik Pembahasan Teknis", "Cakupan Spesifikasi DevOps & Infrastruktur"],
        rows=toc_data,
        col_widths=[Inches(0.9), Inches(2.6), Inches(2.6)]
    )
    
    add_callout(
        doc,
        "IMPORTANT",
        "Kepatuhan Keamanan Infrastruktur Produksi",
        "Dilarang keras menjalankan aplikasi web produksi menggunakan server pengembangan bawaan ('npm run dev'). Seluruh instalasi produksi WAJIB melalui proses kompilasi ('npm run build'), dikelola di latar belakang oleh process manager (PM2 atau Docker), diproksi melalui Nginx dengan proteksi SSL/TLS HTTPS aktif, dan dilarang mengekspos port basis data PostgreSQL (5432) langsung ke jaringan publik Internet."
    )
    
    # ==================== BAB 1 ====================
    add_heading_1(doc, "BAB 1: KEBUTUHAN SISTEM & SPESIFIKASI PERANGKAT KERAS/LUNAK")
    
    add_heading_2(doc, "1.1 Profil Skalabilitas & Rekomendasi Perangkat Keras (Hardware Requirements)")
    add_paragraph(
        doc,
        "Kebutuhan spesifikasi server SIMS dirancang adaptif berdasarkan jumlah populasi peserta didik dan volume transaksi harian sekolah. Berikut adalah panduan ukuran kapasitas (*sizing matrix*) server yang direkomendasikan:"
    )
    
    hw_matrix = [
        ("Skala Kecil (< 500 Siswa)", "1 Unit Sekolah Mandiri (Single-Jenjang SD/SMP)", "2 vCPU Core, 4 GB RAM, 40 GB NVMe/SSD Storage, Bandwidth 100 Mbps simetris."),
        ("Skala Menengah (500 - 2.000 Siswa)", "Sekolah Menengah Kejuruan (SMK) / SMA Besar", "4 vCPU Core, 8 GB RAM, 100 GB NVMe Storage, Bandwidth 250 Mbps simetris."),
        ("Skala Besar (> 2.000 Siswa / Yayasan)", "Yayasan Terpadu Multi-Jenjang (SD, SMP, SMA, SMK)", "8 vCPU Core, 16 - 32 GB RAM, 250+ GB NVMe Storage (opsional: node database terpisah)."),
    ]
    add_styled_table(
        doc,
        headers=["Klasifikasi Skala Lembaga", "Karakteristik Operasional", "Spesifikasi Minimum Server (Bare Metal / VPS)"],
        rows=hw_matrix,
        col_widths=[Inches(1.8), Inches(2.1), Inches(2.2)]
    )
    
    add_heading_2(doc, "1.2 Kebutuhan Perangkat Lunak & Dependensi Sistem (Software Dependencies)")
    add_paragraph(
        doc,
        "Lingkungan produksi mewajibkan komponen sistem operasi dan perangkat lunak pendukung dalam versi rilis jangka panjang (*Long-Term Support / LTS*):"
    )
    add_bullet(doc, "Sistem operasi server berbasis Linux 64-bit yang stabil dan aman (Ubuntu Server 22.04 LTS / 24.04 LTS atau Debian 12 Bookworm).", "• Sistem Operasi: ")
    add_bullet(doc, "Node.js versi 20.x LTS (Iron) atau 22.x LTS (Jod) beserta Node Package Manager (npm v10+).", "• JavaScript Runtime: ")
    add_bullet(doc, "PostgreSQL versi 15 atau 16 dengan ekstensi standar citext dan pg_trgm untuk pencarian cepat.", "• Mesin Basis Data: ")
    add_bullet(doc, "Nginx versi 1.22+ sebagai HTTP/HTTPS Reverse Proxy, SSL Terminator, dan penangan kompresi konten.", "• Web Server & Proksi: ")
    add_bullet(doc, "PM2 versi 5.3+ untuk pengelolaan proses Node.js produksi di latar belakang dan clustering multi-core.", "• Process Manager: ")
    add_bullet(doc, "Git (v2.34+), OpenSSL (v3.0+), UFW Firewall, Fail2ban, dan Certbot Let's Encrypt.", "• Utilitas Pendukung: ")

    # ==================== BAB 2 ====================
    add_heading_1(doc, "BAB 2: KONFIGURASI LINGKUNGAN & MANAJEMEN RAHASIA (.ENV SECRETS)")
    
    add_heading_2(doc, "2.1 Struktur Berkas Variabel Lingkungan (.env)")
    add_paragraph(
        doc,
        "Seluruh kredensial sensitif, string koneksi basis data, dan kunci enkripsi disimpan di luar kode sumber aplikasi menggunakan berkas `.env` yang dibaca secara otomatis saat runtime Next.js:"
    )
    
    add_code_block(doc, """# ========================================================
# KONFIGURASI LINGKUNGAN PRODUKSI SIMS v1.0 (.env)
# ========================================================

# 1. Konfigurasi Lingkungan Runtime
NODE_ENV="production"
PORT=3000

# 2. Koneksi Basis Data Relasional PostgreSQL
# Format: postgresql://[user]:[password]@[host]:[port]/[database]?schema=public
DATABASE_URL="postgresql://sims_user:KatakunciRahasia123!@localhost:5432/db_manajemen_sekolah?schema=public&connection_limit=20&pool_timeout=10"

# 3. Kunci Enkripsi Sesi Autentikasi (NextAuth JWT)
# Dihasilkan via perintah: openssl rand -base64 32
NEXTAUTH_SECRET="k2hJ9xL7vPq1wZ4yR8tM3nB6vC0xD5eF9gH2jK4mN7pQ1rT3vW6yZ8bC0dE2fG4h"
NEXTAUTH_URL="https://sekolah.sch.id"

# 4. Batasan & Keamanan
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION_MINUTES=15
UPLOAD_MAX_FILE_SIZE_MB=10""")

    add_heading_2(doc, "2.2 Prinsip Keamanan & Pengamanan Berkas Rahasia (Secrets Management)")
    add_paragraph(
        doc,
        "Administrator sistem wajib menegakkan aturan keamanan ketat terkait kepemilikan dan hak akses berkas rahasia di lingkungan server:"
    )
    add_bullet(doc, "Berkas .env tidak boleh dikomit atau disertakan dalam riwayat repositori Git. Pastikan baris '.env' dan '.env.*' terdaftar di dalam berkas .gitignore.", "• Isolasi Repositori Git: ")
    add_bullet(doc, "Kunci hak akses berkas .env pada server Linux menggunakan perintah 'chmod 600 .env' dan pastikan dimiliki secara eksklusif oleh akun non-root yang menjalankan aplikasi.", "• Izin Berkas Terbatas (chmod 600): ")
    add_bullet(doc, "Nilai NEXTAUTH_SECRET wajib berupa string acak dengan entropi tinggi minimal 256-bit (32 karakter acak base64). Dilarang keras menggunakan kata sandi bawaan atau contoh dokumentasi.", "• Entropi Kunci JWT: ")
    add_bullet(doc, "Lakukan rotasi kunci secret dan kata sandi basis data minimal setiap 6 bulan sekali atau sesegera mungkin saat terjadi pergantian personel administrator IT.", "• Jadwal Rotasi Rutin: ")

    # ==================== BAB 3 ====================
    add_heading_1(doc, "BAB 3: PANDUAN INSTALASI & DEPLOYMENT PRODUKSI (BARE METAL / VPS)")
    
    add_heading_2(doc, "3.1 Persiapan Sistem Operasi & Pengerasan Server (OS Hardening)")
    add_paragraph(
        doc,
        "Ikuti langkah-langkah penyiapan awal server Linux baru untuk memastikan lingkungan aman sebelum memasang stack aplikasi:"
    )
    add_step(doc, 1, "Pembaruan Paket Sistem Operasi", "Jalankan pembaruan repositori dan paket kernel Linux terbaru:", [
        "sudo apt update && sudo apt upgrade -y",
        "sudo apt install -y curl wget git ufw fail2ban unzip build-essential software-properties-common"
    ])
    add_step(doc, 2, "Pembuatan Akun Administrator Non-Root", "Buat pengguna khusus untuk menjalankan aplikasi (misal: 'deployer') dengan hak akses sudo terbatas:", [
        "sudo adduser deployer",
        "sudo usermod -aG sudo deployer",
        "su - deployer"
    ])
    add_step(doc, 3, "Konfigurasi Firewall UFW", "Batasi port akses server hanya untuk protokol yang sah (SSH, HTTP, HTTPS):", [
        "sudo ufw default deny incoming",
        "sudo ufw default allow outgoing",
        "sudo ufw allow OpenSSH",
        "sudo ufw allow 'Nginx Full'",
        "sudo ufw enable"
    ])

    add_heading_2(doc, "3.2 Instalasi Stack Runtime (Node.js LTS & PostgreSQL 16)")
    add_paragraph(
        doc,
        "Pasang Node.js LTS melalui repositori resmi NodeSource dan basis data PostgreSQL melalui repositori resmi PostgreSQL Global Development Group (PGDG):"
    )
    add_step(doc, 4, "Instalasi Node.js 20 LTS", "Tambahkan repositori NodeSource dan pasang paket runtime:", [
        "curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -",
        "sudo apt install -y nodejs",
        "node -v && npm -v"
    ])
    add_step(doc, 5, "Instalasi & Setup Basis Data PostgreSQL", "Pasang PostgreSQL, buat basis data baru, serta akun pengguna dengan hak akses penuh ke skema:", [
        "sudo apt install -y postgresql postgresql-contrib",
        "sudo -u postgres psql -c \"CREATE DATABASE db_manajemen_sekolah;\"",
        "sudo -u postgres psql -c \"CREATE USER sims_user WITH ENCRYPTED PASSWORD 'KatakunciRahasia123!';\"",
        "sudo -u postgres psql -c \"GRANT ALL PRIVILEGES ON DATABASE db_manajemen_sekolah TO sims_user;\"",
        "sudo -u postgres psql -c \"ALTER DATABASE db_manajemen_sekolah OWNER TO sims_user;\""
    ])

    add_heading_2(doc, "3.3 Kloning Repositori, Dependensi & Proses Kompilasi Next.js")
    add_paragraph(
        doc,
        "Unduh kode sumber aplikasi, pasang dependensi paket, sinkronkan skema database Prisma, dan bangun bundle produksi:"
    )
    add_step(doc, 6, "Kloning Repositori & Pasang Dependensi", "Kloning kode sumber ke direktori aplikasi /var/www/sims:", [
        "sudo mkdir -p /var/www/sims && sudo chown -R deployer:deployer /var/www/sims",
        "git clone https://github.com/organisasi-sekolah/sistem_manajemen_sekolah.git /var/www/sims",
        "cd /var/www/sims",
        "npm ci --prefer-offline --no-audit"
    ])
    add_step(doc, 7, "Konfigurasi Berkas .env & Migrasi Skema Basis Data", "Salin template lingkungan dan sinkronkan skema Prisma ORM:", [
        "cp .env.example .env",
        "nano .env  # Sesuaikan DATABASE_URL dan NEXTAUTH_SECRET",
        "chmod 600 .env",
        "npx prisma db push --accept-data-loss",
        "npx prisma generate"
    ])
    add_step(doc, 8, "Kompilasi Bundle Produksi (Build)", "Jalankan kompilasi Next.js produksi yang dioptimalkan:", [
        "npm run build"
    ])

    # ==================== BAB 4 ====================
    add_heading_1(doc, "BAB 4: MANAJEMEN PROSES PRODUKSI DENGAN PM2 & CLUSTERING")
    
    add_heading_2(doc, "4.1 Arsitektur Process Manager PM2")
    add_paragraph(
        doc,
        "PM2 bertindak sebagai manajer proses tingkat enterprise yang menjaga agar aplikasi SIMS terus berjalan di latar belakang (daemon). Jika terjadi pengecualian tak terduga (*unhandled exception*) atau kebocoran memori, PM2 akan secara otomatis me-restart worker thread dalam hitungan milidetik tanpa memutus koneksi pengguna yang sedang aktif."
    )

    add_heading_2(doc, "4.2 Berkas Konfigurasi Ekosistem (ecosystem.config.js)")
    add_paragraph(
        doc,
        "Simpan berkas konfigurasi `ecosystem.config.js` di direktori akar proyek `/var/www/sims` untuk mengatur perilaku runtime, batasan memori, dan mode clustering CPU:"
    )
    add_code_block(doc, """// Berkas Konfigurasi PM2 Produksi (ecosystem.config.js)
module.exports = {
  apps: [
    {
      name: "sims-production",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      cwd: "/var/www/sims",
      instances: "max",             // Otomatis membuat worker sejumlah core vCPU server
      exec_mode: "cluster",          // Mode clustering multi-core untuk konkurensi tinggi
      watch: false,                 // Jangan pantau file di mode produksi
      max_memory_restart: "1024M",   // Restart otomatis jika satu worker melebihi 1 GB RAM
      env_production: {
        NODE_ENV: "production",
        PORT: 3000
      },
      error_file: "/var/log/pm2/sims-error.log",
      out_file: "/var/log/pm2/sims-out.log",
      merge_logs: true,
      time: true
    }
  ]
};""")

    add_heading_2(doc, "4.3 Perintah Operasional & Otomasi Booting Server (Auto-Startup)")
    add_paragraph(
        doc,
        "Jalankan aplikasi melalui PM2 dan daftarkan ke dalam systemd service agar aplikasi menyala otomatis setiap kali server dinyalakan ulang (reboot):"
    )
    pm2_commands = [
        ("npm install -g pm2", "Memasang utilitas PM2 secara global di sistem Linux."),
        ("pm2 start ecosystem.config.js --env production", "Menyalakan aplikasi SIMS mengacu pada konfigurasi klaster produksi."),
        ("pm2 status", "Melihat kondisi kesehatan seluruh worker thread (CPU, RAM, Uptime)."),
        ("pm2 logs sims-production --lines 50", "Memonitor keluaran log konsol dan error secara real-time."),
        ("pm2 reload sims-production", "Me-reload seluruh worker tanpa downtime sesaat setelah pembaruan kode baru."),
        ("pm2 startup systemd", "Menghasilkan perintah konfigurasi init service systemd Linux otomatis."),
        ("pm2 save", "Menyimpan snapshot proses PM2 aktif ke dalam konfigurasi boot permanen."),
    ]
    add_styled_table(
        doc,
        headers=["Perintah Operasional PM2", "Tujuan & Efek Perintah"],
        rows=pm2_commands,
        col_widths=[Inches(2.5), Inches(3.6)]
    )

    # ==================== BAB 5 ====================
    add_heading_1(doc, "BAB 5: KONFIGURASI WEB SERVER NGINX & ENKRIPSI SSL/TLS HTTPS")
    
    add_heading_2(doc, "5.1 Arsitektur Reverse Proxy Nginx")
    add_paragraph(
        doc,
        "Nginx ditempatkan pada garis terdepan arsitektur sebagai proksi terbalik (*reverse proxy*). Nginx bertugas menerima seluruh koneksi eksternal pada port standar 80 (HTTP) dan 443 (HTTPS), melakukan terminasi sertifikat SSL/TLS, menyaring request berbahaya, mengompresi aset statis dengan Gzip, dan meneruskan lalu lintas request dinamis ke aplikasi Next.js lokal pada port 3000."
    )

    add_heading_2(doc, "5.2 Konfigurasi Virtual Host Nginx (/etc/nginx/sites-available/sims)")
    add_paragraph(
        doc,
        "Buat berkas konfigurasi blok server Nginx pada `/etc/nginx/sites-available/sims`:"
    )
    add_code_block(doc, """# Konfigurasi Virtual Host Nginx Produksi (/etc/nginx/sites-available/sims)

# 1. Redirect HTTP ke HTTPS Otomatis
server {
    listen 80;
    listen [::]:80;
    server_name sekolah.sch.id www.sekolah.sch.id;
    return 301 https://$host$request_uri;
}

# 2. Blok Server HTTPS Utama
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name sekolah.sch.id www.sekolah.sch.id;

    # SSL Certificate (Dikelola Otomatis oleh Certbot)
    ssl_certificate /etc/letsencrypt/live/sekolah.sch.id/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/sekolah.sch.id/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Batas Maksimum Ukuran Unggah Berkas (Foto, Sampul Buku, Berkas PPDB)
    client_max_body_size 25M;

    # Static Cache Optimization (_next/static)
    location /_next/static {
        alias /var/www/sims/.next/static;
        expires 365d;
        access_log off;
    }

    # Public Uploaded Assets
    location /uploads {
        alias /var/www/sims/public/uploads;
        expires 30d;
        access_log off;
    }

    # Reverse Proxy ke Node.js App (Next.js Port 3000)
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
        proxy_connect_timeout 60s;
    }
}""")

    add_heading_2(doc, "5.3 Penerbitan & Pembaruan Otomatis Sertifikat SSL Let's Encrypt")
    add_paragraph(
        doc,
        "Aktifkan situs Nginx dan terbitkan sertifikat keamanan SSL/TLS resmi gratis menggunakan Certbot:"
    )
    add_step(doc, 1, "Aktivasi Konfigurasi Situs Nginx", "Tautkan konfigurasi ke sites-enabled dan uji sintaksis:", [
        "sudo ln -s /etc/nginx/sites-available/sims /etc/nginx/sites-enabled/",
        "sudo nginx -t",
        "sudo systemctl reload nginx"
    ])
    add_step(doc, 2, "Penerbitan Sertifikat SSL via Certbot", "Jalankan Certbot untuk memverifikasi domain dan memasang sertifikat secara otomatis:", [
        "sudo apt install -y certbot python3-certbot-nginx",
        "sudo certbot --nginx -d sekolah.sch.id -d www.sekolah.sch.id"
    ])
    add_step(doc, 3, "Uji Coba Pembaruan Otomatis (Renewal Dry-Run)", "Pastikan timer pembaruan otomatis berjalan lancar sebelum masa berlaku 90 hari habis:", [
        "sudo certbot renew --dry-run"
    ])

    # ==================== BAB 6 ====================
    add_heading_1(doc, "BAB 6: ALTERNATIF DEPLOYMENT BERBASIS DOCKER & CONTAINERIZATION")
    
    add_heading_2(doc, "6.1 Multi-Stage Dockerfile (Next.js Standalone Mode)")
    add_paragraph(
        doc,
        "Bagi institusi yang menerapkan arsitektur kontainerisasi (Containerized Microservices atau Kubernetes), SIMS mendukung kompilasi multi-stage build yang menghasilkan image kontainer ultra-ringan (<150 MB) menggunakan fitur Standalone Output bawaan Next.js:"
    )
    add_code_block(doc, """# Multi-Stage Dockerfile Produksi
FROM node:20-alpine AS base

# 1. Install Dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# 2. Builder Image
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production
RUN npx prisma generate
RUN npm run build

# 3. Production Runner
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]""")

    add_heading_2(doc, "6.2 Orkestrasi Multi-Kontainer (docker-compose.yml)")
    add_paragraph(
        doc,
        "Gunakan berkas `docker-compose.yml` untuk menjalankan layanan aplikasi, basis data PostgreSQL, dan volume persistensi secara terpadu:"
    )
    add_code_block(doc, """version: '3.8'

services:
  app:
    build: .
    restart: always
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://sims_user:KatakunciRahasia123!@db:5432/db_manajemen_sekolah?schema=public
      - NEXTAUTH_SECRET=k2hJ9xL7vPq1wZ4yR8tM3nB6vC0xD5eF9gH2jK4mN7pQ1rT3vW6yZ8bC0dE2fG4h
      - NEXTAUTH_URL=https://sekolah.sch.id
    depends_on:
      - db
    volumes:
      - uploads_data:/app/public/uploads

  db:
    image: postgres:16-alpine
    restart: always
    environment:
      POSTGRES_USER: sims_user
      POSTGRES_PASSWORD: KatakunciRahasia123!
      POSTGRES_DB: db_manajemen_sekolah
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
  uploads_data:""")

    # ==================== BAB 7 ====================
    add_heading_1(doc, "BAB 7: ALUR OTOMASI CI/CD & PEMBARUAN SISTEM TANPA HENTI")
    
    add_heading_2(doc, "7.1 Pipeline CI/CD Berbasis GitHub Actions")
    add_paragraph(
        doc,
        "Untuk mencegah kesalahan koding (*bug regressions*) masuk ke lingkungan produksi, pipeline Continuous Integration / Continuous Deployment (CI/CD) dikonfigurasi melalui GitHub Actions pada berkas `.github/workflows/deploy.yml`:"
    )
    add_code_block(doc, """name: SIMS Production CI/CD Pipeline

on:
  push:
    branches: [ "main" ]

jobs:
  test-and-verify:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Kode
        uses: actions/checkout@v4

      - name: Setup Node.js 20 LTS
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install Dependensi
        run: npm ci

      - name: Validasi Tipe Data (Type-Check)
        run: npx tsc --noEmit

  deploy-to-server:
    needs: test-and-verify
    runs-on: ubuntu-latest
    steps:
      - name: Eksekusi Remote SSH Deployment
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /var/www/sims
            ./scripts/deploy.sh""")

    add_heading_2(doc, "7.2 Skrip Deployment Mandiri (scripts/deploy.sh)")
    add_paragraph(
        doc,
        "Pembaruan kode di server produksi dieksekusi secara otomatis oleh skrip bash `deploy.sh` yang menerapkan strategi pembaruan aman:"
    )
    add_code_block(doc, """#!/bin/bash
# ========================================================
# Skrip Otomasi Deployment Produksi SIMS (scripts/deploy.sh)
# ========================================================
set -e

echo "🚀 Memulai proses deployment produksi SIMS..."
cd /var/www/sims

# 1. Tarik pembaruan kode terbaru dari remote git
git fetch origin main
git reset --hard origin/main

# 2. Pasang dependensi yang sesuai dengan package-lock.json
npm ci --prefer-offline --no-audit

# 3. Sinkronkan pembaruan skema database Prisma
npx prisma db push --accept-data-loss
npx prisma generate

# 4. Kompilasi bundle produksi Next.js
npm run build

# 5. Reload proses PM2 tanpa memutus koneksi pengguna
pm2 reload ecosystem.config.js --env production

echo "✅ Deployment produksi berhasil diselesaikan dengan sukses!"
""")

    # ==================== BAB 8 ====================
    add_heading_1(doc, "BAB 8: STRATEGI BACKUP, MONITORING & PEMULIHAN BENCANA (DISASTER RECOVERY)")
    
    add_heading_2(doc, "8.1 Otomasi Backup Basis Data PostgreSQL (Cron Job)")
    add_paragraph(
        doc,
        "Basis data adalah aset informasi paling berharga bagi sekolah. Sistem menerapkan kebijakan backup otomatis harian menggunakan perintah `pg_dump` dengan kompresi gzip yang dijadwalkan setiap pukul 02:00 dini hari melalui Linux crontab:"
    )
    add_code_block(doc, """#!/bin/bash
# ========================================================
# Skrip Backup Otomatis Database PostgreSQL (/backup/backup-sims.sh)
# ========================================================
BACKUP_DIR="/backup/postgres"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILENAME="sims_backup_${TIMESTAMP}.sql.gz"

mkdir -p $BACKUP_DIR

# Eksekusi pg_dump dengan kompresi gzip
pg_dump -U sims_user -h localhost db_manajemen_sekolah | gzip > "${BACKUP_DIR}/${FILENAME}"

# Hapus cadangan data yang berumur lebih dari 30 hari untuk menghemat ruang disk
find $BACKUP_DIR -type f -name "sims_backup_*.sql.gz" -mtime +30 -delete

echo "✅ Backup database berhasil disimpan di: ${BACKUP_DIR}/${FILENAME}"
""")

    add_paragraph(
        doc,
        "Daftarkan skrip tersebut pada crontab pengguna sistem: `0 2 * * * /backup/backup-sims.sh >> /var/log/sims-backup.log 2>&1`."
    )

    add_heading_2(doc, "8.2 Prosedur Pemulihan Bencana (Disaster Recovery SOP)")
    add_paragraph(
        doc,
        "Jika terjadi kerusakan parah pada storage server (*hardware failure*) atau kehilangan data akibat kelalaian operasional, ikuti prosedur pemulihan bencana resmi berikut:"
    )
    add_step(doc, 1, "Identifikasi & Verifikasi Berkas Backup Terakhir", "Pilih berkas cadangan database terakhir yang valid dan tidak korup:", [
        "ls -lh /backup/postgres/",
        "gunzip -t /backup/postgres/sims_backup_20261118_020000.sql.gz  # Uji integritas arsip gzip"
    ])
    add_step(doc, 2, "Hentikan Sementara Proses Aplikasi", "Cegah terjadinya transaksi parsial saat proses pemulihan basis data berlangsung:", [
        "pm2 stop sims-production"
    ])
    add_step(doc, 3, "Pemulihan Skema & Data Basis Data (Restore)", "Drop database yang bermasalah dan pulihkan dari arsip SQL cadangan:", [
        "sudo -u postgres dropdb db_manajemen_sekolah",
        "sudo -u postgres createdb -O sims_user db_manajemen_sekolah",
        "gunzip -c /backup/postgres/sims_backup_20261118_020000.sql.gz | psql -U sims_user -h localhost db_manajemen_sekolah"
    ])
    add_step(doc, 4, "Verifikasi Data & Jalankan Kembali Aplikasi", "Pastikan jumlah tabel dan relasi pulih sempurna, kemudian hidupkan kembali aplikasi:", [
        "pm2 start sims-production",
        "pm2 status"
    ])

    add_heading_2(doc, "8.3 Target RPO & RTO Lembaga")
    add_paragraph(
        doc,
        "Berdasarkan arsitektur redundansi dan backup yang diterapkan, parameter ketahanan bencana SIMS ditetapkan sebagai berikut:"
    )
    dr_metrics = [
        ("Recovery Point Objective (RPO)", "< 24 Jam", "Maksimum kehilangan data jika terjadi kegagalan total server adalah data transaksi sejak jadwal backup terakhir pukul 02:00 dini hari."),
        ("Recovery Time Objective (RTO)", "< 45 Menit", "Target waktu maksimum yang dibutuhkan tim teknis untuk memulihkan layanan SIMS hingga online kembali dari salinan backup cadangan."),
    ]
    add_styled_table(
        doc,
        headers=["Parameter Ketahanan Bencana", "Target Layanan (SLA)", "Keterangan Operasional"],
        rows=dr_metrics,
        col_widths=[Inches(2.2), Inches(1.5), Inches(2.4)]
    )

    add_heading_2(doc, "8.4 Pemantauan Kinerja, Log Rotation & Panduan Troubleshooting")
    add_paragraph(
        doc,
        "Tabel berikut menyajikan ringkasan penanganan cepat terhadap kendala operasional yang paling sering ditemui di lingkungan produksi:"
    )
    troubleshoot_data = [
        ("HTTP 502 Bad Gateway", "Aplikasi Next.js pada port 3000 dalam kondisi down atau crash.", "Periksa log PM2 ('pm2 logs'). Pastikan proses hidup dengan 'pm2 restart sims-production'."),
        ("Database Connection Timeout", "Koneksi pool PostgreSQL penuh (connection exhaustion).", "Tingkatkan connection_limit di DATABASE_URL atau sesuaikan max_connections di /etc/postgresql/16/main/postgresql.conf."),
        ("Disk Space Full (Storage Penuh)", "Log file Nginx/PM2 membengkak atau penumpukan arsip backup.", "Jalankan logrotate, bersihkan cache npm, dan periksa direktori /var/log serta /backup/postgres."),
        ("Error Migrasi Prisma", "Struktur tabel lokal tidak sinkron dengan DDL database.", "Jalankan 'npx prisma db push --accept-data-loss' dan 'npx prisma generate' lalu reload PM2."),
        ("Sertifikat SSL Expired", "Timer Certbot Let's Encrypt gagal memperbarui sertifikat.", "Jalankan 'sudo certbot renew --force-renewal' lalu reload Nginx dengan 'sudo systemctl reload nginx'."),
    ]
    add_styled_table(
        doc,
        headers=["Gejala Masalah (Symptom)", "Kemungkinan Penyebab Akar", "Langkah Solusi Pemecahan Cepat"],
        rows=troubleshoot_data,
        col_widths=[Inches(1.8), Inches(2.1), Inches(2.2)]
    )
    
    add_callout(
        doc,
        "TIP",
        "Pemberian Notifikasi Uptime Monitoring Eksternal",
        "Disarankan untuk mengintegrasikan layanan pemantauan eksternal gratis seperti Uptime Kuma atau Better Uptime yang menguji endpoint health-check 'https://sekolah.sch.id/api/sekolah/mode' setiap 60 detik dan mengirimkan peringatan instan ke Telegram/WhatsApp tim IT jika terjadi gangguan."
    )

    # Simpan berkas dokumen Word
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    doc.save(output_path)
    print(f"✅ Buku Teknis 4 berhasil dibuat di: {output_path}")

if __name__ == "__main__":
    build_tech_04_devops()
