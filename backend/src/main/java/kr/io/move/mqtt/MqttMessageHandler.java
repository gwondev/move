package kr.io.move.mqtt;

import kr.io.move.service.SensorService;
import org.springframework.integration.annotation.ServiceActivator;
import org.springframework.messaging.Message;
import org.springframework.stereotype.Component;

@Component
public class MqttMessageHandler {

    private final SensorService sensorService;

    public MqttMessageHandler(SensorService sensorService) {
        this.sensorService = sensorService;
    }

    @ServiceActivator(inputChannel = "mqttInputChannel")
    public void handleMessage(Message<?> message) {
        String payload = message.getPayload().toString();
        System.out.println("MQTT 수신 메시지: " + payload); // 로그 출력
        sensorService.processSensorData(payload); // 서비스 계층으로 위임
    }
}

