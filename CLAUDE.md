# SkillArena.id — CLAUDE.md
> File ini dibaca AI assistant di setiap sesi baru.
> Berisi semua konteks project yang dibutuhkan tanpa perlu dijelaskan ulang.

---

## IDENTITAS PROJECT

**Nama:** SkillArena.id
**Tagline:** Adu Otak. Menang Nyata.
**Positioning:** Competitive Learning Platform — BUKAN "pengganti judol"
**Misi:** Mengalihkan pecandu judol ke ekosistem kompetisi pengetahuan yang membangun wawasan dan menghasilkan uang nyata dari skill — bukan keberuntungan.
**Status:** Fase development awal — MVP belum selesai

---

## FILOSOFI YANG TIDAK BOLEH DILANGGAR

1. User bisa main TANPA modal selamanya (via koin dari iklan)
2. Hadiah WD selalu 100% full — tidak ada potongan ke user
3. Fitur kesehatan adalah product constraint, BUKAN CSR
4. Cooldown TIDAK bisa di-bypass dengan apapun (uang, koin, iklan)
5. Tidak ada dark pattern — tidak ada yang memaksa atau menjebak
6. Jangan pernah trust client — semua game logic di server
7. Positioning publik: "competitive learning" — BUKAN "pengganti judi"
8. 90% revenue iklan dikembalikan ke user sebagai koin

---

## TECH STACK

| Layer | Teknologi |
|-------|-----------|
| Frontend | HTML + CSS + JS murni (tidak pakai framework) |
| Hosting | GitHub + Netlify |
| Database & Auth | Supabase (region: Singapore) |
| AI Soal | Gemini Flash 2.0 via OpenRouter |
| Cron soal | Supabase pg_cron (generate soal tiap malam 02.00 WIB) |
| Device fingerprint | FingerprintJS open source |
| OTP SMS | Zenziva (provider lokal Indonesia) |
| Payment | Midtrans (satu dulu) |
| Iklan | Google AdSense for Games (BUKAN AdMob — AdMob hanya untuk native app) |
| Error monitoring | Sentry free tier |
| Domain | skillarena.id (belum dibeli) |

### Keamanan Wajib
- API key TIDAK BOLEH di GitHub — simpan di Netlify Environment Variables
- Akses API hanya via Netlify Functions (server-side)
- Supabase RLS strict — frontend tidak bisa langsung update saldo/skor
- Game timer, validasi jawaban, skor — semua di SERVER
- Jawaban benar tidak pernah dikirim ke browser

---

## MODEL EKONOMI

### Tiga Sumber Revenue
1. **Platform cut 20%** dari setiap entry fee turnamen berbayar
2. **10% revenue iklan** (90% kembali ke user sebagai koin)
3. **Komisi payment gateway** → dipakai subsidi fee transaksi user

### Sistem Koin
- Koin = hak akses platform, bukan uang
- Tidak bisa dicairkan langsung
- Dapat koin dari: nonton iklan (10 koin), streak (5 koin), referral (50 koin), dll
- Maks 6 iklan/hari = 60 koin dari iklan (iklan ke 4-6 hanya 5 koin)
- Koin expired setelah 30 hari

### Hadiah & Peserta
- Hadiah maks: Rp 500.000 per turnamen per user
- Hadiah kumulatif maks: Rp 500.000/user/hari
- 20% peserta menang (bukan 10%)
- Distribusi: Juara 1 (25%) + Juara 2 (15%) + Juara 3 (10%) + Rank 4-20 (50%)
- Peserta dibatasi agar juara 1 tidak melebihi Rp 500K
- 80% entry fee = prize pool, 20% = platform

---

## CARA DAFTAR USER

```
Buka app → lihat turnamen tanpa login
→ mau ikut → "Daftar"
→ masukkan nomor HP → OTP via Zenziva
→ akun aktif → main turnamen gratis
→ mau WD → daftarkan nomor e-wallet
```

- HP + OTP = cara daftar (BUKAN e-wallet login — tidak ada API-nya)
- E-wallet hanya untuk terima hadiah
- KTP tidak pernah diminta (hadiah max Rp 500K)
- Data minimal: nomor HP hash, device fingerprint hash, e-wallet hash

---

## ANTI MULTI AKUN (4 LAPIS)

1. Satu nomor HP = satu akun
2. Satu device fingerprint = satu akun
3. Satu nomor e-wallet = satu akun
4. Behavioral analysis (skor terlalu sempurna, pola tidak manusiawi)

---

## FORMAT TURNAMEN

- 10 soal per turnamen
- 10-15 detik per soal
- Total: ±2-3 menit main
- Rumus skor: (benar × 1.2) + (kecepatan × 0.8)
- Semua peserta soal identik — urutan pilihan jawaban diacak
- Soal pre-generated (bukan real-time AI)

### Jadwal
- Turnamen cepat: setiap 30 menit per kategori
- Turnamen besar: 3 sesi/hari (07.00, 12.00, 20.00) — semua kategori buka bersamaan
- Mode latihan: selalu tersedia, gratis, tidak ada uang

---

## KATEGORI

### 6 Kategori Launch
1. 🇮🇩 Sejarah & Budaya Indonesia
2. ⚽ Olahraga & Hiburan
3. 🔬 Sains & Teknologi
4. 🧠 Penalaran & Logika
5. 📈 Ekonomi & Bisnis
6. 🍜 Budaya & Kuliner Nusantara

### 8 Kategori Ekspansi (bertahap)
7. 🏥 Kesehatan & Gaya Hidup
8. 🌏 Geografi & Alam Indonesia
9. 🎬 Film & Musik Indonesia
10. 📚 Bahasa & Sastra Indonesia
11. ⚖️ Hukum & Kewarganegaraan
12. 🚀 Teknologi & Startup
13. 🌾 Pertanian & Lingkungan
14. 🎨 Seni & Kerajinan Nusantara

**Kategori Agama: tidak ada untuk sementara**

---

## FITUR KESEHATAN (WAJIB MVP)

### Hard Cooldown (server-enforced, tidak bisa di-bypass)
- 3 turnamen berbayar berturut → disable 15 menit
- Kalah 2× berturut → cooldown 10 menit (tidak bisa diubah)
- Main 45 menit → disable 5 menit
- Main 60 menit → disable 30 menit
- 100% batas harian → disable sampai 00.00

### Default Loss Limit (aktif otomatis semua akun baru)
- Maks 5 turnamen berbayar/hari (maks absolut: 10)
- Maks Rp 25.000/hari (maks absolut: Rp 50.000)
- Ubah batas butuh konfirmasi OTP

### Fitur Lain
- Analisis Kelemahan (BUKAN revenge match — revenge match dihapus total)
- Self-exclusion button (1/7/30 hari, tidak bisa di-override)
- Onboarding responsible gaming (modal wajib sebelum berbayar pertama)
- Income statement bulanan di dashboard
- Transparency stats: pengeluaran, waktu main, win rate, topik lemah

---

## DEPOSIT & WITHDRAW

| Aksi | Bayar Uang | Alternatif Koin |
|------|-----------|-----------------|
| Fee top up | Ditanggung platform | 5 koin |
| Fee WD | Ditanggung platform | 5 koin |
| Entry fee turnamen | Rp 3K-10K | 30-100 koin (pending legal) |

- Min top up: Rp 10.000
- Min WD: Rp 10.000
- WD otomatis dalam 24 jam, full 100%
- Fee gateway ditanggung platform dari komisi gateway + revenue iklan

---

## STRUKTUR FOLDER PROJECT

```
skillarena/
├── CLAUDE.md              ← file ini
├── index.html             ← landing page
├── game.html              ← game screen
├── register.html          ← daftar HP + OTP
├── verify-otp.html        ← verifikasi OTP
├── turnamen.html          ← daftar turnamen aktif
├── dashboard.html         ← profil, saldo, koin, stats
├── hasil.html             ← hasil + analisis kelemahan
├── topup.html             ← isi saldo
├── withdraw.html          ← tarik saldo
├── belajar.html           ← mode latihan + materi
├── fakta.html             ← fakta harian per kategori
├── netlify/functions/
│   ├── send-otp.js
│   ├── verify-otp.js
│   ├── join-tournament.js
│   ├── validate-answer.js
│   ├── check-cooldown.js
│   ├── calculate-winner.js
│   ├── payment-callback.js
│   └── ad-ssv-callback.js
├── static-questions/      ← fallback bank soal JSON
│   ├── sejarah.json
│   ├── olahraga.json
│   └── ...
├── assets/
│   ├── style.css
│   └── app.js
├── .env                   ← JANGAN push ke GitHub!
├── .env.example           ← template env (aman di-push)
├── .gitignore
└── README.md
```

---

## STATUS FILE YANG SUDAH DIBUAT

| File | Status | Catatan |
|------|--------|---------|
| `index.html` | ✅ Ada — perlu update konten | Kategori & hadiah belum sesuai blueprint v5 |
| `game.html` | ✅ Ada — perlu sambung server | Validasi masih di client, soal masih hardcoded |

---

## HALAMAN YANG PERLU DIBUAT (PRIORITAS)

### Fase 1 — MVP Gratis
1. Update `index.html` sesuai blueprint v5
2. Update `game.html` → validasi server-side + soal dari Supabase
3. `register.html` + `verify-otp.html` → HP + OTP via Zenziva
4. `turnamen.html` → daftar turnamen aktif dari Supabase
5. `dashboard.html` → profil + transparency stats
6. `hasil.html` → hasil + analisis kelemahan

### Fase 2 — Setelah Ada User
7. `topup.html` + `withdraw.html` → integrasi Midtrans
8. `belajar.html` → mode latihan + materi
9. `fakta.html` → fakta harian

---

## ENVIRONMENT VARIABLES YANG DIBUTUHKAN

```
# Supabase
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=      ← RAHASIA, hanya di server

# OpenRouter (AI soal)
OPENROUTER_API_KEY=             ← RAHASIA

# Zenziva (OTP SMS)
ZENZIVA_USERKEY=                ← RAHASIA
ZENZIVA_PASSKEY=                ← RAHASIA

# Midtrans (payment)
MIDTRANS_SERVER_KEY=            ← RAHASIA
MIDTRANS_CLIENT_KEY=            ← aman di frontend

# FingerprintJS
FPJS_API_KEY=
```

---

## BLUEPRINT LENGKAP

File blueprint lengkap tersimpan di:
`skillarena-blueprint-v5.md`

Berisi 16 bagian detail termasuk schema database lengkap, prompt engineering soal, roadmap build, dan checklist go/no-go.

---

## KONVENSI CODING

- Bahasa Indonesia untuk semua copy/teks yang terlihat user
- Bahasa Inggris untuk nama variable, function, komentar kode
- Tidak pakai framework JS — vanilla HTML/CSS/JS murni
- Setiap Netlify Function harus validasi input sebelum proses apapun
- Setiap transaksi uang harus punya idempotency key
- Jangan pernah log data sensitif (nomor HP, e-wallet, saldo)

---

*CLAUDE.md — SkillArena.id*
*Update file ini setiap ada keputusan baru yang signifikan*
