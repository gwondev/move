package kr.io.move.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
// 센서로부터 받아올 데이터들
public class GpsSensor {
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
