import type {
  Filter,
  SimpleFilter,
  AndFilter,
  OrFilter,
  FilterValue,
} from "../types/index.js";

/**
 * Utility functions for working with VNDB API filters
 */

/**
 * Create a simple filter
 * @param field - Field name
 * @param operator - Filter operator
 * @param value - Filter value
 * @returns Simple filter
 */
export function filter(
  field: string,
  operator: "=" | "!=" | ">" | ">=" | "<" | "<=",
  value: FilterValue
): SimpleFilter {
  return [field, operator, value];
}

/**
 * Create an AND filter
 * @param filters - Filters to combine with AND
 * @returns AND filter
 */
export function and(...filters: Filter[]): AndFilter {
  return ["and", ...filters];
}

/**
 * Create an OR filter
 * @param filters - Filters to combine with OR
 * @returns OR filter
 */
export function or(...filters: Filter[]): OrFilter {
  return ["or", ...filters];
}

/**
 * Filter by ID(s)
 * @param ids - Single ID or array of IDs
 * @returns Filter for the ID(s)
 */
export function byId(ids: string | string[]): Filter {
  if (typeof ids === "string") {
    return filter("id", "=", ids);
  }
  if (ids.length === 1) {
    return filter("id", "=", ids[0]);
  }
  return or(...ids.map((id) => filter("id", "=", id)));
}

/**
 * Filter by search term
 * @param term - Search term
 * @returns Search filter
 */
export function search(term: string): SimpleFilter {
  return filter("search", "=", term);
}

/**
 * Filter by language
 * @param langs - Single language or array of languages
 * @returns Language filter
 */
export function byLanguage(langs: string | string[]): Filter {
  if (typeof langs === "string") {
    return filter("lang", "=", langs);
  }
  if (langs.length === 1) {
    return filter("lang", "=", langs[0]);
  }
  return or(...langs.map((lang) => filter("lang", "=", lang)));
}

/**
 * Filter by platform
 * @param platforms - Single platform or array of platforms
 * @returns Platform filter
 */
export function byPlatform(platforms: string | string[]): Filter {
  if (typeof platforms === "string") {
    return filter("platform", "=", platforms);
  }
  if (platforms.length === 1) {
    return filter("platform", "=", platforms[0]);
  }
  return or(...platforms.map((platform) => filter("platform", "=", platform)));
}

/**
 * Filter by release date range
 * @param after - Date after (inclusive)
 * @param before - Date before (inclusive)
 * @returns Date range filter
 */
export function byDateRange(after?: string, before?: string): Filter {
  const filters: Filter[] = [];
  if (after) {
    filters.push(filter("released", ">=", after));
  }
  if (before) {
    filters.push(filter("released", "<=", before));
  }
  return filters.length === 1 ? filters[0] : and(...filters);
}

/**
 * Filter by rating range
 * @param min - Minimum rating (10-100)
 * @param max - Maximum rating (10-100)
 * @returns Rating range filter
 */
export function byRatingRange(min?: number, max?: number): Filter {
  const filters: Filter[] = [];
  if (min !== undefined) {
    filters.push(filter("rating", ">=", min));
  }
  if (max !== undefined) {
    filters.push(filter("rating", "<=", max));
  }
  return filters.length === 1 ? filters[0] : and(...filters);
}

/**
 * Filter by tag
 * @param tagId - Tag ID
 * @param maxSpoiler - Maximum spoiler level (0-2)
 * @param minLevel - Minimum tag level (0-3)
 * @returns Tag filter
 */
export function byTag(
  tagId: string,
  maxSpoiler?: number,
  minLevel?: number
): SimpleFilter {
  if (maxSpoiler !== undefined || minLevel !== undefined) {
    return filter("tag", "=", [tagId, maxSpoiler ?? 0, minLevel ?? 0]);
  }
  return filter("tag", "=", tagId);
}

/**
 * Filter by trait
 * @param traitId - Trait ID
 * @param maxSpoiler - Maximum spoiler level (0-2)
 * @returns Trait filter
 */
export function byTrait(traitId: string, maxSpoiler?: number): SimpleFilter {
  if (maxSpoiler !== undefined) {
    return filter("trait", "=", [traitId, maxSpoiler]);
  }
  return filter("trait", "=", traitId);
}

/**
 * Filter helpers for common fields
 */
export const filters = {
  id: byId,
  search,
  language: byLanguage,
  platform: byPlatform,
  dateRange: byDateRange,
  ratingRange: byRatingRange,
  tag: byTag,
  trait: byTrait,

  // Common presets
  hasDescription: () => filter("has_description", "=", 1),
  hasAnime: () => filter("has_anime", "=", 1),
  hasScreenshot: () => filter("has_screenshot", "=", 1),
  hasReview: () => filter("has_review", "=", 1),

  // Development status
  finished: () => filter("devstatus", "=", 0),
  inDevelopment: () => filter("devstatus", "=", 1),
  cancelled: () => filter("devstatus", "=", 2),

  // Release filters
  patch: () => filter("patch", "=", 1),
  freeware: () => filter("freeware", "=", 1),
  official: () => filter("official", "=", 1),
  hasEro: () => filter("has_ero", "=", 1),
  uncensored: () => filter("uncensored", "=", 1),

  // Character filters
  male: () => filter("sex", "=", "m"),
  female: () => filter("sex", "=", "f"),

  // Staff filters
  mainStaff: () => filter("ismain", "=", 1),
};

/**
 * Common field selection presets
 */
export const fields = {
  // Visual Novel fields
  vnBasic: "title,released,rating,platforms",
  vnDetailed:
    "title,alttitle,released,rating,votecount,length_minutes,description,image{url,dims},platforms,languages",
  vnFull:
    "title,alttitle,titles{lang,title,latin,official},aliases,olang,devstatus,released,languages,platforms,image{id,url,dims,sexual,violence,thumbnail},length,length_minutes,length_votes,description,average,rating,votecount",

  // Release fields
  releaseBasic: "title,released,platforms,languages{lang,title}",
  releaseDetailed:
    "title,alttitle,released,platforms,languages{lang,title,latin,mtl},media{medium,qty},minage,patch,freeware,official,has_ero",

  // Character fields
  characterBasic: "name,image{url,dims}",
  characterDetailed:
    "name,original,aliases,description,image{url,dims},age,birthday,sex,traits{spoiler}",

  // Producer fields
  producerBasic: "name,type,lang",
  producerDetailed: "name,original,aliases,lang,type,description",

  // Staff fields
  staffBasic: "name,lang,gender",
  staffDetailed: "name,original,lang,gender,description,aliases{name,latin}",

  // Tag/Trait fields
  tagBasic: "name,category,vn_count",
  traitBasic: "name,group_name,char_count",
};
