import {
  createWebSocket as realCreateWebSocket,
  useWebSocketPing,
  createProcessTurbopackMessage,
} from "next/dist/client/dev/hot-reloader/app/web-socket.js";

export function createWebSocket(assetPrefix, staticIndicatorState) {
  return realCreateWebSocket(assetPrefix, staticIndicatorState);
}
export { useWebSocketPing, createProcessTurbopackMessage };
