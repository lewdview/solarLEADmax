export function normalizePhone(input: string): string {
  return input.replace(/[^\d+]/g, "");
}
