/**
 * The country the Annals add. The chapters address the places their own text
 * names (`requiredPlaceKeys`); an episode is set where the event happened,
 * and nineteen of those places no chapter has any reason to mention. They are
 * gazetteer keys and are marked on `geography.json` like any other, and the
 * list is here so `checkPlaces` demands the map carry them too.
 *
 * A literal rather than a fold over the episodes: this module has no imports
 * on purpose, so the place check does not pull the Annals' data (and its
 * vocabulary, and its builder) into the map build. `episodes.spec.ts` holds
 * the two together.
 */
export const ANNALS_PLACES: string[] = [
  "anyi",
  "chen",
  "chuisha",
  "danyang",
  "dujiang",
  "guiling",
  "jimo",
  "ju",
  "maling",
  "mianchi",
  "shouchun",
  "wuguan",
  "xihe",
  "xinzheng",
  "xuzhou",
  "yiling",
  "yique",
  "yong",
  "yuyu",
];
