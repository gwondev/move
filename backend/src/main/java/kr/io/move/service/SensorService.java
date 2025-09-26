package kr.io.move.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import kr.io.move.controller.GpsController;
import kr.io.move.dto.GpsSensor;
import kr.io.move.entity.SensorEntity;
import kr.io.move.repository.SensorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.OffsetDateTime;
import java.time.format.DateTimeParseException;

@Service
@RequiredArgsConstructor
public class SensorService {

    private final SensorRepository sensorRepository;
    private final GpsController gpsController;
    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    public void processSensorData(String payload) {
        try {
            // JSON → DTO
            GpsSensor dto = objectMapper.readValue(payload, GpsSensor.class);

            // DTO → Entity 변환
            SensorEntity entity = new SensorEntity();
            entity.setOperator(dto.getOperator());
            entity.setOperatorId(dto.getOperatorId());
            entity.setDriveStatus(dto.getDriveStatus());
            entity.setGpsCount(dto.getGpsCount());
            entity.setLat(dto.getLat());
            entity.setLng(dto.getLng());

            // time 처리
            OffsetDateTime timestamp = null;
            try {
                timestamp = OffsetDateTime.parse(dto.getTimeStamp());
                entity.setTime(timestamp);
                entity.setTimeStr(dto.getTimeStamp());
            } catch (DateTimeParseException e) {
                System.err.println("잘못된 시간 값: " + dto.getTimeStamp());
                entity.setTime(null);       // 유효하지 않으면 null
                entity.setTimeStr(dto.getTimeStamp()); // 원본 문자열 저장
            }

            entity.setSpeed(dto.getSpeed());
            entity.setHeading(dto.getHeading());

            // DB 저장
            sensorRepository.save(entity);

            // WebSocket 전송
            gpsController.sendGps(String.valueOf(dto.getId()), dto);

            // 로그 확인용
            System.out.println("📤 WebSocket Broadcast to /move/gps/operator/" 
            + dto.getId() + " : " + dto);

        } catch (Exception e) {
            e.printStackTrace();
            System.err.println("MQTT 메시지 처리 중 오류: " + e.getMessage());
        }
    }
}
