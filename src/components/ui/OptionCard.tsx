"use client";

interface OptionCardProps {
  label: string;
  description?: string;
  selected: boolean;
  onClick: () => void;
}

export default function OptionCard({
  label,
  description,
  selected,
  onClick,
}: OptionCardProps) {
  return (
    <button
      onClick={onClick}
      className={`
        rounded-lg border-2 p-4 text-left transition-all cursor-pointer
        ${
          selected
            ? "border-blue-600 bg-blue-50 shadow-md"
            : "border-gray-200 bg-white hover:border-gray-400"
        }
      `}
    >
      <div className="font-semibold text-gray-900">{label}</div>
      {description && (
        <div className="mt-1 text-sm text-gray-500">{description}</div>
      )}
    </button>
  );
}
