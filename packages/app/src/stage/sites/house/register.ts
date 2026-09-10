/**
 * The house's register: one household of a great officer, as the *Yili*'s
 * rites name its parts (the master, the lady, the heir, the sons and
 * daughters, the concubine, the steward, the retainers who serve as
 * assistants at the rites, the musicians, the gatekeeper, the maids, the
 * cooks, the groom, the porter), and the six who come in from outside (the
 * physician, the invocator, the diviner, the caller, the matchmaker, the
 * suitor). Twenty-five on the register, twenty-four drawn: the concubine's
 * infant is listed and never walks.
 *
 * Names follow one convention (plan `20260909_Plan_house_year.md` §3.2): a
 * lineage name the lineage keeps (邴, attested and carrying no person the
 * page could be taken to name), one-character given names, courtesy names in
 * the Zhou form given at the capping (子 for the master, 伯 for the eldest),
 * the lady and the concubine named by their own lineages (姜, 姞) as the
 * *Yili* and the *Zuozhuan* name a wife, and the servants by office with no
 * given name, as the *Yili* has them. No name is a person of `PEOPLE`; the
 * page says the household is a composite.
 */
import { NotFoundError } from "@jaypie/errors";

import type { Household, Villager } from "../../site";

/** the lineage the household keeps */
export const HOUSE_SURNAME = "邴";

/** the household's id, and the prefix of every member's */
export const HOUSE_ID = "bing";

const member = (
  id: string,
  name: [string, string],
  villager: Omit<Villager, "id" | "name" | "drawn"> & { drawn?: boolean },
): Villager => ({
  id: `${HOUSE_ID}.${id}`,
  name: { en: name[0], zh: name[1] },
  drawn: villager.drawn ?? true,
  ...villager,
});

/** the household in the *Yili*'s order: the family, the steward, the retainers, the servants */
export const HOUSE_MEMBERS: readonly Villager[] = [
  member("ao", ["Bing Ao, styled Ziju, the master", "邴敖，字子車，主人"], {
    relation: "head",
    age: "大",
    sex: "m",
    archetype: "master",
    role: "master",
    home: "dais",
  }),
  member("jiang", ["the lady, of the Jiang", "姜氏，主婦"], {
    relation: "wife",
    age: "大",
    sex: "f",
    archetype: "lady",
    role: "lady",
    home: "bed",
  }),
  member("dowager", ["the dowager, the master's mother", "太夫人，主人之母"], {
    relation: "mother",
    age: "老",
    sex: "f",
    archetype: "dowager",
    role: "dowager",
    home: "chamber",
  }),
  member("jishi", ["the concubine, of the Ji", "姞氏，妾"], {
    relation: "concubine",
    age: "大",
    sex: "f",
    archetype: "concubine",
    role: "concubine",
    home: "east-rooms",
  }),
  // capped in the second month and given the courtesy name 伯賈; 小 until then
  member("jia", ["Bing Jia, the heir", "邴賈，冢子"], {
    relation: "son",
    age: "小",
    sex: "m",
    archetype: "heir",
    sprite: "sprite.heir",
    role: "heir",
    home: "wing-west",
  }),
  member("shu", ["Bing Shu, the second son", "邴戍，次子"], {
    relation: "son",
    age: "小",
    sex: "m",
    archetype: "child",
    role: "child",
    home: "pavilion",
  }),
  // married out in the ninth month
  member("ji", ["Bing Ji, the elder daughter", "邴姬，長女"], {
    relation: "daughter",
    age: "大",
    sex: "f",
    archetype: "younglady",
    role: "younglady",
    home: "loom",
  }),
  member("gui", ["Bing Gui, the younger daughter", "邴媯，次女"], {
    relation: "daughter",
    age: "小",
    sex: "f",
    archetype: "girl",
    role: "girl",
    home: "east-rooms",
  }),
  // the concubine's infant, with his wet nurse counted among the maids
  member("infant", ["an infant, the concubine's son", "孺子，妾之子"], {
    relation: "son",
    age: "小",
    sex: "m",
    archetype: "child",
    role: "child",
    home: "east-rooms",
    drawn: false,
  }),
  member("steward", ["the steward", "宰"], {
    relation: "servant",
    age: "大",
    sex: "m",
    archetype: "steward",
    role: "steward",
    home: "desk",
  }),
  member("sima", ["the house's marshal, a retainer", "家司馬，家臣"], {
    relation: "retainer",
    age: "大",
    sex: "m",
    archetype: "retainer",
    role: "retainer",
    home: "west-table",
  }),
  member("xiang", ["the assistant at the rites, a retainer", "相，家臣"], {
    relation: "retainer",
    age: "大",
    sex: "m",
    archetype: "retainer",
    role: "retainer",
    home: "west-table",
  }),
  member("shi", ["a shi in the house's service", "士，家臣"], {
    relation: "retainer",
    age: "大",
    sex: "m",
    archetype: "retainer",
    role: "retainer",
    home: "west-table",
  }),
  // an old 士 of the house; dies in the eleventh month
  member("tutor", ["the tutor, an old shi of the house", "傅，家之老士"], {
    relation: "retainer",
    age: "老",
    sex: "m",
    archetype: "scholar",
    role: "tutor",
    home: "wing-west",
  }),
  member("musician-a", ["the first musician, blind", "樂工，瞽"], {
    relation: "servant",
    age: "大",
    sex: "m",
    archetype: "musician",
    role: "musician",
    home: "hall",
  }),
  member("musician-b", ["the second musician, blind", "樂工，瞽"], {
    relation: "servant",
    age: "大",
    sex: "m",
    archetype: "musician",
    role: "musician",
    home: "hall",
  }),
  member("gatekeeper", ["the gatekeeper", "閽人"], {
    relation: "servant",
    age: "大",
    sex: "m",
    archetype: "guard",
    role: "gatekeeper",
    home: "gate",
  }),
  member("maid-a", ["the maid of the loom", "婢，機下"], {
    relation: "servant",
    age: "大",
    sex: "f",
    archetype: "maid",
    sprite: "sprite.maid",
    role: "maid",
    home: "loom",
  }),
  member("maid-b", ["the maid of the chamber", "婢，寢中"], {
    relation: "servant",
    age: "大",
    sex: "f",
    archetype: "maid",
    sprite: "sprite.maid-b",
    role: "maid",
    home: "chamber",
  }),
  member("maid-c", ["the maid of the kitchen", "婢，庖下"], {
    relation: "servant",
    age: "大",
    sex: "f",
    archetype: "maid",
    sprite: "sprite.maid",
    role: "maid",
    home: "kitchen",
  }),
  member(
    "maid-d",
    ["the maid of the women's rooms, the wet nurse", "婢，東房，乳母"],
    {
      relation: "servant",
      age: "大",
      sex: "f",
      archetype: "maid",
      sprite: "sprite.maid-b",
      role: "maid",
      home: "east-rooms",
    },
  ),
  member("cook-a", ["the first cook", "庖人"], {
    relation: "servant",
    age: "大",
    sex: "m",
    archetype: "cook",
    sprite: "sprite.cook",
    role: "cook",
    home: "hearth",
  }),
  member("cook-b", ["the second cook", "庖人"], {
    relation: "servant",
    age: "大",
    sex: "m",
    archetype: "cook",
    sprite: "sprite.cook-b",
    role: "cook",
    home: "hearth",
  }),
  member("groom", ["the groom", "圉人"], {
    relation: "servant",
    age: "大",
    sex: "m",
    archetype: "groom",
    role: "groom",
    home: "manger",
  }),
  member("porter", ["the porter", "僕"], {
    relation: "servant",
    age: "大",
    sex: "m",
    archetype: "carrier",
    role: "porter",
    home: "bins",
  }),
];

export const HOUSE_REGISTER: Household[] = [
  {
    id: HOUSE_ID,
    surname: HOUSE_SURNAME,
    rank: "大夫",
    head: `${HOUSE_ID}.ao`,
    members: [...HOUSE_MEMBERS],
    note: {
      en: "A great officer's household: the lineage's house with the servants it owns and the retainers it feeds, in the Yili's order. The names are invented on one convention and no member is a person of the record.",
      zh: "大夫之家：一族之居，畜其臣妾，養其家臣，依儀禮之序。名皆依一例所擬，無一人見於史。",
    },
  },
];

const visitor = (
  id: string,
  name: [string, string],
  villager: Omit<Villager, "id" | "name" | "drawn" | "home" | "relation">,
): Villager => ({
  id: `visitor.${id}`,
  name: { en: name[0], zh: name[1] },
  relation: "visitor",
  drawn: true,
  // every visitor comes in from the street and goes out by it
  home: "edge",
  ...villager,
});

/**
 * The six who are not on the register and come to the house: the physician
 * monthly and at the death, the invocator and the diviner at every sacrifice
 * and the capping, the caller (a 士 with a pheasant, who is also the guest of
 * honour at the capping and the suitor's messenger), the matchmaker, and the
 * suitor, whose party is a crowd of the script rather than a person here.
 */
export const HOUSE_VISITORS: Villager[] = [
  visitor("physician", ["the physician", "醫"], {
    age: "大",
    sex: "m",
    archetype: "physician",
    role: "physician",
  }),
  visitor("invocator", ["the invocator", "祝"], {
    age: "大",
    sex: "m",
    archetype: "invocator",
    role: "invocator",
  }),
  visitor("diviner", ["the diviner", "筮人"], {
    age: "老",
    sex: "m",
    archetype: "diviner",
    role: "diviner",
  }),
  visitor("caller", ["a shi who calls, with a pheasant", "賓，士，執雉"], {
    age: "大",
    sex: "m",
    archetype: "guest",
    role: "caller",
  }),
  // the go-between is a married woman of the ward: the matron's sprite
  visitor("matchmaker", ["the matchmaker", "媒"], {
    age: "大",
    sex: "f",
    archetype: "matron",
    role: "matchmaker",
  }),
  visitor("suitor", ["the suitor, a shi of another house", "壻，他家之士"], {
    age: "大",
    sex: "m",
    archetype: "guest",
    role: "suitor",
  }),
];

/** every villager the house names, register then visitors */
export const HOUSE_PEOPLE: readonly Villager[] = [
  ...HOUSE_MEMBERS,
  ...HOUSE_VISITORS,
];

/** the id of a house member or visitor, checked at authoring time */
export const houseVillager = (id: string): Villager => {
  const found = HOUSE_PEOPLE.find((person) => person.id === id);
  if (!found)
    throw new NotFoundError(`no villager "${id}" on the house's register`);
  return found;
};
