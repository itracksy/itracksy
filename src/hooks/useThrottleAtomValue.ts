import { useState, useEffect, useRef } from "react";
import { useAtomValue } from "jotai";
import { PrimitiveAtom } from "jotai";

export function useThrottleAtomValue<T>(atom: PrimitiveAtom<T>, wait: number = 1000): T {
  const value = useAtomValue(atom);
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastCallRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const now = Date.now();

    if (!lastCallRef.current || now - lastCallRef.current >= wait) {
      console.log("now", now);
      setThrottledValue(value);
      lastCallRef.current = now;
    } else {
      // Schedule update for remaining time
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(
        () => {
          console.log("now", now);
          setThrottledValue(value);
          lastCallRef.current = Date.now();
        },
        wait - (now - lastCallRef.current)
      );
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, wait]);

  return throttledValue;
}
