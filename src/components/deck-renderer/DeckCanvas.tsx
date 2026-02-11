"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { useDeck } from "@/lib/deck-context";
import { DeckConfig } from "@/types/deck";

type CanvasView = "surface" | "framing";

const PADDING = 40;
const BOARD_GAP = 1; // pixels between boards

/** Map feet to canvas pixels, fitting the deck within the canvas */
function getScale(
  config: DeckConfig,
  canvasWidth: number,
  canvasHeight: number,
): number {
  const maxFeetW =
    config.shape === "wrap-around"
      ? config.dimensions.width + (config.dimensions.extensionDepth ?? 6)
      : config.shape === "l-shape" || config.shape === "t-shape"
        ? Math.max(
            config.dimensions.width,
            (config.dimensions.extensionWidth ?? 0) + config.dimensions.width,
          )
        : config.dimensions.width;

  const maxFeetH =
    config.shape === "l-shape" || config.shape === "t-shape"
      ? config.dimensions.depth + (config.dimensions.extensionDepth ?? 0)
      : config.dimensions.depth;

  const availW = canvasWidth - PADDING * 2;
  const availH = canvasHeight - PADDING * 2;
  return Math.min(availW / maxFeetW, availH / maxFeetH);
}

function drawDeckBoards(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  widthPx: number,
  depthPx: number,
  config: DeckConfig,
  scale: number,
) {
  const boardWidthFt = parseFloat(config.boardWidth) / 12;
  const boardPx = boardWidthFt * scale;

  // Determine board color based on material
  const boardColors: Record<string, string> = {
    "pressure-treated": "#c4a56e",
    cedar: "#d4915e",
    "composite-trex": "#8b7355",
    "composite-timbertech": "#7a6a50",
    "composite-deckorators": "#917b5e",
    "composite-wolf": "#a08868",
    "composite-moistureshield": "#7d6e5a",
  };
  const color = boardColors[config.material] ?? "#c4a56e";

  ctx.save();

  if (config.boardPattern === "diagonal") {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, widthPx, depthPx);
    ctx.clip();

    const maxDim = Math.max(widthPx, depthPx) * 2;
    for (let offset = -maxDim; offset < maxDim; offset += boardPx + BOARD_GAP) {
      ctx.fillStyle = offset % (2 * (boardPx + BOARD_GAP)) < boardPx + BOARD_GAP
        ? color
        : shadeColor(color, -10);
      ctx.beginPath();
      ctx.moveTo(x + offset, y);
      ctx.lineTo(x + offset + boardPx, y);
      ctx.lineTo(x + offset + boardPx - depthPx, y + depthPx);
      ctx.lineTo(x + offset - depthPx, y + depthPx);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  } else {
    // Standard parallel boards (run along the width)
    let posY = y;
    let toggle = false;
    while (posY < y + depthPx - 1) {
      const h = Math.min(boardPx, y + depthPx - posY);
      ctx.fillStyle = toggle ? color : shadeColor(color, -8);
      ctx.fillRect(x, posY, widthPx, h - BOARD_GAP);
      posY += boardPx + BOARD_GAP;
      toggle = !toggle;
    }
  }

  // Outline
  ctx.strokeStyle = "#6b5c4b";
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, widthPx, depthPx);

  ctx.restore();
}

function drawRailing(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  widthPx: number,
  depthPx: number,
  config: DeckConfig,
) {
  if (config.railing === "none") return;

  const railColors: Record<string, string> = {
    wood: "#8B4513",
    cedar: "#b5651d",
    metal: "#333",
    glass: "#88bbdd",
  };

  ctx.strokeStyle = railColors[config.railing] ?? "#333";
  ctx.lineWidth = 4;
  ctx.setLineDash([]);

  // Draw railing on applicable sides
  ctx.beginPath();
  if (!config.ledgerAttached) {
    // top side (house side if attached)
    ctx.moveTo(x, y);
    ctx.lineTo(x + widthPx, y);
  }
  // right side
  ctx.moveTo(x + widthPx, y);
  ctx.lineTo(x + widthPx, y + depthPx);
  // bottom
  ctx.moveTo(x + widthPx, y + depthPx);
  ctx.lineTo(x, y + depthPx);
  // left
  ctx.moveTo(x, y + depthPx);
  ctx.lineTo(x, y);
  ctx.stroke();

  // Draw railing posts as small squares
  ctx.fillStyle = config.railing === "glass" ? "#5599bb" : (railColors[config.railing] ?? "#333");
  const postSpacing = 48; // pixels approx
  const postSize = 6;

  const sides = [
    ...(config.ledgerAttached ? [] : [{ sx: x, sy: y, ex: x + widthPx, ey: y }]),
    { sx: x + widthPx, sy: y, ex: x + widthPx, ey: y + depthPx },
    { sx: x, sy: y + depthPx, ex: x + widthPx, ey: y + depthPx },
    { sx: x, sy: y, ex: x, ey: y + depthPx },
  ];

  for (const side of sides) {
    const dx = side.ex - side.sx;
    const dy = side.ey - side.sy;
    const len = Math.sqrt(dx * dx + dy * dy);
    const count = Math.max(2, Math.floor(len / postSpacing) + 1);
    for (let i = 0; i < count; i++) {
      const t = i / (count - 1);
      const px = side.sx + dx * t;
      const py = side.sy + dy * t;
      ctx.fillRect(px - postSize / 2, py - postSize / 2, postSize, postSize);
    }
  }
}

function drawStairs(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  widthPx: number,
  depthPx: number,
  config: DeckConfig,
  scale: number,
) {
  if (config.stairs.location === "none") return;

  const stairWidthPx = config.stairs.width * scale;
  const stairDepthPx = 3 * scale; // ~3 feet of stair run
  const stepCount = Math.ceil((config.dimensions.height * 12) / 7.5);

  let sx: number, sy: number, sw: number, sh: number;

  switch (config.stairs.location) {
    case "front":
      sx = x + (widthPx - stairWidthPx) / 2;
      sy = y + depthPx;
      sw = stairWidthPx;
      sh = stairDepthPx;
      break;
    case "back":
      sx = x + (widthPx - stairWidthPx) / 2;
      sy = y - stairDepthPx;
      sw = stairWidthPx;
      sh = stairDepthPx;
      break;
    case "left":
      sx = x - stairDepthPx;
      sy = y + (depthPx - stairWidthPx) / 2;
      sw = stairDepthPx;
      sh = stairWidthPx;
      break;
    case "right":
      sx = x + widthPx;
      sy = y + (depthPx - stairWidthPx) / 2;
      sw = stairDepthPx;
      sh = stairWidthPx;
      break;
    default:
      return;
  }

  // Draw stair treads
  const isVertical =
    config.stairs.location === "front" || config.stairs.location === "back";
  ctx.fillStyle = "#b8a080";
  ctx.strokeStyle = "#8b7355";
  ctx.lineWidth = 1;

  for (let i = 0; i < stepCount; i++) {
    const t = i / stepCount;
    if (isVertical) {
      const treadY = sy + t * sh;
      const treadH = sh / stepCount - 1;
      ctx.fillRect(sx, treadY, sw, treadH);
      ctx.strokeRect(sx, treadY, sw, treadH);
    } else {
      const treadX = sx + t * sw;
      const treadW = sw / stepCount - 1;
      ctx.fillRect(treadX, sy, treadW, sh);
      ctx.strokeRect(treadX, sy, treadW, sh);
    }
  }
}

function drawHouseWall(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  widthPx: number,
  config: DeckConfig,
) {
  if (!config.ledgerAttached) return;

  ctx.fillStyle = "#e0ddd5";
  ctx.strokeStyle = "#999";
  ctx.lineWidth = 2;
  const wallHeight = 20;
  ctx.fillRect(x - 10, y - wallHeight, widthPx + 20, wallHeight);
  ctx.strokeRect(x - 10, y - wallHeight, widthPx + 20, wallHeight);

  ctx.fillStyle = "#888";
  ctx.font = "11px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("HOUSE", x + widthPx / 2, y - wallHeight / 2 + 4);
}

function drawDimensionLabels(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  widthPx: number,
  depthPx: number,
  config: DeckConfig,
) {
  ctx.fillStyle = "#444";
  ctx.font = "12px sans-serif";
  ctx.textAlign = "center";

  // Width label (bottom)
  ctx.fillText(
    `${config.dimensions.width}'`,
    x + widthPx / 2,
    y + depthPx + 20,
  );

  // Depth label (right)
  ctx.save();
  ctx.translate(x + widthPx + 20, y + depthPx / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText(`${config.dimensions.depth}'`, 0, 0);
  ctx.restore();
}

// ─── Framing view drawing ────────────────────────────────────────────────────

const JOIST_SPACING_IN = 16; // inches
const POST_SPACING_FT = 6; // feet

function drawFramingView(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  widthPx: number,
  depthPx: number,
  config: DeckConfig,
  scale: number,
) {
  const w = config.dimensions.width;
  const d = config.dimensions.depth;
  const h = config.dimensions.height;

  // Background deck outline
  ctx.fillStyle = "#faf6f0";
  ctx.fillRect(x, y, widthPx, depthPx);
  ctx.strokeStyle = "#bbb";
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, widthPx, depthPx);

  // ── Ledger board ──
  if (config.ledgerAttached) {
    ctx.fillStyle = "#d4a34a";
    ctx.fillRect(x, y, widthPx, 4);
    ctx.fillStyle = "#555";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("LEDGER (2x8)", x + 4, y - 4);
  }

  // ── Beams (horizontal, run along the width) ──
  const beamCount = Math.ceil(d / POST_SPACING_FT) + 1;
  ctx.fillStyle = "#c4873a";
  ctx.strokeStyle = "#8b5e20";
  ctx.lineWidth = 1;

  const beamPositions: number[] = [];
  for (let i = 0; i < beamCount; i++) {
    const beamFt = Math.min(i * POST_SPACING_FT, d);
    const beamY = y + beamFt * scale;
    beamPositions.push(beamY);
    ctx.fillRect(x, beamY - 3, widthPx, 6);
    ctx.strokeRect(x, beamY - 3, widthPx, 6);
  }
  // Always include far edge beam
  if (beamPositions[beamPositions.length - 1] < y + depthPx - 2) {
    beamPositions.push(y + depthPx);
    ctx.fillRect(x, y + depthPx - 3, widthPx, 6);
    ctx.strokeRect(x, y + depthPx - 3, widthPx, 6);
  }

  // Beam label
  ctx.fillStyle = "#8b5e20";
  ctx.font = "10px sans-serif";
  ctx.textAlign = "right";
  ctx.fillText("BEAMS (2x8)", x + widthPx - 4, y + depthPx + 14);

  // ── Joists (vertical, run along depth) ──
  const joistSpacingPx = (JOIST_SPACING_IN / 12) * scale;
  const joistCount = Math.ceil((w * 12) / JOIST_SPACING_IN) + 1;

  ctx.strokeStyle = "#a08050";
  ctx.lineWidth = 2;
  ctx.setLineDash([]);

  for (let i = 0; i < joistCount; i++) {
    const jx = x + Math.min(i * joistSpacingPx, widthPx);
    ctx.beginPath();
    ctx.moveTo(jx, y);
    ctx.lineTo(jx, y + depthPx);
    ctx.stroke();
  }

  // Joist label
  ctx.fillStyle = "#a08050";
  ctx.font = "10px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(`JOISTS @ ${JOIST_SPACING_IN}" O.C.`, x + 4, y + depthPx + 14);

  // ── Support posts (at beam/post intersections) ──
  const postsPerBeam = Math.ceil(w / POST_SPACING_FT) + 1;
  ctx.fillStyle = "#6b4226";

  for (const beamY of beamPositions) {
    // Skip post on ledger line
    if (config.ledgerAttached && Math.abs(beamY - y) < 2) continue;

    for (let j = 0; j < postsPerBeam; j++) {
      const postFt = Math.min(j * POST_SPACING_FT, w);
      const postX = x + postFt * scale;
      ctx.fillRect(postX - 5, beamY - 5, 10, 10);
    }
  }

  // Post label
  ctx.fillStyle = "#6b4226";
  ctx.font = "10px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(
    `POSTS (4x4) — ${h + 2}' long`,
    x + 4,
    y + depthPx + 26,
  );

  // ── Footing indicators (circles under posts) ──
  ctx.strokeStyle = "#999";
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);

  for (const beamY of beamPositions) {
    if (config.ledgerAttached && Math.abs(beamY - y) < 2) continue;
    for (let j = 0; j < postsPerBeam; j++) {
      const postFt = Math.min(j * POST_SPACING_FT, w);
      const postX = x + postFt * scale;
      ctx.beginPath();
      ctx.arc(postX, beamY, 9, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  ctx.setLineDash([]);

  // ── Joist hanger indicators ──
  ctx.fillStyle = "#cc7722";
  ctx.font = "9px sans-serif";
  ctx.textAlign = "center";
  if (config.ledgerAttached) {
    ctx.fillText(
      `${joistCount} joist hangers`,
      x + widthPx / 2,
      y + 14,
    );
  }
}

function shadeColor(color: string, percent: number): string {
  const num = parseInt(color.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, Math.min(255, ((num >> 16) & 0xff) + amt));
  const G = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + amt));
  const B = Math.max(0, Math.min(255, (num & 0xff) + amt));
  return `#${((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1)}`;
}

export default function DeckCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { state } = useDeck();
  const { config } = state;
  const [view, setView] = useState<CanvasView>("surface");

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const parent = canvas.parentElement;
    if (parent) {
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cw = canvas.width;
    const ch = canvas.height;

    // Clear
    ctx.clearRect(0, 0, cw, ch);
    ctx.fillStyle = "#f9fafb";
    ctx.fillRect(0, 0, cw, ch);

    const scale = getScale(config, cw, ch);
    const deckW = config.dimensions.width * scale;
    const deckD = config.dimensions.depth * scale;

    // Center the primary rectangle
    const offsetX = (cw - deckW) / 2;
    const offsetY = (ch - deckD) / 2 + (config.ledgerAttached ? 10 : 0);

    // House wall (both views)
    drawHouseWall(ctx, offsetX, offsetY, deckW, config);

    if (view === "framing") {
      drawFramingView(ctx, offsetX, offsetY, deckW, deckD, config, scale);
    } else {
      // Main deck surface
      drawDeckBoards(ctx, offsetX, offsetY, deckW, deckD, config, scale);

      // Extension sections for L/T/Wrap shapes
      if (
        (config.shape === "l-shape" || config.shape === "t-shape") &&
        config.dimensions.extensionWidth &&
        config.dimensions.extensionDepth
      ) {
        const extW = config.dimensions.extensionWidth * scale;
        const extD = config.dimensions.extensionDepth * scale;
        const extX =
          config.shape === "l-shape"
            ? offsetX + deckW
            : offsetX + (deckW - extW) / 2;
        const extY = offsetX + deckD;

        drawDeckBoards(ctx, extX, extY, extW, extD, config, scale);
      }

      if (config.shape === "wrap-around") {
        const extD = (config.dimensions.extensionDepth ?? 6) * scale;
        drawDeckBoards(
          ctx,
          offsetX + deckW,
          offsetY,
          extD,
          deckD,
          config,
          scale,
        );
      }

      // Railing
      drawRailing(ctx, offsetX, offsetY, deckW, deckD, config);

      // Stairs
      drawStairs(ctx, offsetX, offsetY, deckW, deckD, config, scale);
    }

    // Dimension labels (both views)
    drawDimensionLabels(ctx, offsetX, offsetY, deckW, deckD, config);
  }, [config, view]);

  useEffect(() => {
    draw();
    const handleResize = () => draw();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [draw]);

  return (
    <div className="relative h-full w-full bg-gray-50 rounded-lg">
      <canvas ref={canvasRef} className="h-full w-full" />

      {/* View toggle */}
      <div className="absolute top-2 right-2 flex rounded-md bg-white/90 shadow-sm border border-gray-200 text-xs overflow-hidden">
        <button
          onClick={() => setView("surface")}
          className={`px-3 py-1.5 font-medium transition-colors ${
            view === "surface"
              ? "bg-blue-600 text-white"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          Surface
        </button>
        <button
          onClick={() => setView("framing")}
          className={`px-3 py-1.5 font-medium transition-colors ${
            view === "framing"
              ? "bg-blue-600 text-white"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          Framing
        </button>
      </div>

      <div className="absolute bottom-2 right-2 rounded bg-white/80 px-2 py-1 text-xs text-gray-400">
        {view === "surface" ? "2D Preview" : "Framing Layout"}
      </div>
    </div>
  );
}
