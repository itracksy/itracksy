/**
 * Type guard to check if a value is null or undefined
 */
export const isNullOrUndefined = (value: unknown): value is null | undefined => {
  return value === null || value === undefined;
};

/**
 * Type guard to check if a value is empty (null, undefined, empty string, empty array, or empty object)
 */
export const isEmpty = (value: unknown): boolean => {
  if (isNullOrUndefined(value)) return true;
  if (typeof value === "string") return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (value !== null && typeof value === "object") return Object.keys(value).length === 0;
  return false;
};

/**
 * Type guard to check if a value is a non-empty string
 */
export const isNonEmptyString = (value: unknown): value is string => {
  return typeof value === "string" && value.trim().length > 0;
};

/**
 * Type guard to check if a value is a non-empty array
 */
export const isNonEmptyArray = <T>(value: unknown): value is T[] => {
  return Array.isArray(value) && value.length > 0;
};

/**
 * Type guard to check if a value is a non-empty object
 */
export const isNonEmptyObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value) && Object.keys(value).length > 0;
};

/**
 * Returns true if all values in the array are non-null and non-undefined
 */
export const allDefined = <T>(values: (T | null | undefined)[]): values is T[] => {
  return values.every((value) => !isNullOrUndefined(value));
};

/**
 * Returns the value if it's defined, otherwise returns the default value
 */
export const getValueOrDefault = <T>(value: T | null | undefined, defaultValue: T): T => {
  return isNullOrUndefined(value) ? defaultValue : value;
};
