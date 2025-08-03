import { Vector2 } from "./vector2";

export const drawCircle = (
  ctx: CanvasRenderingContext2D,
  center: Vector2,
  radius: number,
  fillColor = "black",
  strokeColor = "black",
  lineWidth = 1,
) => {
  ctx.beginPath();
  ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
  ctx.fillStyle = fillColor;
  ctx.fill();
  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = strokeColor;
  ctx.stroke();
  ctx.closePath();
};

export const drawText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  position: Vector2,
  fontSize = 16,
  color = "black",
  fontFamily = "Arial",
) => {
  ctx.font = `${fontSize}px ${fontFamily}`;
  ctx.fillStyle = color;
  ctx.fillText(text, position.x, position.y);
};
