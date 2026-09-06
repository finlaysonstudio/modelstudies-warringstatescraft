/**
 * Every site the stage draws, in the order the app lists them. A site is
 * looked up by its id (`siteOf`) for the route and by its geography for the
 * build, which reads `art/sites/<id>/geography.json`.
 */
import { NotFoundError } from "@jaypie/errors";

import { CITY } from "./city";
import { HOUSE } from "./house";
import { VILLAGE } from "./village";
import type { Site, SiteId } from "../site";

export { CITY, HOUSE, VILLAGE };
export * from "../site";

export const SITES: readonly Site[] = [CITY, VILLAGE, HOUSE];

export const siteOf = (id: SiteId): Site => {
  const site = SITES.find((candidate) => candidate.id === id);
  if (!site) throw new NotFoundError(`unknown site "${id}"`);
  return site;
};
