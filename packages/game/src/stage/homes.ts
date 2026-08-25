/**
 * Where a seat's figures live on the map: a state's court is its capital,
 * a body (the academy, the order, the council, the clan houses, the
 * merchant house) is a place of its own at the court it sits in. Every
 * value is a place the map must carry (`requiredPlaceKeys`).
 */
export const HOMES: Record<string, string> = {
  qin: "xianyang",
  zhao: "handan",
  wei: "daliang",
  han: "yiyang",
  qi: "linzi",
  chu: "ying",
  yan: "ji",
  zhou: "zhou",
  shu: "chengdu",
  song: "song",
  tao: "tao",
  wey: "puyang",
  wu: "gusu",
  yue: "kuaiji",
  dai: "dai",
  zhongshan: "zhongshan",
  lu: "lu",
  hu: "hu",
  clan: "clan",
  jixia: "jixia",
  mohists: "mohists",
  merchant: "merchant",
  council: "council",
};

/**
 * The home place of a seat: its state's court when the scenario names a
 * cast member, else the seat id when that is a place, else the first
 * home in the table (so a seat with no place in the world still stands
 * somewhere and the script stays valid).
 */
export const homeOf = (seat: string, state?: string): string =>
  (state && HOMES[state]) ?? HOMES[seat] ?? Object.values(HOMES)[0];
