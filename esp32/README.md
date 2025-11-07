# ESP32 RFID Attendance System

Program Arduino untuk ESP32 dengan RFID reader untuk sistem absensi.

## 🔧 Hardware yang Dibutuhkan

### Wajib:
1. **ESP32 Development Board** (NodeMCU-32S, ESP32-DevKitC, dll)
2. **MFRC522 RFID Reader Module** (13.56MHz)
3. **RFID Cards/Tags** (MIFARE Classic 1K)

### Optional (Recommended):
4. **LCD I2C 16x2** - Untuk display status
5. **Buzzer 5V** - Untuk feedback audio
6. **LED** (Hijau & Merah) - Untuk indikator visual
7. **Resistor 220Ω** (untuk LED)
8. **Power Supply 5V/1A** atau USB

## 📋 Wiring Diagram

### MFRC522 RFID Reader → ESP32:
```
MFRC522    ESP32
-----------------
SDA    →   GPIO 21
SCK    →   GPIO 18
MOSI   →   GPIO 23
MISO   →   GPIO 19
RST    →   GPIO 22
GND    →   GND
3.3V   →   3.3V
```

### Optional Components:
```
Component      ESP32
---------------------
Buzzer    →   GPIO 5
LED Green →   GPIO 2 (+ Resistor 220Ω)
LED Red   →   GPIO 4 (+ Resistor 220Ω)

LCD I2C (Optional):
SDA       →   GPIO 21
SCL       →   GPIO 22
VCC       →   5V
GND       →   GND
```

## 📚 Library yang Diperlukan

Install via Arduino IDE Library Manager:

1. **MFRC522** by GithubCommunity
   - Sketch → Include Library → Manage Libraries
   - Search: "MFRC522"
   - Install versi terbaru

2. **ArduinoJson** by Benoit Blanchon
   - Search: "ArduinoJson"
   - Install versi 6.x.x

3. **LiquidCrystal I2C** (jika pakai LCD)
   - Search: "LiquidCrystal I2C"
   - Install versi terbaru

## ⚙️ Konfigurasi

Edit bagian ini di file `attendance-rfid.ino`:

```cpp
// ============= KONFIGURASI WIFI =============
const char* ssid = "WIFI_SSID";           // Nama WiFi Anda
const char* password = "WIFI_PASSWORD";    // Password WiFi

// ============= KONFIGURASI SUPABASE =============
const char* supabaseUrl = "https://qwsoexcarmxilvhubvvw.supabase.co/functions/v1/esp32-attendance";
const String deviceId = "ESP32_001";       // ID unik untuk device ini
```

### Multiple Device Setup:
Jika pakai lebih dari 1 ESP32, ganti `deviceId` untuk setiap device:
- Device 1: `ESP32_001`
- Device 2: `ESP32_002`
- Device 3: `ESP32_003`

## 🚀 Upload ke ESP32

1. **Install ESP32 Board di Arduino IDE:**
   - File → Preferences
   - Additional Board Manager URLs: 
     ```
     https://dl.espressif.com/dl/package_esp32_index.json
     ```
   - Tools → Board → Boards Manager
   - Search "ESP32" dan install

2. **Pilih Board:**
   - Tools → Board → ESP32 Arduino → "ESP32 Dev Module"

3. **Pilih Port:**
   - Tools → Port → (pilih COM port ESP32)

4. **Upload:**
   - Klik tombol Upload (→)

## 📱 Cara Menggunakan

1. **Power ON ESP32**
   - Tunggu sampai WiFi connected
   - LED akan berkedip menandakan ready

2. **Register RFID Card:**
   - Scan kartu RFID pertama kali di web app
   - Sistem akan menyimpan UID kartu

3. **Attendance:**
   - Tempelkan kartu RFID ke reader
   - Buzzer akan beep:
     - 1 beep = Card detected
     - 2 beep = Success
     - 3 beep cepat = Failed
   - LED hijau = sukses, LED merah = gagal

## 🔍 Testing & Debugging

### Serial Monitor:
```
Tools → Serial Monitor
Baud Rate: 115200
```

Output normal:
```
=================================
ESP32 RFID Attendance System
=================================

✓ RFID Reader initialized
Connecting to WiFi: YourWiFi
✓ WiFi connected!
IP Address: 192.168.1.100

System Ready!
Scan your RFID card...

--- RFID Card Detected ---
UID: A1B2C3D4
Sending to server:
{"rfid_code":"A1B2C3D4","device_id":"ESP32_001"}
HTTP Response code: 200
✓ Attendance recorded successfully!
```

### Troubleshooting:

**WiFi tidak connect:**
- Cek SSID dan password
- Pastikan WiFi 2.4GHz (ESP32 tidak support 5GHz)
- Cek jarak dari router

**RFID tidak terbaca:**
- Cek wiring (terutama SDA, SCK, MOSI, MISO)
- Pastikan power RFID reader 3.3V (BUKAN 5V!)
- Coba kartu RFID lain

**HTTP Error:**
- Cek koneksi internet
- Pastikan Supabase URL benar
- Cek logs di Supabase edge function

## 🎯 Fitur Tambahan

### 1. Auto Reconnect WiFi
Jika WiFi putus, ESP32 akan otomatis reconnect.

### 2. Duplicate Scan Prevention
Kartu yang sama tidak bisa scan 2x dalam 3 detik.

### 3. Feedback Multi-Modal:
- Serial Monitor (debugging)
- Buzzer (audio)
- LED (visual)
- LCD (optional display)

## 📊 Register Device di Database

Untuk tracking device ESP32, insert ke database:

```sql
INSERT INTO esp32_devices (device_id, device_name, location, is_active)
VALUES 
  ('ESP32_001', 'Main Gate Reader', 'Gerbang Utama', true),
  ('ESP32_002', 'Class A Reader', 'Ruang Kelas A', true);
```

## 🔐 Security Notes

1. **WiFi Credentials**: Simpan di flash ESP32 (aman)
2. **No API Key Required**: Edge function public (verify RFID server-side)
3. **Device ID**: Untuk tracking dan audit log

## 📖 Next Steps

- [ ] Setup hardware sesuai wiring diagram
- [ ] Install libraries
- [ ] Edit konfigurasi WiFi & Device ID
- [ ] Upload code ke ESP32
- [ ] Register RFID cards via web app
- [ ] Test attendance system

## 💡 Tips

1. **Jarak Optimal**: RFID reader efektif 0-5cm
2. **Card Position**: Tempelkan center kartu ke reader
3. **Power Stable**: Gunakan power supply 5V/1A minimum
4. **Enclosure**: Buat box untuk proteksi dari debu/air

## 🆘 Support

Jika ada masalah:
1. Check serial monitor untuk error messages
2. Verify wiring connections
3. Test dengan scan manual di web app
4. Check edge function logs
