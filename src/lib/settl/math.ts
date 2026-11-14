export type SplitMode = "Equally" | "Exact" | "Percent" | "Parts" | "One pays";
export const money = (n: number) => `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export function splitAmount(total: number, people: string[], mode: SplitMode, values: number[], one: number = 1): number[] {
  if (!people.length) return [];
  if (mode === "Exact") return people.map((_, i) => Math.round((values[i] || 0) * 100) / 100);
  if (mode === "One pays") return people.map((_, i) => i === one ? total : 0);
  const weights = people.map((_, i) => mode === "Equally" ? 1 : Math.max(0, values[i] || 0));
  const sum = weights.reduce((a, b) => a + b, 0);
  if (!sum) return people.map(() => 0);
  const cents = Math.round(total * 100);
  const amounts = weights.map(w => Math.floor(cents * w / sum));
  let remainder = cents - amounts.reduce((a, b) => a + b, 0);
  for (let i = 0; remainder > 0; i = (i + 1) % amounts.length) { amounts[i] += 1; remainder--; }
  return amounts.map(a => a / 100);
}
export function validSplit(total: number, shares: number[]) { return shares.every(n => Number.isFinite(n) && n >= 0) && Math.round(shares.reduce((a,b) => a+b,0)*100) === Math.round(total*100); }
export function parseCsv(text: string) {
  const rows = text.trim().split(/\r?\n/).map(row => row.split(",").map(cell => cell.trim().replace(/^"|"$/g, "")));
  const headers = rows.shift()?.map(h => h.toLowerCase()) || [];
  const gi = headers.indexOf("group"); const ni = headers.indexOf("name"); const bi = headers.indexOf("balance");
  if (gi < 0 || ni < 0 || bi < 0) throw new Error("Use the sample CSV format: group,name,balance.");
  const entries = rows.map(row => ({ group: row[gi], name: row[ni], balance: Number(row[bi]) }));
  if (!entries.length || entries.some(r => !r.group || !r.name || !Number.isFinite(r.balance))) throw new Error("This CSV has missing names or invalid balances.");
  return entries;
}