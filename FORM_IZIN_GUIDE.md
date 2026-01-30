# Form Izin - User Guide

## Overview
Form Izin adalah form pengajuan izin dengan perhitungan durasi otomatis berdasarkan tanggal dan jam.

## Fitur

### 1. Input Tanggal
- **Tanggal Mulai Izin**: Input date picker dengan format tampilan `dd MMMM yyyy` (contoh: 29 Januari 2026)
- **Tanggal Selesai Izin**: Input date picker dengan format tampilan `dd MMMM yyyy`
- Keduanya ditampilkan berdampingan (side by side)
- Required field (wajib diisi)

### 2. Switch Pilih Jam
- Toggle switch dengan pilihan **Ya** / **Tidak**
- Default value: **Tidak**
- Menentukan apakah perhitungan durasi berdasarkan tanggal atau jam

### 3. Input Jam (Conditional)
Muncul hanya jika **Switch Pilih Jam = Ya**

#### Jam Mulai Izin
- Dropdown dengan pilihan jam: **08:00 - 17:00**
- Interval: Setiap **30 menit**
- Pilihan: 08:00, 08:30, 09:00, 09:30, ... 17:00
- Required jika switch = Ya

#### Jam Selesai Izin
- Dropdown dengan pilihan jam: **30 menit setelah Jam Mulai** hingga **17:00**
- Interval: Setiap **30 menit**
- Disabled jika Jam Mulai belum dipilih
- Contoh: Jika Jam Mulai = 09:00, maka pilihan: 09:30, 10:00, 10:30, ... 17:00
- Required jika switch = Ya

### 4. Durasi Izin (Auto-calculated, Read-only)

#### Durasi Izin (Jam)
- Field disabled (read-only)
- Perhitungan otomatis:
  - **Jika Switch Pilih Jam = Tidak**: Jumlah hari × 8 jam kerja
  - **Jika Switch Pilih Jam = Ya**: Selisih antara Jam Selesai dan Jam Mulai
- Format: Angka desimal (1 digit)

#### Durasi Izin (Hari)
- Field disabled (read-only)
- Perhitungan otomatis:
  - **Jika Switch Pilih Jam = Tidak**: Jumlah hari dari tanggal mulai hingga selesai (inklusif)
  - **Jika Switch Pilih Jam = Ya**: 0 (karena hitung dalam jam)
- Format: Angka bulat

## Contoh Penggunaan

### Contoh 1: Izin Berdasarkan Hari
```
Tanggal Mulai Izin: 29 Januari 2026
Tanggal Selesai Izin: 31 Januari 2026
Pilih Jam: Tidak

Result:
- Durasi Izin (Jam): 24 (3 hari × 8 jam)
- Durasi Izin (Hari): 3
```

### Contoh 2: Izin Berdasarkan Jam
```
Tanggal Mulai Izin: 29 Januari 2026
Tanggal Selesai Izin: 29 Januari 2026
Pilih Jam: Ya
Jam Mulai Izin: 09:00
Jam Selesai Izin: 14:30

Result:
- Durasi Izin (Jam): 5.5
- Durasi Izin (Hari): 0
```

## Field Structure (untuk Developer)

Form ini menggunakan `value.` prefix karena merupakan FORM type:

```typescript
value.tanggalMulai: string (ISO date format)
value.tanggalSelesai: string (ISO date format)
value.pilihJam: boolean
value.jamMulai: string (HH:mm format)
value.jamSelesai: string (HH:mm format)
value.durasiJam: number (auto-calculated)
value.durasiHari: number (auto-calculated)
```

## Integration

Form ini sudah ter-expose di Module Federation sebagai:
```
date_calculator/izin_form_view
```

Dan terdaftar di `index.json` sebagai:
```json
{
  "forms": {
    "izin_form": {
      "name": "Form Izin",
      "description": "Form untuk pengajuan izin dengan perhitungan durasi otomatis"
    }
  },
  "custom_views": {
    "FORMS": {
      "izin_form": "izin_form_view"
    }
  }
}
```

## Notes
- Perhitungan durasi berjalan secara real-time (reactive)
- Validasi dilakukan secara otomatis oleh react-hook-form
- Field durasi tidak dapat diedit secara manual (read-only)
- Format tanggal mengikuti locale Indonesia (dd MMMM yyyy)

