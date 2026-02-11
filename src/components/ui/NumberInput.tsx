"use client";

interface NumberInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

export default function NumberInput({
  label,
  value,
  onChange,
  min = 1,
  max = 100,
  step = 1,
  unit = "ft",
}: NumberInputProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <label className="text-xs font-medium text-gray-600">
        {label} ({unit})
      </label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        min={min}
        max={max}
        step={step}
        className="rounded-md border border-gray-300 px-2 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
    </div>
  );
}
