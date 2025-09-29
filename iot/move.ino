#define TINY_GSM_MODEM_SIM7000
#include <TinyGsmClient.h>
#include <PubSubClient.h>

// --- 핀맵 ---
#define TX1 27
#define RX1 26
#define PWR 23
#define RST 5
#define PWRKEY 4
#define RX2 16
#define TX2 17

const char APN[] = "iot.1nce.net";

// ---- 디바이스 ID ----
int id = 1;
String operatorName = "gwon";
int operatorId = 1;

// ----Client ID 설정 ----
String clientId = String(id);

// --- MQTT ---
const char* broker = "gwon.my";
const int   brokerPort = 1883;

// 토픽 구성
String topicStr = String("move/gps/") + operatorName + "/" + String(operatorId);
const char* topic = topicStr.c_str();

TinyGsm modem(Serial1);
TinyGsmClient netClient(modem);
PubSubClient mqtt(netClient);

void setup() {
  Serial.begin(115200);
  Serial1.begin(9600, SERIAL_8N1, RX1, TX1);
  mqtt.setServer(broker, brokerPort);

  powerOn();
  checkModem();   // 모뎀 연결상태 체크
  // ---- 절전 강제 해제 ----
  modem.sendAT("+CPSMS=0");   // PSM 해제
  modem.waitResponse();
  modem.sendAT("+CEDRXS=0");  // eDRX 해제
  modem.waitResponse();
  
}

void loop() {
  if (!mqtt.connected()) {
    mqtt.connect(clientId.c_str()); // 지속 재연결 시도
  }

  // GPS는 항상 읽어서 publish 시도
  readAndPublishGps();

  mqtt.loop();
}
