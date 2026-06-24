export function parseDateStr(s: string): string | null {
  s = s.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  const dMmmY = s.match(/^(\d{1,2})[-/]([A-Za-z]{3})[-/](\d{4})/);
  if (dMmmY) {
    const [, d, mStr, y] = dMmmY;
    const months: Record<string, string> = {
      jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
      jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12"
    };
    const m = months[mStr.toLowerCase()];
    if (m) return `${y}-${m}-${d.padStart(2, "0")}`;
  }

  const parts = s.split(/[-/]/).map(Number);
  if (parts.length === 3) {
    if (parts[0] > 100) {
      return `${parts[0]}-${String(parts[1]).padStart(2, "0")}-${String(parts[2]).padStart(2, "0")}`;
    }
    const [d, m, y] = parts;
    const yr = y < 100 ? 2000 + y : y;
    return `${yr}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }

  return null;
}
