import { useEffect, useState } from "react";

export function AnimatedScore({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const start = displayValue;
    const delta = value - start;
    const startedAt = performance.now();
    const duration = 650;
    let frame = 0;

    const tick = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(start + delta * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  const degrees = Math.round((displayValue / 100) * 360);

  return (
    <div
      className="grid h-28 w-28 shrink-0 place-items-center rounded-full"
      style={{
        background: `conic-gradient(#059669 ${degrees}deg, #e5e7eb ${degrees}deg)`,
      }}
      aria-label={`Score ${displayValue} out of 100`}
    >
      <div className="grid h-[5.75rem] w-[5.75rem] place-items-center rounded-full bg-white">
        <div className="text-center">
          <div className="text-3xl font-semibold leading-none text-neutral-950">
            {displayValue}
          </div>
          <div className="mt-1 text-[14px] font-medium text-neutral-500">/100</div>
        </div>
      </div>
    </div>
  );
}
