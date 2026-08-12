import { useEffect, useRef, useState } from "react";

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  decimals?: number;
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

export default function AnimatedNumber({
  value,
  duration = 1100,
  decimals,
}: AnimatedNumberProps) {
  const [display, setDisplay] = useState(0);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    const start = performance.now();
    const from = 0;

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);
      setDisplay(from + (value - from) * eased);
      if (progress < 1) {
        frame.current = requestAnimationFrame(tick);
      } else {
        setDisplay(value);
      }
    }

    frame.current = requestAnimationFrame(tick);
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    };
    // Re-run whenever the target value changes (e.g. navigating between products).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);

  const resolvedDecimals = decimals ?? (Number.isInteger(value) ? 0 : 1);

  return (
    <span>
      {display.toLocaleString("uk-UA", {
        minimumFractionDigits: resolvedDecimals,
        maximumFractionDigits: resolvedDecimals,
      })}
    </span>
  );
}
