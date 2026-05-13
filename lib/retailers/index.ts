/**
 * Retailer-registret. Routar produkt-URLer till rätt retailer-modul,
 * eller returnerar null så caller faller tillbaka till Open Graph-
 * extraktion.
 */

import type { Retailer } from "./types";
import { johnhenric } from "./johnhenric";
import { zalando } from "./zalando";
import { stories } from "./stories";
import { hm } from "./hm";
import { cos } from "./cos";
import { arket } from "./arket";
import { nakd } from "./nakd";
import { nelly } from "./nelly";
import { filippak } from "./filippak";
import {
  acnestudios,
  toteme,
  ganni,
  sezane,
  mango,
} from "./stubs";

const RETAILERS: Retailer[] = [
  johnhenric,
  zalando,
  stories,
  hm,
  cos,
  arket,
  nakd,
  nelly,
  filippak,
  acnestudios,
  toteme,
  ganni,
  sezane,
  mango,
];

export function findRetailer(input: string | URL): Retailer | null {
  let url: URL;
  try {
    url = typeof input === "string" ? new URL(input) : input;
  } catch {
    return null;
  }
  return RETAILERS.find((r) => r.match(url)) ?? null;
}

export function getRetailerById(id: string): Retailer | null {
  return RETAILERS.find((r) => r.id === id) ?? null;
}

export type { Retailer, ProductMeta, Locale } from "./types";
export { openGraphFallback } from "./openGraphFallback";
