/*
 * ============================================================
 *   IoT Air Pollution Monitor - STABLE VERSION
 *   University Project: Advanced Networks
 * ============================================================
 *
 *  REQUIRED LIBRARIES:
 *    1. WiFi         (built-in)
 *    2. PubSubClient by Nick O'Leary
 *
 *  WIRING:
 *    MQ135   AOUT → GPIO34 | VCC → 5V | GND → GND
 *    MQ2     AOUT → GPIO32 | VCC → 5V | GND → GND
 *    RED LED      → GPIO21
 *    YELLOW LED   → GPIO19
 *    GREEN LED    → GPIO18
 *    Buzzer  (+)  → GPIO25 | (-) → GND
 * ============================================================
 */

#include <WiFi.h>
#include <PubSubClient.h>

/* ================= WIFI ================= */
const char* ssid     = "YOUR_WIFI_NAME";
const char* password = "YOUR_WIFI_PASSWORD";

/* ================= MQTT BROKER (Public - No account needed) ================= */
const char* mqtt_server = "broker.hivemq.com";
const int   mqtt_port   = 1883;
const char* mqtt_user   = "";
const char* mqtt_pass   = "";
const char* device_id   = "ESP32_001";

/* ================= TOPICS ================= */
const char* TOPIC_MQ135  = "airpollution/sensors/mq135";
const char* TOPIC_MQ2    = "airpollution/sensors/mq2";
const char* TOPIC_STATUS = "airpollution/status";

/* ================= PINS ================= */
#define MQ135_PIN    34
#define MQ2_PIN      32
#define RED_LED      21
#define YELLOW_LED   19
#define GREEN_LED    18
#define BUZZER_PIN   25

/* ================= THRESHOLDS ================= */
#define MQ135_WARNING  1800
#define MQ135_DANGER   2800
#define MQ2_WARNING    1500
#define MQ2_DANGER     2500

/* ================= OBJECTS ================= */
WiFiClient   espClient;
PubSubClient client(espClient);

/* ================= TIMERS ================= */
unsigned long lastMsg    = 0;
unsigned long lastStatus = 0;
unsigned long lastBuzzer = 0;
const long SENSOR_INTERVAL = 3000;
const long STATUS_INTERVAL = 30000;

/* ================= VARIABLES ================= */
int    mq135Value = 0;
int    mq2Value   = 0;
String alertLevel = "SAFE";

/* ============================================================
   WIFI SETUP
   ============================================================ */
void setup_wifi() {
  Serial.println();
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);

  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.println("✅ WiFi Connected");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println();
    Serial.println("❌ WiFi Failed");
  }
}

/* ============================================================
   MQTT RECONNECT
   ============================================================ */
void reconnect() {
  if (client.connected()) return;

  Serial.println("--- MQTT Status ---");
  Serial.print("Broker: "); Serial.println(mqtt_server);
  Serial.print("Port:   "); Serial.println(mqtt_port);
  Serial.print("WiFi:   "); Serial.println(WiFi.status() == WL_CONNECTED ? "Connected" : "Disconnected");
  Serial.print("Connecting to HiveMQ Cloud...");

  String clientId = "ESP32-" + String(random(0xffff), HEX);

  if (client.connect(clientId.c_str())) {
    Serial.println(" ✅ MQTT Connected!");
    publishStatus();
  } else {
    int rc = client.state();
    Serial.print(" ❌ Failed, rc=");
    Serial.println(rc);
    Serial.println("rc codes: -4=timeout -3=server unavailable -2=bad credentials -1=disconnected");
    Serial.println("Retrying in 5 seconds...");
    delay(5000);
  }
}

/* ============================================================
   SENSOR AVERAGING (10 samples for accuracy)
   ============================================================ */
int readAverage(int pin) {
  long sum = 0;
  for (int i = 0; i < 10; i++) {
    sum += analogRead(pin);
    delay(5);
  }
  return sum / 10;
}

/* ============================================================
   READ SENSORS
   ============================================================ */
void readSensors() {
  mq135Value = readAverage(MQ135_PIN);
  mq2Value   = readAverage(MQ2_PIN);
}

/* ============================================================
   ALERT SYSTEM
   🔴 RED    = DANGEROUS
   🟡 YELLOW = WARNING
   🟢 GREEN  = SAFE
   ============================================================ */
void checkAlertLevel() {
  bool dangerous = (mq135Value >= MQ135_DANGER || mq2Value >= MQ2_DANGER);
  bool warning   = (mq135Value >= MQ135_WARNING || mq2Value >= MQ2_WARNING);

  digitalWrite(RED_LED,    LOW);
  digitalWrite(YELLOW_LED, LOW);
  digitalWrite(GREEN_LED,  LOW);
  digitalWrite(BUZZER_PIN, LOW);

  if (dangerous) {
    alertLevel = "DANGEROUS";
    digitalWrite(RED_LED,    HIGH);
    digitalWrite(BUZZER_PIN, HIGH);
  } else if (warning) {
    alertLevel = "WARNING";
    digitalWrite(YELLOW_LED, HIGH);
    if (millis() - lastBuzzer > 3000) {
      lastBuzzer = millis();
      digitalWrite(BUZZER_PIN, HIGH);
      delay(100);
      digitalWrite(BUZZER_PIN, LOW);
    }
  } else {
    alertLevel = "SAFE";
    digitalWrite(GREEN_LED, HIGH);
  }
}

/* ============================================================
   PUBLISH MQ135
   Topic: airpollution/sensors/mq135
   ============================================================ */
void publishMQ135() {
  float co2     = map(mq135Value, 0, 4095, 400, 5000);
  float nh3     = map(mq135Value, 0, 4095, 0, 100);
  float benzene = map(mq135Value, 0, 4095, 0, 20);
  float alcohol = map(mq135Value, 0, 4095, 0, 1000);

  String payload = "{";
  payload += "\"deviceId\":\"" + String(device_id) + "\",";
  payload += "\"raw\":"     + String(mq135Value)  + ",";
  payload += "\"co2\":"     + String(co2, 1)      + ",";
  payload += "\"nh3\":"     + String(nh3, 1)      + ",";
  payload += "\"benzene\":" + String(benzene, 1)  + ",";
  payload += "\"alcohol\":" + String(alcohol, 1);
  payload += "}";

  bool ok = client.publish(TOPIC_MQ135, payload.c_str(), true);
  Serial.println(ok ? "📤 MQ135 Sent ✅" : "📤 MQ135 FAILED ❌");
}

/* ============================================================
   PUBLISH MQ2
   Topic: airpollution/sensors/mq2
   ============================================================ */
void publishMQ2() {
  float smoke = map(mq2Value, 0, 4095, 0, 1000);

  String payload = "{";
  payload += "\"deviceId\":\"" + String(device_id) + "\",";
  payload += "\"raw\":"   + String(mq2Value)  + ",";
  payload += "\"smoke\":" + String(smoke, 1);
  payload += "}";

  bool ok2 = client.publish(TOPIC_MQ2, payload.c_str(), true);
  Serial.println(ok2 ? "📤 MQ2 Sent ✅" : "📤 MQ2 FAILED ❌");
}

/* ============================================================
   PUBLISH STATUS
   Topic: airpollution/status
   ============================================================ */
void publishStatus() {
  String payload = "{";
  payload += "\"deviceId\":\"" + String(device_id) + "\",";
  payload += "\"online\":true,";
  payload += "\"ip\":\"" + WiFi.localIP().toString() + "\",";
  payload += "\"rssi\":"  + String(WiFi.RSSI()) + ",";
  payload += "\"alertLevel\":\"" + alertLevel + "\"";
  payload += "}";

  client.publish(TOPIC_STATUS, payload.c_str(), true);
  Serial.println("📤 Status Sent");
}

/* ============================================================
   SERIAL PRINT
   ============================================================ */
void printSerial() {
  Serial.println();
  Serial.println("========== SENSOR DATA ==========");
  Serial.print("MQ135 Raw: ");   Serial.println(mq135Value);
  Serial.print("MQ2 Raw:   ");   Serial.println(mq2Value);
  Serial.print("Alert Level: "); Serial.println(alertLevel);
  Serial.println("=================================");
}

/* ============================================================
   SETUP
   ============================================================ */
void setup() {
  Serial.begin(115200);
  Serial.println();
  Serial.println("=== AIR POLLUTION MONITOR ===");

  analogSetAttenuation(ADC_11db);

  pinMode(RED_LED,    OUTPUT);
  pinMode(YELLOW_LED, OUTPUT);
  pinMode(GREEN_LED,  OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);

  digitalWrite(RED_LED,    LOW);
  digitalWrite(YELLOW_LED, LOW);
  digitalWrite(GREEN_LED,  LOW);
  digitalWrite(BUZZER_PIN, LOW);
  digitalWrite(YELLOW_LED, HIGH); // Yellow = warming up

  Serial.println("Warming up sensors (60 sec)...");
  for (int i = 60; i > 0; i--) {
    Serial.printf("%d...\n", i);
    delay(1000);
  }

  setup_wifi();

  client.setServer(mqtt_server, mqtt_port);
  client.setBufferSize(512);
  reconnect();

  digitalWrite(YELLOW_LED, LOW);
  digitalWrite(GREEN_LED,  HIGH); // Green = ready
  Serial.println("✅ System Ready");
}

/* ============================================================
   MAIN LOOP
   ============================================================ */
void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    setup_wifi();
  }

  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  unsigned long now = millis();

  if (now - lastMsg > SENSOR_INTERVAL) {
    lastMsg = now;
    readSensors();
    checkAlertLevel();
    publishMQ135();
    publishMQ2();
    printSerial();
  }

  if (now - lastStatus > STATUS_INTERVAL) {
    lastStatus = now;
    publishStatus();
  }
}
