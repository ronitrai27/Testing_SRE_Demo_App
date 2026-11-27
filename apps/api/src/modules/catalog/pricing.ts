/** Shared money helpers for the catalog. All amounts are whole US cents. */

export type Priced = { priceCents: number };

/** The total of several prices. */
export function sumCents(items: Priced[]): number {
  return items.map((item) => item.priceCents).reduce((total, cents) => total + cents);
}

/** A percentage off, rounded to the nearest cent. */
export function discounted(cents: number, percentOff: number): number {
  return Math.round(cents * (1 - percentOff / 100));
}
