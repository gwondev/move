package kr.io.move.controller;

import kr.io.move.dto.GpsSensor;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class GpsController {
    private final SimpMessagingTemplate messagingTemplate;

    /**
     * 서비스에서 호출해서 클라이언트에게 실시간 데이터 전송
     * @param num 센서 번호
     * @param message 센서 데이터 DTO
     */
    public void sendGps(String num, GpsSensor message) {
        messagingTemplate.convertAndSend(
                "/move/gps/operator/" + num,
                message
        );
    }
}
