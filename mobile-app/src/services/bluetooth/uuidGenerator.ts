/**
 * Simple UUID generator implementation
 * This is a fallback implementation if uuid package is not available
 */

/**
 * Generates a v4 UUID
 * @returns A UUID string
 */
export const v4 = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export default { v4 };
