import { useState, useEffect, useRef } from "react";
import { useAtomValue } from "jotai";
import { PrimitiveAtom } from "jotai";

export function useDebounceAtomValue<T>(atom: PrimitiveAtom<T>, wait: number = 1000): T {
  const value = useAtomValue(atom);
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastCallTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
      lastCallTimeRef.current = Date.now();
    }, wait);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, wait]);

  return debouncedValue;
}
