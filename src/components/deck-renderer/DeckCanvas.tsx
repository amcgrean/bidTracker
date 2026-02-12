"use client";

import { useEffect, useRef, useMemo, useState } from "react";
import { useDeck } from "@/lib/deck-context";
import { DeckConfig } from "@/types/deck";
import { BRAND_CATALOG } from "@/lib/brand-data";

const PAD = 40;
const DIMENSION_MIN = 6;
const DIMENSION_MAX = 48;
const SNAP_STEP = 0.5;
const HANDLE_RADIUS = 8;

type DragEdge = "right" | "bottom";

function snapDimension(value: number) {
  const snapped = Math.round(value / SNAP_STEP) * SNAP_STEP;
  return Math.min(DIMENSION_MAX, Math.max(DIMENSION_MIN, snapped));
}

function getScale(config: DeckConfig, width: number, height: number) {
  const availableW = width - PAD * 2;
  const availableH = height - PAD * 2;
  return Math.min(availableW / config.dimensions.width, availableH / config.dimensions.depth);
}

function hexToRgb(hex: string) {
  const clean = hex.replace("#", "");
  const value = Number.parseInt(clean, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function getDeckTint(colorHex: string) {
  const { r, g, b } = hexToRgb(colorHex);
  return `rgba(${r}, ${g}, ${b}, 0.55)`;
}

function resolveRailSeries(config: DeckConfig) {
  for (const system of BRAND_CATALOG.railing_systems) {
    const series = system.series.find((item) => item.name === config.activeRailSeries);
    if (series) {
      return series;
    }
  }
  return BRAND_CATALOG.railing_systems[0].series[0];
}

function drawDeck(ctx: CanvasRenderingContext2D, config: DeckConfig, x: number, y: number, w: number, d: number) {
  ctx.save();
  ctx.fillStyle = "#9b7b53";
  ctx.fillRect(x, y, w, d);

  // Base grain texture + multiply tint overlay to emulate colorized material.
  ctx.globalAlpha = 0.2;
  ctx.strokeStyle = "#4f3f2e";
  ctx.lineWidth = 1;
  for (let i = 0; i < d; i += 6) {
    ctx.beginPath();
    ctx.moveTo(x, y + i);
    ctx.lineTo(x + w, y + i + (i % 12 === 0 ? 2 : -2));
    ctx.stroke();
  }

  ctx.globalCompositeOperation = "multiply";
  ctx.globalAlpha = 1;
  ctx.fillStyle = getDeckTint(config.activeDeckColor);
  ctx.fillRect(x, y, w, d);

  ctx.globalCompositeOperation = "source-over";
  ctx.strokeStyle = "#4f3f2e";
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, d);
  ctx.restore();
}

function edgeSegments(x: number, y: number, w: number, d: number, ledgerAttached: boolean) {
  const segments = [
    { x1: x + w, y1: y, x2: x + w, y2: y + d },
    { x1: x, y1: y + d, x2: x + w, y2: y + d },
    { x1: x, y1: y, x2: x, y2: y + d },
  ];

  if (!ledgerAttached) {
    segments.unshift({ x1: x, y1: y, x2: x + w, y2: y });
  }

  return segments;
}

function drawRailing(ctx: CanvasRenderingContext2D, config: DeckConfig, x: number, y: number, w: number, d: number, scale: number) {
  const series = resolveRailSeries(config);
  const color = config.activeRailColor;
  const segments = edgeSegments(x, y, w, d, config.ledgerAttached);

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  segments.forEach((segment) => {
    ctx.beginPath();
    ctx.moveTo(segment.x1, segment.y1);
    ctx.lineTo(segment.x2, segment.y2);
    ctx.stroke();
  });

  if (series.type === "glass_panel") {
    ctx.fillStyle = "rgba(128, 176, 214, 0.2)";
    segments.forEach((segment) => {
      if (segment.y1 === segment.y2) {
        const yOffset = segment.y1 === y ? 4 : -4;
        ctx.fillRect(Math.min(segment.x1, segment.x2), segment.y1 + yOffset, Math.abs(segment.x2 - segment.x1), 8);
      } else {
        const xOffset = segment.x1 === x ? 4 : -12;
        ctx.fillRect(segment.x1 + xOffset, Math.min(segment.y1, segment.y2), 8, Math.abs(segment.y2 - segment.y1));
      }
    });
  }

  const picketStep = (3 / 12) * scale;
  const cableStep = (3 / 12) * scale;

  // Batched positional generation to mimic instanced rendering.
  const instances: Array<{ x: number; y: number; w: number; h: number }> = [];

  if (series.type === "baluster" || series.type === "baluster_ornamental" || series.type === "thick_baluster") {
    segments.forEach((segment) => {
      const vertical = segment.x1 === segment.x2;
      const length = vertical ? Math.abs(segment.y2 - segment.y1) : Math.abs(segment.x2 - segment.x1);
      const count = Math.max(2, Math.floor(length / picketStep));
      for (let i = 0; i <= count; i += 1) {
        const t = i / count;
        const px = segment.x1 + (segment.x2 - segment.x1) * t;
        const py = segment.y1 + (segment.y2 - segment.y1) * t;
        instances.push({ x: px - 2, y: py - 2, w: 4, h: 4 });
      }
    });

    ctx.fillStyle = color;
    instances.forEach((instance) => ctx.fillRect(instance.x, instance.y, instance.w, instance.h));

    if (series.type === "baluster_ornamental") {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      const offset = (6 / 12) * scale;
      segments.forEach((segment) => {
        const vertical = segment.x1 === segment.x2;
        ctx.beginPath();
        if (vertical) {
          const shift = segment.x1 === x ? offset : -offset;
          ctx.moveTo(segment.x1 + shift, segment.y1);
          ctx.lineTo(segment.x2 + shift, segment.y2);
        } else {
          const shift = segment.y1 === y ? offset : -offset;
          ctx.moveTo(segment.x1, segment.y1 + shift);
          ctx.lineTo(segment.x2, segment.y2 + shift);
        }
        ctx.stroke();
      });
    }
  }

  if (series.type === "cable") {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    segments.forEach((segment) => {
      const vertical = segment.x1 === segment.x2;
      const runs = 6;
      for (let i = 1; i <= runs; i += 1) {
        const offset = i * cableStep;
        ctx.beginPath();
        if (vertical) {
          const shift = segment.x1 === x ? offset : -offset;
          ctx.moveTo(segment.x1 + shift, segment.y1);
          ctx.lineTo(segment.x2 + shift, segment.y2);
        } else {
          const shift = segment.y1 === y ? offset : -offset;
          ctx.moveTo(segment.x1, segment.y1 + shift);
          ctx.lineTo(segment.x2, segment.y2 + shift);
        }
        ctx.stroke();
      }
    });
  }

  ctx.restore();
}

function drawDimensionHandles(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, d: number) {
  const handles = [
    { cx: x + w, cy: y + d / 2, edge: "right" as const },
    { cx: x + w / 2, cy: y + d, edge: "bottom" as const },
  ];

  ctx.save();
  handles.forEach((handle) => {
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#2563eb";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(handle.cx, handle.cy, HANDLE_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#1d4ed8";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(handle.edge === "right" ? "W" : "D", handle.cx, handle.cy + 3);
  });
  ctx.restore();
}

function getPointerPosition(canvas: HTMLCanvasElement, event: PointerEvent) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
}

function resolveDragEdge(pointerX: number, pointerY: number, x: number, y: number, w: number, d: number): DragEdge | null {
  const rightDx = pointerX - (x + w);
  const rightDy = pointerY - (y + d / 2);
  if (Math.hypot(rightDx, rightDy) <= HANDLE_RADIUS + 4) {
    return "right";
  }

  const bottomDx = pointerX - (x + w / 2);
  const bottomDy = pointerY - (y + d);
  if (Math.hypot(bottomDx, bottomDy) <= HANDLE_RADIUS + 4) {
    return "bottom";
  }

  return null;
}

export default function DeckCanvas() {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const { state, dispatch } = useDeck();
  const [dragEdge, setDragEdge] = useState<DragEdge | null>(null);

  const series = useMemo(() => resolveRailSeries(state.config), [state.config]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const pixelRatio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * pixelRatio;
    canvas.height = rect.height * pixelRatio;
    ctx.scale(pixelRatio, pixelRatio);

    ctx.clearRect(0, 0, rect.width, rect.height);
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, rect.width, rect.height);

    const scale = getScale(state.config, rect.width, rect.height);
    const w = state.config.dimensions.width * scale;
    const d = state.config.dimensions.depth * scale;
    const x = (rect.width - w) / 2;
    const y = (rect.height - d) / 2;

    drawDeck(ctx, state.config, x, y, w, d);
    drawRailing(ctx, state.config, x, y, w, d, scale);
    drawDimensionHandles(ctx, x, y, w, d);

    ctx.fillStyle = "#334155";
    ctx.font = "12px sans-serif";
    ctx.fillText(`Deck: ${state.config.activeDeckBrand} / ${state.config.activeDeckLine}`, 12, 20);
    ctx.fillText(`Railing Series: ${state.config.activeRailSeries} (${series.type})`, 12, 38);
    ctx.fillText("Drag W/D handles to resize (0.5' grid)", 12, 56);
  }, [series.type, state.config]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const canvasEl = canvas;

    function handlePointerDown(event: PointerEvent) {
      const rect = canvasEl.getBoundingClientRect();
      const scale = getScale(state.config, rect.width, rect.height);
      const w = state.config.dimensions.width * scale;
      const d = state.config.dimensions.depth * scale;
      const x = (rect.width - w) / 2;
      const y = (rect.height - d) / 2;
      const pointer = getPointerPosition(canvasEl, event);
      const edge = resolveDragEdge(pointer.x, pointer.y, x, y, w, d);
      if (!edge) return;

      canvasEl.setPointerCapture(event.pointerId);
      setDragEdge(edge);
    }

    function handlePointerMove(event: PointerEvent) {
      if (!dragEdge) return;
      const rect = canvasEl.getBoundingClientRect();
      const pointer = getPointerPosition(canvasEl, event);
      const scale = getScale(state.config, rect.width, rect.height);
      const currentWidthPx = state.config.dimensions.width * scale;
      const currentDepthPx = state.config.dimensions.depth * scale;
      const x = (rect.width - currentWidthPx) / 2;
      const y = (rect.height - currentDepthPx) / 2;

      if (dragEdge === "right") {
        const nextWidth = snapDimension((pointer.x - x) / scale);
        if (nextWidth !== state.config.dimensions.width) {
          dispatch({
            type: "UPDATE_CONFIG",
            payload: {
              dimensions: {
                ...state.config.dimensions,
                width: nextWidth,
              },
            },
          });
        }
      }

      if (dragEdge === "bottom") {
        const nextDepth = snapDimension((pointer.y - y) / scale);
        if (nextDepth !== state.config.dimensions.depth) {
          dispatch({
            type: "UPDATE_CONFIG",
            payload: {
              dimensions: {
                ...state.config.dimensions,
                depth: nextDepth,
              },
            },
          });
        }
      }
    }

    function handlePointerUp(event: PointerEvent) {
      if (!dragEdge) return;
      setDragEdge(null);
      if (canvasEl.hasPointerCapture(event.pointerId)) {
        canvasEl.releasePointerCapture(event.pointerId);
      }
    }

    canvasEl.addEventListener("pointerdown", handlePointerDown);
    canvasEl.addEventListener("pointermove", handlePointerMove);
    canvasEl.addEventListener("pointerup", handlePointerUp);
    canvasEl.addEventListener("pointercancel", handlePointerUp);

    return () => {
      canvasEl.removeEventListener("pointerdown", handlePointerDown);
      canvasEl.removeEventListener("pointermove", handlePointerMove);
      canvasEl.removeEventListener("pointerup", handlePointerUp);
      canvasEl.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [dispatch, dragEdge, state.config]);

  return (
    <div className="h-full w-full rounded-xl border border-gray-200 bg-white">
      <canvas ref={ref} className="h-full w-full" />
    </div>
  );
}
