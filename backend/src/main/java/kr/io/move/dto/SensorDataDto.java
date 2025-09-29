package kr.io.move.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.OffsetDateTime;

@Getter
@Setter
public class SensorDataDto {
    private Long id;
    private String operatorName;
    private Long operatorId;
    private String driveStatus;
    private Integer gpsCount;
    private Double lat;
    private Double lng;
    private String timeStamp;
    private Double speed;
    private Double heading;

}

