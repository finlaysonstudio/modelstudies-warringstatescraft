/**
 * The natural wonders the map carries. No chapter names one and no episode is
 * set at one: nobody built them, so nothing that happens on this country
 * happens *at* them. They are here because the explorer names what a reader
 * clicks, and a wonder with no key would read as an unlabelled marker.
 *
 * Listing them makes them required rather than extra, which is the point: they
 * are deliberate furniture, and dropping one should fail the map's own spec
 * the way dropping a court does. `hukou` and `longmen` are on the gorge,
 * `sanmen` below the confluence, `taishan`, `huashan`, `songshan`, and
 * `jieshi` are the peaks and the sea-rock, and `yanchi` is the salt lake.
 */
export const WONDER_PLACES: string[] = [
  "hukou",
  "huashan",
  "jieshi",
  "longmen",
  "sanmen",
  "songshan",
  "taishan",
  "yanchi",
];
