"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { useDeck } from "@/lib/deck-context";
import { DeckConfig } from "@/types/deck";

type CanvasView = "surface" | "framing" | "elevation" | "isometric";

const PADDING = 40;
const BOARD_GAP = 1;

// ─── Pan / Zoom state ────────────────────────────────────────────────────────

interface Camera {
  x: number;
  y: number;
  zoom: number;
  rotationAngle: number;
}

// ─── Shared helpers ──────────────────────────────────────────────────────────

function getScale(config: DeckConfig, cw: number, ch: number): number {
  const maxFeetW =
    config.shape === "wrap-around"
      ? config.dimensions.width + (config.dimensions.extensionDepth ?? 6)
      : config.shape === "l-shape" || config.shape === "t-shape"
        ? Math.max(config.dimensions.width, (config.dimensions.extensionWidth ?? 0) + config.dimensions.width)
        : config.dimensions.width;
  const maxFeetH =
    config.shape === "l-shape" || config.shape === "t-shape"
      ? config.dimensions.depth + (config.dimensions.extensionDepth ?? 0)
      : config.dimensions.depth;
  const availW = cw - PADDING * 2;
  const availH = ch - PADDING * 2;
  return Math.min(availW / maxFeetW, availH / maxFeetH);
}

function shadeColor(color: string, percent: number): string {
  const num = parseInt(color.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, Math.min(255, ((num >> 16) & 0xff) + amt));
  const G = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + amt));
  const B = Math.max(0, Math.min(255, (num & 0xff) + amt));
  return `#${((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1)}`;
}

const BOARD_COLORS: Record<string, string> = {
  "pressure-treated": "#c4a56e",
  cedar: "#d4915e",
  "composite-trex": "#8b7355",
  "composite-timbertech": "#7a6a50",
  "composite-deckorators": "#917b5e",
  "composite-wolf": "#a08868",
  "composite-moistureshield": "#7d6e5a",
};

const RAIL_COLORS: Record<string, string> = {
  wood: "#8B4513",
  cedar: "#b5651d",
  metal: "#333",
  glass: "#88bbdd",
};

const FACADE_BASE_COLORS: Record<string, string> = {
  vinyl: "#d5d0c8",
  brick: "#b46a4d",
  stone: "#a8a49d",
  stucco: "#d8cfbf",
  wood: "#9c7a5d",
};

function facadeColor(config: DeckConfig): string {
  return config.houseColor || FACADE_BASE_COLORS[config.exteriorFacade] || "#d5d0c8";
}

// ─── Surface (top-down) view ─────────────────────────────────────────────────

function drawDeckBoards(ctx: CanvasRenderingContext2D, x: number, y: number, wPx: number, dPx: number, config: DeckConfig, scale: number) {
  const boardPx = (parseFloat(config.boardWidth) / 12) * scale;
  const color = BOARD_COLORS[config.material] ?? "#c4a56e";
  ctx.save();
  if (config.boardPattern === "diagonal") {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, wPx, dPx);
    ctx.clip();
    const maxDim = Math.max(wPx, dPx) * 2;
    for (let off = -maxDim; off < maxDim; off += boardPx + BOARD_GAP) {
      ctx.fillStyle = off % (2 * (boardPx + BOARD_GAP)) < boardPx + BOARD_GAP ? color : shadeColor(color, -10);
      ctx.beginPath();
      ctx.moveTo(x + off, y);
      ctx.lineTo(x + off + boardPx, y);
      ctx.lineTo(x + off + boardPx - dPx, y + dPx);
      ctx.lineTo(x + off - dPx, y + dPx);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  } else {
    let posY = y;
    let toggle = false;
    while (posY < y + dPx - 1) {
      const h = Math.min(boardPx, y + dPx - posY);
      ctx.fillStyle = toggle ? color : shadeColor(color, -8);
      ctx.fillRect(x, posY, wPx, h - BOARD_GAP);
      posY += boardPx + BOARD_GAP;
      toggle = !toggle;
    }
  }
  ctx.strokeStyle = "#6b5c4b";
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, wPx, dPx);
  ctx.restore();
}

function drawRailing2D(ctx: CanvasRenderingContext2D, x: number, y: number, wPx: number, dPx: number, config: DeckConfig) {
  if (config.railing === "none") return;
  ctx.strokeStyle = RAIL_COLORS[config.railing] ?? "#333";
  ctx.lineWidth = 4;
  ctx.setLineDash([]);
  ctx.beginPath();
  if (!config.ledgerAttached) { ctx.moveTo(x, y); ctx.lineTo(x + wPx, y); }
  ctx.moveTo(x + wPx, y); ctx.lineTo(x + wPx, y + dPx);
  ctx.moveTo(x + wPx, y + dPx); ctx.lineTo(x, y + dPx);
  ctx.moveTo(x, y + dPx); ctx.lineTo(x, y);
  ctx.stroke();
  ctx.fillStyle = config.railing === "glass" ? "#5599bb" : (RAIL_COLORS[config.railing] ?? "#333");
  const ps = 48, sz = 6;
  const sides = [
    ...(config.ledgerAttached ? [] : [{ sx: x, sy: y, ex: x + wPx, ey: y }]),
    { sx: x + wPx, sy: y, ex: x + wPx, ey: y + dPx },
    { sx: x, sy: y + dPx, ex: x + wPx, ey: y + dPx },
    { sx: x, sy: y, ex: x, ey: y + dPx },
  ];
  for (const s of sides) {
    const dx = s.ex - s.sx, dy = s.ey - s.sy;
    const len = Math.sqrt(dx * dx + dy * dy);
    const cnt = Math.max(2, Math.floor(len / ps) + 1);
    for (let i = 0; i < cnt; i++) {
      const t = i / (cnt - 1);
      ctx.fillRect(s.sx + dx * t - sz / 2, s.sy + dy * t - sz / 2, sz, sz);
    }
  }
}

function drawStairs2D(ctx: CanvasRenderingContext2D, x: number, y: number, wPx: number, dPx: number, config: DeckConfig, scale: number) {
  if (config.stairs.location === "none") return;
  const stairWPx = config.stairs.width * scale;
  const stairDPx = 3 * scale;
  const stepCount = Math.ceil((config.dimensions.height * 12) / 7.5);
  let sx: number, sy: number, sw: number, sh: number;
  switch (config.stairs.location) {
    case "front": sx = x + (wPx - stairWPx) / 2; sy = y + dPx; sw = stairWPx; sh = stairDPx; break;
    case "back": sx = x + (wPx - stairWPx) / 2; sy = y - stairDPx; sw = stairWPx; sh = stairDPx; break;
    case "left": sx = x - stairDPx; sy = y + (dPx - stairWPx) / 2; sw = stairDPx; sh = stairWPx; break;
    case "right": sx = x + wPx; sy = y + (dPx - stairWPx) / 2; sw = stairDPx; sh = stairWPx; break;
    default: return;
  }
  const isV = config.stairs.location === "front" || config.stairs.location === "back";
  ctx.fillStyle = "#b8a080"; ctx.strokeStyle = "#8b7355"; ctx.lineWidth = 1;
  for (let i = 0; i < stepCount; i++) {
    const t = i / stepCount;
    if (isV) { const tY = sy + t * sh, tH = sh / stepCount - 1; ctx.fillRect(sx, tY, sw, tH); ctx.strokeRect(sx, tY, sw, tH); }
    else { const tX = sx + t * sw, tW = sw / stepCount - 1; ctx.fillRect(tX, sy, tW, sh); ctx.strokeRect(tX, sy, tW, sh); }
  }
}

function drawHouseWall(ctx: CanvasRenderingContext2D, x: number, y: number, wPx: number, config: DeckConfig) {
  if (!config.ledgerAttached || !config.hasHouse) return;
  ctx.fillStyle = facadeColor(config); ctx.strokeStyle = "#999"; ctx.lineWidth = 2;
  const wh = 20;
  ctx.fillRect(x - 10, y - wh, wPx + 20, wh);
  ctx.strokeRect(x - 10, y - wh, wPx + 20, wh);
  ctx.fillStyle = "#888"; ctx.font = "11px sans-serif"; ctx.textAlign = "center";
  ctx.fillText("HOUSE", x + wPx / 2, y - wh / 2 + 4);
}

function drawDimLabels(ctx: CanvasRenderingContext2D, x: number, y: number, wPx: number, dPx: number, config: DeckConfig) {
  ctx.fillStyle = "#444"; ctx.font = "12px sans-serif"; ctx.textAlign = "center";
  ctx.fillText(`${config.dimensions.width}'`, x + wPx / 2, y + dPx + 20);
  ctx.save();
  ctx.translate(x + wPx + 20, y + dPx / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText(`${config.dimensions.depth}'`, 0, 0);
  ctx.restore();
}

// ─── Framing view ────────────────────────────────────────────────────────────

function drawFramingView(ctx: CanvasRenderingContext2D, x: number, y: number, wPx: number, dPx: number, config: DeckConfig, scale: number) {
  const w = config.dimensions.width, d = config.dimensions.depth, h = config.dimensions.height;
  const isFlush = config.beamType === "flush";
  ctx.fillStyle = "#faf6f0"; ctx.fillRect(x, y, wPx, dPx);
  ctx.strokeStyle = "#bbb"; ctx.lineWidth = 1; ctx.strokeRect(x, y, wPx, dPx);
  if (config.ledgerAttached) {
    ctx.fillStyle = "#d4a34a"; ctx.fillRect(x, y, wPx, 4);
    ctx.fillStyle = "#555"; ctx.font = "10px sans-serif"; ctx.textAlign = "left";
    ctx.fillText("LEDGER (2x8)", x + 4, y - 4);
  }
  const beamCount = Math.ceil(d / 6) + 1;
  ctx.fillStyle = isFlush ? "#9b6b3a" : "#c4873a";
  ctx.strokeStyle = "#8b5e20"; ctx.lineWidth = 1;
  const beamPositions: number[] = [];
  for (let i = 0; i < beamCount; i++) {
    const bFt = Math.min(i * 6, d), bY = y + bFt * scale;
    beamPositions.push(bY);
    if (isFlush) { ctx.setLineDash([6, 4]); ctx.strokeRect(x, bY - 3, wPx, 6); ctx.setLineDash([]); }
    else { ctx.fillRect(x, bY - 3, wPx, 6); ctx.strokeRect(x, bY - 3, wPx, 6); }
  }
  if (beamPositions[beamPositions.length - 1] < y + dPx - 2) {
    beamPositions.push(y + dPx);
    if (isFlush) { ctx.setLineDash([6, 4]); ctx.strokeRect(x, y + dPx - 3, wPx, 6); ctx.setLineDash([]); }
    else { ctx.fillRect(x, y + dPx - 3, wPx, 6); ctx.strokeRect(x, y + dPx - 3, wPx, 6); }
  }
  ctx.fillStyle = "#8b5e20"; ctx.font = "10px sans-serif"; ctx.textAlign = "right";
  ctx.fillText(isFlush ? "ENG. BEAMS (LVL) — FLUSH" : "BEAMS (2x8)", x + wPx - 4, y + dPx + 14);

  const joistSpPx = (16 / 12) * scale;
  const joistCount = Math.ceil((w * 12) / 16) + 1;
  ctx.strokeStyle = "#a08050"; ctx.lineWidth = 2; ctx.setLineDash([]);
  for (let i = 0; i < joistCount; i++) {
    const jx = x + Math.min(i * joistSpPx, wPx);
    ctx.beginPath(); ctx.moveTo(jx, y); ctx.lineTo(jx, y + dPx); ctx.stroke();
  }
  ctx.fillStyle = "#a08050"; ctx.font = "10px sans-serif"; ctx.textAlign = "left";
  ctx.fillText('JOISTS @ 16" O.C.', x + 4, y + dPx + 14);

  const ppb = Math.ceil(w / 6) + 1;
  ctx.fillStyle = "#6b4226";
  for (const bY of beamPositions) {
    if (config.ledgerAttached && Math.abs(bY - y) < 2) continue;
    for (let j = 0; j < ppb; j++) {
      const pX = x + Math.min(j * 6, w) * scale;
      ctx.fillRect(pX - 5, bY - 5, 10, 10);
    }
  }
  ctx.fillStyle = "#6b4226"; ctx.font = "10px sans-serif"; ctx.textAlign = "left";
  ctx.fillText(`POSTS (4x4) — ${h + 2}' long`, x + 4, y + dPx + 26);

  ctx.strokeStyle = "#999"; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
  for (const bY of beamPositions) {
    if (config.ledgerAttached && Math.abs(bY - y) < 2) continue;
    for (let j = 0; j < ppb; j++) {
      const pX = x + Math.min(j * 6, w) * scale;
      ctx.beginPath(); ctx.arc(pX, bY, 9, 0, Math.PI * 2); ctx.stroke();
    }
  }
  ctx.setLineDash([]);

  if (config.ledgerAttached) {
    ctx.fillStyle = "#cc7722"; ctx.font = "9px sans-serif"; ctx.textAlign = "center";
    ctx.fillText(`${joistCount} joist hangers`, x + wPx / 2, y + 14);
  }
}

// ─── Elevation (side) view ───────────────────────────────────────────────────

function drawElevationView(ctx: CanvasRenderingContext2D, cw: number, ch: number, config: DeckConfig) {
  const w = config.dimensions.width;
  const h = config.dimensions.height;
  const railH = config.railing !== "none" ? 3 : 0; // 3ft railing height (36")
  const totalVisualH = h + railH + 1; // +1 for ground clearance
  const maxW = w + 4; // padding for stairs

  const scaleX = (cw - PADDING * 2) / maxW;
  const scaleY = (ch - PADDING * 2) / totalVisualH;
  const scale = Math.min(scaleX, scaleY);

  const deckWPx = w * scale;
  const deckHPx = h * scale;
  const railHPx = railH * scale;
  const deckThickness = 8; // px for deck surface thickness

  // Position: center horizontally, anchor to bottom
  const ox = (cw - deckWPx) / 2;
  const groundY = ch - PADDING;
  const deckTopY = groundY - deckHPx;

  // ── Ground line ──
  ctx.strokeStyle = "#8a7a5a";
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.moveTo(PADDING / 2, groundY);
  ctx.lineTo(cw - PADDING / 2, groundY);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "#8a7a5a"; ctx.font = "10px sans-serif"; ctx.textAlign = "right";
  ctx.fillText("GRADE", ox - 8, groundY + 4);

  // ── House wall (if ledger attached) ──
  if (config.ledgerAttached && config.hasHouse) {
    const wallH = deckHPx + railHPx + 40;
    ctx.fillStyle = facadeColor(config);
    ctx.strokeStyle = "#999";
    ctx.lineWidth = 2;
    ctx.fillRect(ox - 12, deckTopY - railHPx - 20, 12, wallH);
    ctx.strokeRect(ox - 12, deckTopY - railHPx - 20, 12, wallH);
    ctx.fillStyle = "#888"; ctx.font = "9px sans-serif"; ctx.textAlign = "center";
    ctx.save();
    ctx.translate(ox - 6, deckTopY);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("HOUSE", 0, 0);
    ctx.restore();
  }

  // ── Support posts ──
  const postSpacing = 6;
  const postCount = Math.ceil(w / postSpacing) + 1;
  ctx.fillStyle = "#6b4226";
  for (let i = 0; i < postCount; i++) {
    const px = ox + Math.min(i * postSpacing, w) * scale;
    if (config.ledgerAttached && i === 0) continue;
    const postW = 6;
    ctx.fillRect(px - postW / 2, deckTopY, postW, deckHPx);
    // Footing
    ctx.fillStyle = "#999";
    ctx.fillRect(px - 10, groundY - 4, 20, 8);
    ctx.fillStyle = "#6b4226";
  }

  // ── Beam ──
  const isFlush = config.beamType === "flush";
  const beamY = isFlush ? deckTopY : deckTopY + deckThickness;
  const beamH = 6;
  ctx.fillStyle = isFlush ? "#9b6b3a" : "#c4873a";
  ctx.fillRect(ox, beamY, deckWPx, beamH);
  ctx.strokeStyle = "#8b5e20"; ctx.lineWidth = 1;
  ctx.strokeRect(ox, beamY, deckWPx, beamH);

  // Beam label
  ctx.fillStyle = "#8b5e20"; ctx.font = "9px sans-serif"; ctx.textAlign = "left";
  ctx.fillText(isFlush ? "ENG. BEAM (FLUSH)" : "BEAM (DROPPED)", ox + deckWPx + 8, beamY + beamH / 2 + 3);

  // ── Deck surface ──
  const surfColor = BOARD_COLORS[config.material] ?? "#c4a56e";
  ctx.fillStyle = surfColor;
  ctx.fillRect(ox, deckTopY - deckThickness, deckWPx, deckThickness);
  ctx.strokeStyle = "#6b5c4b"; ctx.lineWidth = 1;
  ctx.strokeRect(ox, deckTopY - deckThickness, deckWPx, deckThickness);

  // Joist lines (cross-section hatching)
  ctx.strokeStyle = "#a08050"; ctx.lineWidth = 1;
  const joistSp = (16 / 12) * scale;
  for (let i = 0; i < Math.ceil((w * 12) / 16) + 1; i++) {
    const jx = ox + Math.min(i * joistSp, deckWPx);
    ctx.beginPath();
    ctx.moveTo(jx, deckTopY - deckThickness);
    ctx.lineTo(jx, deckTopY - deckThickness - 2);
    ctx.stroke();
  }

  // ── Railing ──
  if (config.railing !== "none") {
    const railColor = RAIL_COLORS[config.railing] ?? "#333";
    const railTopY = deckTopY - deckThickness - railHPx;

    // Left post
    ctx.fillStyle = railColor;
    ctx.fillRect(ox - 2, railTopY, 4, railHPx);
    // Right post
    ctx.fillRect(ox + deckWPx - 2, railTopY, 4, railHPx);

    // Intermediate posts
    const railPostSp = 4; // feet
    const railPostCount = Math.ceil(w / railPostSp);
    for (let i = 1; i < railPostCount; i++) {
      const rpx = ox + i * railPostSp * scale;
      ctx.fillRect(rpx - 2, railTopY, 4, railHPx);
    }

    // Top rail
    ctx.fillStyle = shadeColor(railColor, 10);
    ctx.fillRect(ox, railTopY, deckWPx, 4);

    // Balusters (thin vertical lines)
    ctx.strokeStyle = railColor;
    ctx.lineWidth = 1;
    const balSpPx = 4 * scale / 12; // ~4" baluster spacing
    const balSp = Math.max(balSpPx, 4); // min 4px apart
    for (let bx = ox + balSp; bx < ox + deckWPx - 2; bx += balSp) {
      ctx.beginPath();
      ctx.moveTo(bx, railTopY + 4);
      ctx.lineTo(bx, deckTopY - deckThickness);
      ctx.stroke();
    }

    // Railing height label
    ctx.fillStyle = "#444"; ctx.font = "10px sans-serif"; ctx.textAlign = "left";
    ctx.fillText(`${railH * 12}"`, ox + deckWPx + 8, railTopY + railHPx / 2 + 3);
  }

  // ── Stairs ──
  if (config.stairs.location !== "none") {
    const stepCount = Math.ceil((h * 12) / 7.5);
    const stairRun = stepCount * 0.85; // ~10" run each
    const stairWPx = stairRun * scale;
    const sx = ox + deckWPx + 4;

    for (let i = 0; i < stepCount; i++) {
      const stepY = deckTopY + (i * deckHPx) / stepCount;
      const stepX = sx + (i * stairWPx) / stepCount;
      const stepW = stairWPx / stepCount;
      const stepH = deckHPx / stepCount;
      ctx.fillStyle = "#b8a080";
      ctx.fillRect(stepX, stepY, stepW, stepH);
      ctx.strokeStyle = "#8b7355"; ctx.lineWidth = 1;
      ctx.strokeRect(stepX, stepY, stepW, stepH);
    }
  }

  // ── Height dimension ──
  ctx.strokeStyle = "#666"; ctx.lineWidth = 1;
  const dimX = ox - (config.ledgerAttached ? 28 : 16);
  ctx.beginPath();
  ctx.moveTo(dimX, deckTopY - deckThickness);
  ctx.lineTo(dimX, groundY);
  ctx.stroke();
  ctx.beginPath(); ctx.moveTo(dimX - 4, deckTopY - deckThickness); ctx.lineTo(dimX + 4, deckTopY - deckThickness); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(dimX - 4, groundY); ctx.lineTo(dimX + 4, groundY); ctx.stroke();
  ctx.fillStyle = "#444"; ctx.font = "11px sans-serif"; ctx.textAlign = "center";
  ctx.save();
  ctx.translate(dimX - 8, (deckTopY - deckThickness + groundY) / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText(`${h}'`, 0, 0);
  ctx.restore();

  // Width label
  ctx.fillStyle = "#444"; ctx.font = "11px sans-serif"; ctx.textAlign = "center";
  ctx.fillText(`${w}'`, ox + deckWPx / 2, deckTopY - deckThickness - railHPx - 14);
}

// ─── Isometric (2.5D) view ───────────────────────────────────────────────────

function isoProject(x: number, y: number, z: number, scale: number, rotationAngle: number): [number, number] {
  const rotation = (rotationAngle * Math.PI) / 180;
  const rx = x * Math.cos(rotation) - y * Math.sin(rotation);
  const ry = x * Math.sin(rotation) + y * Math.cos(rotation);
  const ix = (rx - ry) * Math.cos(Math.PI / 6) * scale;
  const iy = (rx + ry) * Math.sin(Math.PI / 6) * scale - z * scale;
  return [ix, iy];
}

function drawIsoView(ctx: CanvasRenderingContext2D, cw: number, ch: number, config: DeckConfig, rotationAngle: number) {
  const w = config.dimensions.width;
  const d = config.dimensions.depth;
  const h = config.dimensions.height;
  const railH = config.railing !== "none" ? 3 : 0;
  const stairCount = Math.ceil((h * 12) / 7.5);
  const stairRun = config.stairs.location === "none" ? 0 : Math.max(3, stairCount * 0.85);

  let stairMinX = 0;
  let stairMaxX = w;
  let stairMinY = 0;
  let stairMaxY = d;
  if (config.stairs.location === "front") stairMaxY = d + stairRun;
  if (config.stairs.location === "back") stairMinY = -stairRun;
  if (config.stairs.location === "left") stairMinX = -stairRun;
  if (config.stairs.location === "right") stairMaxX = w + stairRun;

  // Compute scale to fit
  const testPoints = [
    isoProject(0, 0, 0, 1, rotationAngle),
    isoProject(w, 0, 0, 1, rotationAngle),
    isoProject(0, d, 0, 1, rotationAngle),
    isoProject(w, d, 0, 1, rotationAngle),
    isoProject(0, 0, h + railH, 1, rotationAngle),
    isoProject(w, 0, h + railH, 1, rotationAngle),
    isoProject(stairMinX, stairMinY, 0, 1, rotationAngle),
    isoProject(stairMaxX, stairMaxY, 0, 1, rotationAngle),
    isoProject(0, -0.5, h + railH + 2, 1, rotationAngle),
    isoProject(w, -0.5, h + railH + 2, 1, rotationAngle),
  ];
  const minX = Math.min(...testPoints.map(p => p[0]));
  const maxX = Math.max(...testPoints.map(p => p[0]));
  const minY = Math.min(...testPoints.map(p => p[1]));
  const maxY = Math.max(...testPoints.map(p => p[1]));
  const rangeX = maxX - minX;
  const rangeY = maxY - minY;
  const scale = Math.min((cw - PADDING * 2) / rangeX, (ch - PADDING * 2) / rangeY);

  // Center offset
  const projected = [
    isoProject(0, 0, 0, scale, rotationAngle),
    isoProject(w, 0, 0, scale, rotationAngle),
    isoProject(0, d, 0, scale, rotationAngle),
    isoProject(w, d, 0, scale, rotationAngle),
    isoProject(0, 0, h + railH, scale, rotationAngle),
    isoProject(w, 0, h + railH, scale, rotationAngle),
    isoProject(stairMinX, stairMinY, 0, scale, rotationAngle),
    isoProject(stairMaxX, stairMaxY, 0, scale, rotationAngle),
    isoProject(0, -0.5, h + railH + 2, scale, rotationAngle),
    isoProject(w, -0.5, h + railH + 2, scale, rotationAngle),
  ];
  const pMinX = Math.min(...projected.map(([x]) => x));
  const pMaxX = Math.max(...projected.map(([x]) => x));
  const pMaxY = Math.max(...projected.map(([, y]) => y));
  const offsetX = cw / 2 - (pMinX + pMaxX) / 2;
  const offsetY = ch - PADDING - pMaxY;

  function p(x: number, y: number, z: number): [number, number] {
    const [ix, iy] = isoProject(x, y, z, scale, rotationAngle);
    return [ix + offsetX, iy + offsetY];
  }

  if (config.showGrass) {
    const pad = Math.max(w, d) * 0.4;
    const [g0x, g0y] = p(-pad, -pad, 0);
    const [g1x, g1y] = p(w + pad, -pad, 0);
    const [g2x, g2y] = p(w + pad, d + pad, 0);
    const [g3x, g3y] = p(-pad, d + pad, 0);
    ctx.fillStyle = "#7fa86c";
    ctx.beginPath();
    ctx.moveTo(g0x, g0y); ctx.lineTo(g1x, g1y); ctx.lineTo(g2x, g2y); ctx.lineTo(g3x, g3y);
    ctx.closePath();
    ctx.fill();
  }

  // ── Support posts ──
  const postSp = 6;
  const postCountW = Math.ceil(w / postSp) + 1;
  const postCountD = Math.ceil(d / postSp) + 1;
  ctx.strokeStyle = "#6b4226"; ctx.lineWidth = 2;
  for (let i = 0; i < postCountW; i++) {
    for (let j = 0; j < postCountD; j++) {
      if (config.ledgerAttached && j === 0) continue; // skip posts on ledger/house side
      const px = Math.min(i * postSp, w);
      const py = Math.min(j * postSp, d);
      const [bx, by] = p(px, py, 0);
      const [tx, ty] = p(px, py, h);
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(tx, ty); ctx.stroke();
    }
  }

  // ── Deck surface (filled quad) ──
  const surfColor = BOARD_COLORS[config.material] ?? "#c4a56e";
  const [s0x, s0y] = p(0, 0, h);
  const [s1x, s1y] = p(w, 0, h);
  const [s2x, s2y] = p(w, d, h);
  const [s3x, s3y] = p(0, d, h);

  // Top face
  ctx.fillStyle = surfColor;
  ctx.beginPath();
  ctx.moveTo(s0x, s0y); ctx.lineTo(s1x, s1y); ctx.lineTo(s2x, s2y); ctx.lineTo(s3x, s3y);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = "#6b5c4b"; ctx.lineWidth = 2; ctx.stroke();

  // Deck perimeter and edge lines (no solid skirting wall under deck)
  const [b0x, b0y] = p(0, 0, 0);
  const [b1x, b1y] = p(w, 0, 0);
  const [b2x, b2y] = p(w, d, 0);
  const [b3x, b3y] = p(0, d, 0);

  ctx.strokeStyle = shadeColor(surfColor, -28);
  ctx.lineWidth = 1.4;
  for (const [tx, ty, bx, by] of [[s0x, s0y, b0x, b0y], [s1x, s1y, b1x, b1y], [s2x, s2y, b2x, b2y], [s3x, s3y, b3x, b3y]]) {
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(bx, by);
    ctx.stroke();
  }

  const rimZ = Math.max(0, h - 0.25);
  const [rf0x, rf0y] = p(0, d, rimZ);
  const [rf1x, rf1y] = p(w, d, rimZ);
  const [rr0x, rr0y] = p(w, 0, rimZ);
  ctx.strokeStyle = shadeColor(surfColor, -34);
  ctx.lineWidth = 1.8;
  ctx.beginPath(); ctx.moveTo(rf0x, rf0y); ctx.lineTo(rf1x, rf1y); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(rr0x, rr0y); ctx.lineTo(rf1x, rf1y); ctx.stroke();

  // ── Board lines / composite texture on top face ──
  const boardPx = (parseFloat(config.boardWidth) / 12);
  const isComposite = config.material.startsWith("composite-");

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(s0x, s0y); ctx.lineTo(s1x, s1y); ctx.lineTo(s2x, s2y); ctx.lineTo(s3x, s3y);
  ctx.closePath();
  ctx.clip();

  if (isComposite) {
    let yFt = 0;
    let idx = 0;
    while (yFt < d) {
      const nextY = Math.min(d, yFt + boardPx);
      const [a1x, a1y] = p(0, yFt, h);
      const [a2x, a2y] = p(w, yFt, h);
      const [b2x, b2y] = p(w, nextY, h);
      const [b1x, b1y] = p(0, nextY, h);
      ctx.fillStyle = idx % 2 === 0 ? shadeColor(surfColor, -3) : shadeColor(surfColor, 4);
      ctx.beginPath();
      ctx.moveTo(a1x, a1y); ctx.lineTo(a2x, a2y); ctx.lineTo(b2x, b2y); ctx.lineTo(b1x, b1y);
      ctx.closePath(); ctx.fill();
      yFt = nextY;
      idx += 1;
    }

    ctx.strokeStyle = shadeColor(surfColor, -18);
    ctx.lineWidth = 0.7;
    let seam = 0;
    while (seam < d) {
      seam += boardPx;
      if (seam >= d) break;
      const [lx, ly] = p(0, seam, h);
      const [rx, ry] = p(w, seam, h);
      ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(rx, ry); ctx.stroke();
    }

    ctx.strokeStyle = shadeColor(surfColor, 10);
    ctx.lineWidth = 0.35;
    for (let g = 0.2; g < d; g += 0.6) {
      const [lx, ly] = p(0, g, h);
      const [rx, ry] = p(w, g, h);
      ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(rx, ry); ctx.stroke();
    }
  } else {
    ctx.strokeStyle = shadeColor(surfColor, -12);
    ctx.lineWidth = 0.5;
    let bPos = 0;
    while (bPos < d) {
      bPos += boardPx;
      if (bPos >= d) break;
      const [lx, ly] = p(0, bPos, h);
      const [rx, ry] = p(w, bPos, h);
      ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(rx, ry); ctx.stroke();
    }
  }
  ctx.restore();

  // ── House wall ──
  if (config.ledgerAttached && config.hasHouse) {
    const wallH = h + railH + 2;
    const [w0x, w0y] = p(0, -0.5, 0);
    const [w1x, w1y] = p(w, -0.5, 0);
    const [w2x, w2y] = p(w, -0.5, wallH);
    const [w3x, w3y] = p(0, -0.5, wallH);
    ctx.fillStyle = facadeColor(config);
    ctx.beginPath();
    ctx.moveTo(w0x, w0y); ctx.lineTo(w1x, w1y); ctx.lineTo(w2x, w2y); ctx.lineTo(w3x, w3y);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "#aaa"; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = "#888"; ctx.font = "11px sans-serif"; ctx.textAlign = "center";
    const [lx, ly] = p(w / 2, -0.5, wallH - 0.5);
    ctx.fillText("HOUSE", lx, ly);

    if (config.patioDoor) {
      const doorW = Math.max(2.5, Math.min(4, w * 0.25));
      const doorH = Math.max(6, h + 0.5);
      const dx0 = (w - doorW) / 2;
      const [d0x, d0y] = p(dx0, -0.49, 0);
      const [d1x, d1y] = p(dx0 + doorW, -0.49, 0);
      const [d2x, d2y] = p(dx0 + doorW, -0.49, doorH);
      const [d3x, d3y] = p(dx0, -0.49, doorH);
      ctx.fillStyle = "#e7edf5";
      ctx.beginPath();
      ctx.moveTo(d0x, d0y); ctx.lineTo(d1x, d1y); ctx.lineTo(d2x, d2y); ctx.lineTo(d3x, d3y);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "#8ca0b8"; ctx.lineWidth = 1; ctx.stroke();
    }
  }

  // ── Railing ──
  if (config.railing !== "none") {
    const rZ = h + railH;
    const railColor = RAIL_COLORS[config.railing] ?? "#333";
    ctx.strokeStyle = railColor; ctx.lineWidth = 3;

    // Posts
    const railPostSp = 4;
    // right side
    for (let ft = 0; ft <= d; ft += railPostSp) {
      const [bx, by] = p(w, Math.min(ft, d), h);
      const [tx, ty] = p(w, Math.min(ft, d), rZ);
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(tx, ty); ctx.stroke();
    }
    // front
    for (let ft = 0; ft <= w; ft += railPostSp) {
      const [bx, by] = p(Math.min(ft, w), d, h);
      const [tx, ty] = p(Math.min(ft, w), d, rZ);
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(tx, ty); ctx.stroke();
    }
    // left
    for (let ft = 0; ft <= d; ft += railPostSp) {
      const [bx, by] = p(0, Math.min(ft, d), h);
      const [tx, ty] = p(0, Math.min(ft, d), rZ);
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(tx, ty); ctx.stroke();
    }

    // Top rails
    ctx.strokeStyle = railColor; ctx.lineWidth = 2;
    if (!config.ledgerAttached) {
      const [a, b] = p(0, 0, rZ); const [c, dd] = p(w, 0, rZ);
      ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(c, dd); ctx.stroke();
    }
    const rails: [number, number, number, number, number, number][] = [
      [w, 0, rZ, w, d, rZ], [0, d, rZ, w, d, rZ], [0, 0, rZ, 0, d, rZ],
    ];
    for (const [x1, y1, z1, x2, y2, z2] of rails) {
      const [ax, ay] = p(x1, y1, z1); const [bx, by] = p(x2, y2, z2);
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
    }
  }

  // ── Stairs ──
  if (config.stairs.location !== "none") {
    const stepCount = stairCount;
    const stairWidth = Math.max(2, config.stairs.width);

    let anchorX = 0;
    let anchorY = 0;
    let dirX = 0;
    let dirY = 0;
    let crossX = 0;
    let crossY = 0;

    switch (config.stairs.location) {
      case "front":
        anchorX = w / 2 - stairWidth / 2;
        anchorY = d;
        dirX = 0;
        dirY = 1;
        crossX = 1;
        crossY = 0;
        break;
      case "back":
        anchorX = w / 2 + stairWidth / 2;
        anchorY = 0;
        dirX = 0;
        dirY = -1;
        crossX = -1;
        crossY = 0;
        break;
      case "left":
        anchorX = 0;
        anchorY = d / 2 + stairWidth / 2;
        dirX = -1;
        dirY = 0;
        crossX = 0;
        crossY = -1;
        break;
      case "right":
        anchorX = w;
        anchorY = d / 2 - stairWidth / 2;
        dirX = 1;
        dirY = 0;
        crossX = 0;
        crossY = 1;
        break;
    }

    const stepRise = h / stepCount;
    const stepRun = stairRun / stepCount;
    ctx.fillStyle = "#ccb693";
    ctx.strokeStyle = "#8b7355";
    ctx.lineWidth = 1;

    for (let i = 0; i < stepCount; i++) {
      const startX = anchorX + dirX * (stepRun * i);
      const startY = anchorY + dirY * (stepRun * i);
      const z = h - stepRise * (i + 1);

      const p0 = p(startX, startY, z);
      const p1 = p(startX + crossX * stairWidth, startY + crossY * stairWidth, z);
      const p2 = p(startX + crossX * stairWidth + dirX * stepRun, startY + crossY * stairWidth + dirY * stepRun, z);
      const p3 = p(startX + dirX * stepRun, startY + dirY * stepRun, z);

      ctx.beginPath();
      ctx.moveTo(p0[0], p0[1]);
      ctx.lineTo(p1[0], p1[1]);
      ctx.lineTo(p2[0], p2[1]);
      ctx.lineTo(p3[0], p3[1]);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  }

  // ── Dimension labels ──
  ctx.fillStyle = "#444"; ctx.font = "12px sans-serif"; ctx.textAlign = "center";
  const [dwx, dwy] = p(w / 2, d + 1.5, 0);
  ctx.fillText(`${w}'`, dwx, dwy);
  const [ddx, ddy] = p(w + 1.5, d / 2, 0);
  ctx.fillText(`${d}'`, ddx, ddy);
}

// ─── Surface view draw (combined) ────────────────────────────────────────────

function drawSurfaceView(ctx: CanvasRenderingContext2D, cw: number, ch: number, config: DeckConfig) {
  const scale = getScale(config, cw, ch);
  const deckW = config.dimensions.width * scale;
  const deckD = config.dimensions.depth * scale;
  const offsetX = (cw - deckW) / 2;
  const offsetY = (ch - deckD) / 2 + (config.ledgerAttached ? 10 : 0);

  drawHouseWall(ctx, offsetX, offsetY, deckW, config);
  drawDeckBoards(ctx, offsetX, offsetY, deckW, deckD, config, scale);

  if ((config.shape === "l-shape" || config.shape === "t-shape") && config.dimensions.extensionWidth && config.dimensions.extensionDepth) {
    const extW = config.dimensions.extensionWidth * scale;
    const extD = config.dimensions.extensionDepth * scale;
    const extX = config.shape === "l-shape" ? offsetX + deckW : offsetX + (deckW - extW) / 2;
    const extY = offsetX + deckD;
    drawDeckBoards(ctx, extX, extY, extW, extD, config, scale);
  }
  if (config.shape === "wrap-around") {
    const extD = (config.dimensions.extensionDepth ?? 6) * scale;
    drawDeckBoards(ctx, offsetX + deckW, offsetY, extD, deckD, config, scale);
  }
  drawRailing2D(ctx, offsetX, offsetY, deckW, deckD, config);
  drawStairs2D(ctx, offsetX, offsetY, deckW, deckD, config, scale);
  drawDimLabels(ctx, offsetX, offsetY, deckW, deckD, config);
}

function drawFramingFull(ctx: CanvasRenderingContext2D, cw: number, ch: number, config: DeckConfig) {
  const scale = getScale(config, cw, ch);
  const deckW = config.dimensions.width * scale;
  const deckD = config.dimensions.depth * scale;
  const offsetX = (cw - deckW) / 2;
  const offsetY = (ch - deckD) / 2 + (config.ledgerAttached ? 10 : 0);
  drawHouseWall(ctx, offsetX, offsetY, deckW, config);
  drawFramingView(ctx, offsetX, offsetY, deckW, deckD, config, scale);
  drawDimLabels(ctx, offsetX, offsetY, deckW, deckD, config);
}

// ─── Main Component ──────────────────────────────────────────────────────────

const VIEW_LABELS: Record<CanvasView, string> = {
  surface: "Top Down",
  framing: "Framing",
  elevation: "Side View",
  isometric: "3D",
};

export default function DeckCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { state } = useDeck();
  const { config } = state;
  const [view, setView] = useState<CanvasView>("isometric");
  const [camera, setCamera] = useState<Camera>({ x: 0, y: 0, zoom: 1, rotationAngle: 35 });
  const dragging = useRef(false);
  const rotating = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (parent) { canvas.width = parent.clientWidth; canvas.height = parent.clientHeight; }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const cw = canvas.width, ch = canvas.height;
    ctx.clearRect(0, 0, cw, ch);
    ctx.fillStyle = "#f9fafb"; ctx.fillRect(0, 0, cw, ch);

    // Apply camera transform
    ctx.save();
    ctx.translate(cw / 2, ch / 2);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-cw / 2 + camera.x, -ch / 2 + camera.y);

    switch (view) {
      case "surface": drawSurfaceView(ctx, cw, ch, config); break;
      case "framing": drawFramingFull(ctx, cw, ch, config); break;
      case "elevation": drawElevationView(ctx, cw, ch, config); break;
      case "isometric": drawIsoView(ctx, cw, ch, config, camera.rotationAngle); break;
    }
    ctx.restore();
  }, [config, view, camera]);

  useEffect(() => {
    draw();
    const handleResize = () => draw();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [draw]);

  // ── Pointer handlers for pan/zoom/rotation ──
  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    dragging.current = true;
    rotating.current = view === "isometric" && e.button === 0 && !e.shiftKey;
    lastMouse.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!dragging.current) return;
    const dx = e.clientX - lastMouse.current.x;
    const dy = e.clientY - lastMouse.current.y;
    lastMouse.current = { x: e.clientX, y: e.clientY };

    if (rotating.current) {
      setCamera((c) => ({ ...c, rotationAngle: c.rotationAngle + dx * 0.65 }));
      return;
    }

    setCamera((c) => ({ ...c, x: c.x + dx / c.zoom, y: c.y + dy / c.zoom }));
  }

  function onPointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
    dragging.current = false;
    rotating.current = false;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  }

  function onWheel(e: React.WheelEvent<HTMLCanvasElement>) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setCamera((c) => ({ ...c, zoom: Math.max(0.3, Math.min(5, c.zoom * delta)) }));
  }

  return (
    <div className="relative h-full w-full bg-gray-50 rounded-lg select-none">
      <canvas
        ref={canvasRef}
        className="h-full w-full cursor-grab active:cursor-grabbing touch-none"
        onContextMenu={(e) => e.preventDefault()}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onWheel={onWheel}
      />

      {/* View toggle */}
      <div className="absolute top-2 left-2 sm:left-auto sm:right-2 flex rounded-md bg-white/90 shadow-sm border border-gray-200 text-xs overflow-hidden">
        {(Object.keys(VIEW_LABELS) as CanvasView[]).map((v) => (
          <button
            key={v}
            onClick={() => {
              setView(v);
              setCamera((c) => ({
                x: 0,
                y: 0,
                zoom: 1,
                rotationAngle: c.rotationAngle,
              }));
            }}
            className={`px-2.5 py-1.5 font-medium transition-colors ${
              view === v ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {VIEW_LABELS[v]}
          </button>
        ))}
      </div>

      {/* Zoom controls */}
      <div className="absolute bottom-2 left-2 flex gap-1">
        <button
          onClick={() => setCamera(c => ({ ...c, zoom: Math.min(5, c.zoom * 1.2) }))}
          className="h-7 w-7 rounded bg-white/90 border border-gray-200 text-gray-600 text-sm font-bold shadow-sm hover:bg-gray-100"
        >+</button>
        <button
          onClick={() => setCamera(c => ({ ...c, zoom: Math.max(0.3, c.zoom / 1.2) }))}
          className="h-7 w-7 rounded bg-white/90 border border-gray-200 text-gray-600 text-sm font-bold shadow-sm hover:bg-gray-100"
        >-</button>
        <button
          onClick={() => setCamera((c) => ({ x: 0, y: 0, zoom: 1, rotationAngle: c.rotationAngle }))}
          className="h-7 rounded bg-white/90 border border-gray-200 text-gray-500 text-[10px] px-2 shadow-sm hover:bg-gray-100"
        >Reset</button>
      </div>

      <div className="absolute bottom-2 right-2 rounded bg-white/80 px-2 py-1 text-[10px] text-gray-400">
        {view === "isometric" ? "Drag to rotate (3D) · Shift+drag to pan · Scroll to zoom" : "Drag to pan · Scroll to zoom"}
      </div>
    </div>
  );
}
