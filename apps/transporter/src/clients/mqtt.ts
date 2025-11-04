import mqtt from "mqtt";

export const mqttClient = mqtt.connect({
  forceNativeWebSocket: true,
  protocol: "wss",
  host: Bun.env.MQTT_HOST,
  port: Number(Bun.env.MQTT_PORT),
  username: Bun.env.MQTT_USERNAME,
  password: Bun.env.MQTT_PASSWORD,
});
