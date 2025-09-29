// ---- 전역 변수 ----
unsigned long lastSend = 0;
unsigned long sendInterval = 1000;
unsigned long gpsCount = 0;
String driveStatus = "ERROR";
unsigned long stopStart = 0;
int driveCandidate = 0; // DRIVE 전환 카운트

// 직전 유효 값 저장
double lastLat = 0.0, lastLon = 0.0, lastSpd = 0.0, lastCog = 0.0;
String lastTimeStr = "ERROR";

// ---- 더미 데이터 구조 ----
struct DummyGps {
  int id;
  const char* opName;
  int opId;
  double lat;
  double lon;
};

// ---- 더미 데이터 ----
DummyGps dummyData[] = {
  {0, "gwon",   0, 35.1496765065133, 126.93449140679003}, // 테스트 모듈 1 이며 법원주소 
  {1, "gwon",   1, 35.148555144919385, 126.93605064046804}, // 테스트 모듈 2 이며 부영빌 주소
  {2, "chosun", 0, 35.14033981123631, 126.93715711819085}, // 조선대 산 랜덤주소
  {3, "chosun", 1, 35.1378794376297, 126.9378283471965}, //조선대 산 부근 랜덤주소
  {4, "jang",   0, 35.185479, 126.867583} // 장애인 종합복지관 주소
};

// ---- 보조 함수: 월별 일수 계산 ----
int daysInMonth(int year, int month) {
  if (month == 1 || month == 3 || month == 5 || month == 7 ||
      month == 8 || month == 10 || month == 12) return 31;
  if (month == 4 || month == 6 || month == 9 || month == 11) return 30;
  if ((year % 4 == 0 && year % 100 != 0) || (year % 400 == 0)) return 29;
  return 28;
}

// ---- GPS 읽기 + 전송 ----
void readAndPublishGps() {
  double lat = lastLat, lon = lastLon, spd = lastSpd, cog = lastCog;
  String timeStr = lastTimeStr;

  modem.sendAT("+CGNSINF");
  if (modem.waitResponse(2000, "+CGNSINF:") == 1) {
    String s = modem.stream.readStringUntil('\n');
    s.trim();
    modem.waitResponse();

    const int MAXF = 40;
    String tok[MAXF]; int t=0, st=0;
    for (int i=0; i<=s.length(); i++) {
      if (i==s.length() || s[i]==',') {
        if (t<MAXF) tok[t++] = s.substring(st, i);
        st = i + 1;
      }
    }

    if (t >= 8) {
      int runStatus = tok[0].toInt();
      int fixStatus = tok[1].toInt();

      if (runStatus == 1 && fixStatus == 1) {
        // ✅ 위성 잡힘 → 값 갱신
        lat = tok[3].toDouble();
        lon = tok[4].toDouble();
        spd = tok[6].toDouble();
        cog = tok[7].toDouble();

        if (tok[2].length() >= 14) {
          int y = tok[2].substring(0,4).toInt();
          int M = tok[2].substring(4,6).toInt();
          int d = tok[2].substring(6,8).toInt();
          int h = tok[2].substring(8,10).toInt();
          int m = tok[2].substring(10,12).toInt();
          int sec = tok[2].substring(12,14).toInt();

          // ✅ UTC → KST
          h += 9;
          if (h >= 24) {
            h -= 24; d++;
            if (d > daysInMonth(y, M)) { d = 1; M++; if (M > 12) { M = 1; y++; } }
          }

          char buf[30];
          sprintf(buf, "%04d-%02d-%02dT%02d:%02d:%02d+09:00", y, M, d, h, m, sec);
          timeStr = String(buf);
        }

        // --- 상태 판정 ---
        if (spd > 0.1) {
          driveCandidate++;
          if (driveCandidate >= 3) { // 3번 연속 speed>0 → DRIVE
            driveStatus = "DRIVE";
            sendInterval = 1000;
            stopStart = 0;
            driveCandidate = 0;
          }
        } else {
          driveCandidate = 0;
          if (driveStatus != "STOP" && driveStatus != "PARKING") {
            stopStart = millis();
          }
          if (stopStart > 0 && (millis() - stopStart >= 300000)) {
            driveStatus = "PARKING";
            sendInterval = 600000; // 10분
          } else {
            driveStatus = "STOP";
            sendInterval = 1000;   // STOP도 1초
          }
        }

      } else {
        driveStatus = "ERROR";
        sendInterval = 60000;
      }

      lastLat = lat; lastLon = lon; lastSpd = spd; lastCog = cog; lastTimeStr = timeStr;
    } else {
      driveStatus = "ERROR";
      sendInterval = 60000;
    }
  } else {
    driveStatus = "ERROR";
    sendInterval = 60000;
  }

  // --- 무조건 전송 ---
  unsigned long now = millis();
  if (now - lastSend >= sendInterval) {
    gpsCount++;

    // 🚨 ERROR 상태 → 더미 좌표 대체
    if (driveStatus == "ERROR") {
      for (DummyGps d : dummyData) {
        if (d.id == id && d.opId == operatorId && operatorName == d.opName) {
          lat = d.lat;
          lon = d.lon;
        }
      }
    }

    String payload = "{";
    payload += "\"id\":" + String(id) + ",";
    payload += "\"operatorName\":\"" + operatorName + "\",";
    payload += "\"operatorId\":" + String(operatorId) + ",";
    payload += "\"driveStatus\":\"" + driveStatus + "\",";
    payload += "\"gpsCount\":" + String(gpsCount) + ",";
    payload += "\"lat\":\"" + String(lat, 6) + "\",";
    payload += "\"lng\":\"" + String(lon, 6) + "\",";
    payload += "\"timeStamp\":\"" + lastTimeStr + "\",";
    payload += "\"speed\":" + String(spd, 2) + ",";
    payload += "\"heading\":" + String(cog, 2);
    payload += "}";

    mqtt.publish(topic, payload.c_str());
    Serial.println(payload);

    lastSend = now;
  }
}
