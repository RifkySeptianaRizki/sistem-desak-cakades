# Sistem Desak Cakades — Pilkades Desa Baginda 2026

Aplikasi siaran panggung resmi (*Live Broadcast & Stage Display System*) untuk acara **Desak Cakades (Calon Kepala Desa) Desa Baginda Tahun 2026**. Dilengkapi dengan bumper profil calon, bumper sambutan, video lagu kebangsaan Indonesia Raya, serta sistem countdown timer debat 4 sesi berstandar broadcast profesional.

---

## 🚀 Fitur Utama

1. **Halaman Utama (Standby Screen)**:
   - Tipografi megah **DESAK CAKADES** dengan font resmi **Albertus Nova**.
   - Efek visual atmosfer bara api melayang (*Ember Particle Overlay*).
   - Mode layar penuh (*Fullscreen*) terkunci dengan rasio siaran tanpa distraksi.

2. **Suite Bumper Panggung**:
   - **Bumper Sambutan**: Sambutan Ketua Panitia Pilkades (**APENDI**) dengan desain panggung terpusat.
   - **Bumper Indonesia Raya**: Video panggung megah lagu kebangsaan beresolusi tinggi dengan kontrol autoplay & spacebar.
   - **Bumper 4 Calon Kepala Desa**:
     - Calon 01: **HERU HERNAWAN**
     - Calon 02: **ELAN SUKARLAN**
     - Calon 03: **ADI ARISNADI N**
     - Calon 04: **AHMAD GUSRAM N.H**
     - Menampilkan foto calon berukuran besar, nomor urut tegas, dan jingle audio bumper resmi.

3. **Countdown Timer Debat (4 Sesi)**:
   - Sesi 1: Pemaparan Visi, Misi & Program Unggulan (5 Menit)
   - Sesi 2: Pengajuan Pertanyaan Panelis (1 Menit 30 Detik)
   - Sesi 3: Jawaban Cakades atas Pertanyaan Panelis (3 Menit)
   - Sesi 4: Closing Statement & Deklarasi Damai (2 Menit)
   - Chamber kaca cair (*Liquid Glass Single Chamber*), font digital Technology-Bold, hitung mundur 3-2-1, serta penanda suara gong di detik akhir.
   - **Safety Lock**: Tombol bumper otomatis terkunci saat sesi timer aktif agar tidak menginterupsi debat.

4. **Sistem Undian Giliran Calon (`Ctrl + U`)**:
   - Fitur pengacak / roll giliran calon yang akan menjawab pertanyaan panelis secara adil dan transparan.
   - Dilengkapi efek suara `shuffling.mp3`, visual liquid glass cylinder roll, penanda nomor urut monumental, serta fanfare gong saat mendarat di calon pemenang.

5. **Navigasi Keyboard Penuh**:
   - Panduan lengkap seluruh shortcut dapat dilihat pada file [SHORTCUTS.md](SHORTCUTS.md).

---

## 📁 Struktur Berkas

```text
sistem-desak-cakades/
├── index.html            # Entry HTML & konfigurasi favicon
├── package.json          # Dependencies & build scripts
├── vite.config.js        # Konfigurasi Vite & Tailwind CSS v4
├── SHORTCUTS.md          # Panduan tombol operator panggung
├── README.md             # Dokumentasi proyek
├── public/               # Asset statis publik
└── src/
    ├── main.jsx          # Entry point React
    ├── App.jsx           # Komponen root & manajemen mode/shortcut
    ├── index.css         # Styling Tailwind v4 & deklarasi font-face
    ├── components/
    │   ├── EsportsTitle.jsx    # Judul utama Home (Albertus Nova)
    │   ├── CooldownTimer.jsx   # Timer debat sesi 1 - 4
    │   ├── BumperSuite.jsx     # Bumper Sambutan, Indonesia Raya & Calon
    │   └── EmberOverlay.jsx    # Partikel atmosfer bara api
    ├── utils/
    │   └── audioManager.js     # Manajer pemutaran audio & jingle
    └── assets/                 # Video, audio jingle, foto calon & font
```

---

## 🛠️ Panduan Menjalankan & Deploy

### 1. Mode Development
```bash
npm install
npm run dev
```

### 2. Build untuk Produksi
```bash
npm run build
```
Hasil build siap deploy akan dihasilkan di dalam folder `dist/`.

### 3. Deploy ke Vercel / Netlify / Cloudflare Pages
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Node Version**: 18+ atau 20+

### 4. Preview Hasil Build Lokal
```bash
npm run preview
```
