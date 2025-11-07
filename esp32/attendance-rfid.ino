/*
 * ESP32 RFID Attendance System
 * 
 * Hardware Requirements:
 * - ESP32 Board
 * - MFRC522 RFID Reader
 * - LCD I2C 16x2 (optional)
 * - Buzzer (optional)
 * - LED indicator (optional)
 * 
 * Wiring MFRC522 to ESP32:
 * SDA  -> GPIO 21
 * SCK  -> GPIO 18
 * MOSI -> GPIO 23
 * MISO -> GPIO 19
 * RST  -> GPIO 22
 * GND  -> GND
 * 3.3V -> 3.3V
 * 
 * Install Libraries:
 * - MFRC522 by GithubCommunity
 * - ArduinoJson by Benoit Blanchon
 * - LiquidCrystal I2C (if using LCD)
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <SPI.h>
#include <MFRC522.h>
#include <ArduinoJson.h>
// #include <LiquidCrystal_I2C.h> // Uncomment if using LCD

// ============= KONFIGURASI WIFI =============
const char* ssid = "WIFI_SSID";           // Ganti dengan nama WiFi Anda
const char* password = "WIFI_PASSWORD";    // Ganti dengan password WiFi Anda

// ============= KONFIGURASI SUPABASE =============
const char* supabaseUrl = "https://qwsoexcarmxilvhubvvw.supabase.co/functions/v1/esp32-attendance";
const String deviceId = "ESP32_001";       // ID unik untuk device ini

// ============= PIN CONFIGURATION =============
#define SS_PIN 21
#define RST_PIN 22
#define BUZZER_PIN 5    // Optional: Pin untuk buzzer
#define LED_GREEN 2     // Optional: LED hijau untuk sukses
#define LED_RED 4       // Optional: LED merah untuk gagal

// ============= HARDWARE OBJECTS =============
MFRC522 rfid(SS_PIN, RST_PIN);
// LiquidCrystal_I2C lcd(0x27, 16, 2); // Uncomment if using LCD

// ============= VARIABLES =============
String lastRfidCode = "";
unsigned long lastScanTime = 0;
const unsigned long SCAN_DELAY = 3000; // Delay 3 detik antar scan yang sama

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n\n=================================");
  Serial.println("ESP32 RFID Attendance System");
  Serial.println("=================================\n");
  
  // Setup pins
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(LED_GREEN, OUTPUT);
  pinMode(LED_RED, OUTPUT);
  
  // Init LCD (if using)
  // lcd.init();
  // lcd.backlight();
  // lcd.setCursor(0, 0);
  // lcd.print("RFID Attendance");
  // lcd.setCursor(0, 1);
  // lcd.print("Initializing...");
  
  // Init SPI and RFID
  SPI.begin();
  rfid.PCD_Init();
  Serial.println("✓ RFID Reader initialized");
  Serial.print("Reader Version: ");
  rfid.PCD_DumpVersionToSerial();
  
  // Connect to WiFi
  connectWiFi();
  
  Serial.println("\n=================================");
  Serial.println("System Ready!");
  Serial.println("Scan your RFID card...");
  Serial.println("=================================\n");
  
  // lcd.clear();
  // lcd.setCursor(0, 0);
  // lcd.print("Ready to Scan");
  // lcd.setCursor(0, 1);
  // lcd.print("Tap Your Card");
  
  beep(2, 100); // 2 beep singkat = ready
}

void loop() {
  // Check WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected. Reconnecting...");
    // lcd.clear();
    // lcd.print("WiFi Error!");
    connectWiFi();
  }
  
  // Check for RFID card
  if (!rfid.PICC_IsNewCardPresent()) {
    return;
  }
  
  if (!rfid.PICC_ReadCardSerial()) {
    return;
  }
  
  // Read RFID UID
  String rfidCode = getRfidCode();
  
  // Prevent duplicate scans
  if (rfidCode == lastRfidCode && (millis() - lastScanTime) < SCAN_DELAY) {
    Serial.println("⚠ Duplicate scan ignored (too soon)");
    rfid.PICC_HaltA();
    rfid.PCD_StopCrypto1();
    return;
  }
  
  lastRfidCode = rfidCode;
  lastScanTime = millis();
  
  Serial.println("\n--- RFID Card Detected ---");
  Serial.print("UID: ");
  Serial.println(rfidCode);
  
  // lcd.clear();
  // lcd.setCursor(0, 0);
  // lcd.print("Card: ");
  // lcd.print(rfidCode.substring(0, 10));
  // lcd.setCursor(0, 1);
  // lcd.print("Sending...");
  
  beep(1, 100); // Single beep = card detected
  digitalWrite(LED_GREEN, HIGH);
  
  // Send to Supabase
  bool success = sendAttendance(rfidCode);
  
  if (success) {
    Serial.println("✓ Attendance recorded successfully!");
    // lcd.clear();
    // lcd.setCursor(0, 0);
    // lcd.print("Success!");
    // lcd.setCursor(0, 1);
    // lcd.print("Absensi Tercatat");
    
    beep(2, 100); // 2 beep = sukses
    blinkLed(LED_GREEN, 3, 200);
    delay(2000);
  } else {
    Serial.println("✗ Failed to record attendance");
    // lcd.clear();
    // lcd.setCursor(0, 0);
    // lcd.print("Failed!");
    // lcd.setCursor(0, 1);
    // lcd.print("Coba Lagi");
    
    beep(3, 100); // 3 beep cepat = gagal
    blinkLed(LED_RED, 3, 200);
    delay(2000);
  }
  
  digitalWrite(LED_GREEN, LOW);
  digitalWrite(LED_RED, LOW);
  
  // lcd.clear();
  // lcd.setCursor(0, 0);
  // lcd.print("Ready to Scan");
  // lcd.setCursor(0, 1);
  // lcd.print("Tap Your Card");
  
  // Halt PICC
  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();
  
  Serial.println("-------------------------\n");
}

void connectWiFi() {
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);
  
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✓ WiFi connected!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
    Serial.print("Signal Strength: ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
  } else {
    Serial.println("\n✗ WiFi connection failed!");
    // lcd.clear();
    // lcd.print("WiFi Failed!");
    delay(3000);
    ESP.restart();
  }
}

String getRfidCode() {
  String code = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    if (rfid.uid.uidByte[i] < 0x10) {
      code += "0";
    }
    code += String(rfid.uid.uidByte[i], HEX);
  }
  code.toUpperCase();
  return code;
}

bool sendAttendance(String rfidCode) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("✗ No WiFi connection");
    return false;
  }
  
  HTTPClient http;
  http.begin(supabaseUrl);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(10000); // 10 second timeout
  
  // Create JSON payload
  StaticJsonDocument<200> doc;
  doc["rfid_code"] = rfidCode;
  doc["device_id"] = deviceId;
  doc["timestamp"] = millis();
  
  String jsonPayload;
  serializeJson(doc, jsonPayload);
  
  Serial.println("Sending to server:");
  Serial.println(jsonPayload);
  
  // Send POST request
  int httpResponseCode = http.POST(jsonPayload);
  
  bool success = false;
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.print("HTTP Response code: ");
    Serial.println(httpResponseCode);
    Serial.print("Response: ");
    Serial.println(response);
    
    // Parse response
    StaticJsonDocument<512> responseDoc;
    DeserializationError error = deserializeJson(responseDoc, response);
    
    if (!error) {
      bool apiSuccess = responseDoc["success"] | false;
      const char* message = responseDoc["message"] | "Unknown response";
      
      Serial.print("Server message: ");
      Serial.println(message);
      
      if (apiSuccess) {
        success = true;
      }
      
      // Display message on LCD
      // lcd.clear();
      // lcd.setCursor(0, 0);
      // lcd.print(apiSuccess ? "Sukses!" : "Gagal!");
      // lcd.setCursor(0, 1);
      // lcd.print(message);
    }
  } else {
    Serial.print("✗ HTTP Error: ");
    Serial.println(httpResponseCode);
    Serial.println(http.errorToString(httpResponseCode));
  }
  
  http.end();
  return success;
}

void beep(int times, int duration) {
  for (int i = 0; i < times; i++) {
    digitalWrite(BUZZER_PIN, HIGH);
    delay(duration);
    digitalWrite(BUZZER_PIN, LOW);
    if (i < times - 1) {
      delay(duration);
    }
  }
}

void blinkLed(int pin, int times, int duration) {
  for (int i = 0; i < times; i++) {
    digitalWrite(pin, HIGH);
    delay(duration);
    digitalWrite(pin, LOW);
    if (i < times - 1) {
      delay(duration);
    }
  }
}
