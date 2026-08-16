export function healthcheckResponse(mqttConnected: boolean): Response {
  if (!mqttConnected) {
    return Response.json(
      { status: "unhealthy", mqtt: "disconnected" },
      { status: 503 },
    );
  }

  return Response.json({ status: "ok", mqtt: "connected" });
}
