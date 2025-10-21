// ---- 전원 켜기 ----
void powerOn() {
  pinMode(PWR, OUTPUT); digitalWrite(PWR, HIGH);
  pinMode(RST, OUTPUT); digitalWrite(RST, HIGH);
  pinMode(PWRKEY, OUTPUT);
  digitalWrite(PWRKEY, LOW); delay(100);
  digitalWrite(PWRKEY, HIGH); delay(1500);
  digitalWrite(PWRKEY, LOW); delay(100);
}

// ---- attach 대기 -----
bool waitAttach(uint32_t ms) {
  unsigned long t = millis();
  while (millis() - t < ms) {
    modem.sendAT("+CGATT?");
    if (modem.waitResponse(1000, "1") == 1) return true; // 망에 attach 됨
    delay(500);
  }
  return false;
}

// ---- 모뎀/네트워크 기본 체크 ----
void checkModem() {
  Serial.print("[1] AT... ");
  if (!modem.testAT()) Serial.println("FAIL"); else Serial.println("OK");

  modem.sendAT("+CMEE=2"); modem.waitResponse();

  Serial.print("[2] Restart... ");
  if (!modem.restart()) Serial.println("WARN"); else Serial.println("OK");

  Serial.print("[3] SIM... ");
  modem.sendAT("+CPIN?");
  if (modem.waitResponse(2000,"READY") != 1) Serial.println("FAIL"); else Serial.println("OK");

  Serial.print("[4] Attach(LTE-M)... ");
  if (!waitAttach(60000)) Serial.println("FAIL"); else Serial.println("OK");

  Serial.print("[5] APN connect... ");
  if (!modem.gprsConnect(APN)) Serial.println("FAIL"); else {
    Serial.println("OK");
    Serial.print("IP="); Serial.println(modem.localIP());
  }

  Serial.print("[6] MQTT connect... ");
  if (mqtt.connect("1")) {
    Serial.println("OK");
  } else {
    Serial.print("FAIL rc=");
    Serial.println(mqtt.state());  // 상태 코드 출력
  }

  // GNSS 전원 ON
  modem.sendAT("+CGNSPWR=1");
  modem.waitResponse();
  modem.sendAT("+CGNSSEQ=RMC");
  modem.waitResponse();
}
