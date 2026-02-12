"use client";

import { useMemo } from "react";
import { useDeck } from "@/lib/deck-context";
import OptionCard from "@/components/ui/OptionCard";
import {
  BRAND_CATALOG,
  getRailSeriesColorOptions,
  RailingSystem,
  RailSeries,
} from "@/lib/brand-data";


function railTypeFromSeries(type: RailSeries["type"]) {
  if (type === "glass_panel") return "glass" as const;
  return "metal" as const;
}

function railBrandFromSystem(name: string) {
  if (name.startsWith("Westbury")) return "westbury" as const;
  if (name.startsWith("Trex")) return "trex" as const;
  return "generic" as const;
}

export default function RailingStep() {
  const { state, dispatch } = useDeck();
  const { activeRailSeries, activeRailColor } = state.config;

  const systems = BRAND_CATALOG.railing_systems;

  const selectedSystem = useMemo<RailingSystem>(() => {
    return (
      systems.find((system) =>
        system.series.some((series) => series.name === activeRailSeries),
      ) ?? systems[0]
    );
  }, [activeRailSeries, systems]);

  const selectedSeries =
    selectedSystem.series.find((series) => series.name === activeRailSeries) ??
    selectedSystem.series[0];

  const colorOptions = getRailSeriesColorOptions(selectedSystem, selectedSeries);

  function setSystem(system: RailingSystem) {
    const nextSeries = system.series[0];
    const nextColor = getRailSeriesColorOptions(system, nextSeries)[0];

    dispatch({
      type: "UPDATE_CONFIG",
      payload: {
        railing: railTypeFromSeries(nextSeries.type),
        railingBrand: railBrandFromSystem(system.brand),
        activeRailSeries: nextSeries.name,
        activeRailColor: nextColor?.hex ?? activeRailColor,
      },
    });
  }

  function setSeries(series: RailSeries) {
    const nextColor = getRailSeriesColorOptions(selectedSystem, series)[0];
    dispatch({
      type: "UPDATE_CONFIG",
      payload: {
        railing: railTypeFromSeries(series.type),
        activeRailSeries: series.name,
        activeRailColor: nextColor?.hex ?? activeRailColor,
      },
    });
  }

  return (
    <div>
      <h2 className="text-base font-bold text-gray-900 mb-3">Railing</h2>

      <h3 className="text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
        Brand
      </h3>
      <div className="flex flex-wrap gap-2 mb-4">
        {systems.map((system) => (
          <OptionCard
            key={system.brand}
            compact
            label={system.brand}
            selected={selectedSystem.brand === system.brand}
            onClick={() => setSystem(system)}
          />
        ))}
      </div>

      <h3 className="text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
        Series
      </h3>
      <div className="flex flex-wrap gap-2 mb-4">
        {selectedSystem.series.map((series) => (
          <OptionCard
            key={series.name}
            compact
            label={series.name}
            selected={selectedSeries.name === series.name}
            onClick={() => setSeries(series)}
          />
        ))}
      </div>

      <h3 className="text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
        Color
      </h3>
      <div className="flex flex-wrap gap-3">
        {colorOptions.map((color) => (
          <button
            key={color.name}
            type="button"
            className="flex items-center gap-2"
            onClick={() =>
              dispatch({
                type: "UPDATE_CONFIG",
                payload: {
                  activeRailColor: color.hex,
                },
              })
            }
            title={color.name}
          >
            <span
              className={`h-7 w-7 rounded-full border-2 ${
                activeRailColor === color.hex ? "border-gray-900" : "border-gray-300"
              }`}
              style={{ backgroundColor: color.hex }}
            />
            <span className="text-xs text-gray-700">{color.name}</span>
          </button>
        ))}
      </div>

      <p className="mt-3 text-xs text-gray-500">Infill type: {selectedSeries.type}</p>
    </div>
  );
}
