package kr.io.move.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
public class SensorEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String operator;
    private Long operatorId;
    private String driveStatus;
    private Integer gpsCount;

    private Double lat;        // Double로 변경
    private Double lng;        // Double로 변경

    private java.time.OffsetDateTime time; // OffsetDateTime으로 변경
    private String timeStr;      // 오류/원본 문자열 그대로 저장

    private Double speed;
    private Double heading;
}

