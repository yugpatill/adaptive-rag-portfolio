"use client";

export function LoadingSpinner() {
  return (
    <div className="flex items-center gap-1.5 px-1 py-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="block w-2 h-2 rounded-full bg-brand-400"
          style={{
            animation: `pulseDot 1.4s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

export function FullPageSpinner() {
  return (
    <div className="flex items-center justify-center h-full">
      <LoadingSpinner />
    </div>
  );
}
