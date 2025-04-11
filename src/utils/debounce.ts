export function debounce<T extends (...args: any[]) => void>(func: T, waitFor: number) {
  let timeoutId: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>): void => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => func(...args), waitFor);
  };
}

export function throttle<T extends (...args: any[]) => void>(func: T, waitFor: number) {
  let timeoutId: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>): void => {
    if (timeoutId === null) {
      timeoutId = setTimeout(() => {
        func(...args);
        timeoutId = null;
      }, waitFor);
    }
  };
}
