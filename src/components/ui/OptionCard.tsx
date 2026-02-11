"use client";

interface OptionCardProps {
  label: string;
  description?: string;
  selected: boolean;
  onClick: () => void;
  compact?: boolean;
}

export default function OptionCard({
  label,
  description,
  selected,
  onClick,
  compact = false,
}: OptionCardProps) {
  if (compact) {
    return (
      <button
        onClick={onClick}
        className={`
          rounded-md border px-3 py-1.5 text-left text-sm transition-all cursor-pointer
          ${
            selected
              ? "border-blue-600 bg-blue-50 text-blue-800 font-medium"
              : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
          }
        `}
      >
        {label}
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`
        rounded-lg border-2 px-3 py-2.5 text-left transition-all cursor-pointer
        ${
          selected
            ? "border-blue-600 bg-blue-50 shadow-sm"
            : "border-gray-200 bg-white hover:border-gray-400"
        }
      `}
    >
      <div className="text-sm font-semibold text-gray-900">{label}</div>
      {description && (
        <div className="mt-0.5 text-xs text-gray-500 leading-tight">{description}</div>
      )}
    </button>
  );
}
