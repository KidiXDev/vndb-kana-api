/**
 * VNDB Kana API Type Definitions
 * Based on the official API documentation at https://api.vndb.org/kana
 */

// Common data types
export type VndbId = string;
export type ReleaseDate = string | "TBA" | "unknown" | "today";

// Enumeration types
export type Language =
  | "en"
  | "ja"
  | "zh"
  | "ko"
  | "fr"
  | "de"
  | "es"
  | "it"
  | "pt"
  | "ru"
  | "cs"
  | "hu"
  | "pl"
  | "fi"
  | "nl"
  | "sv"
  | "da"
  | "no"
  | "uk"
  | "bg"
  | "tr"
  | "ar"
  | "th"
  | "vi"
  | "he"
  | "ca"
  | "lv"
  | "eo"
  | "sk"
  | "ro"
  | "hr"
  | "mk"
  | "hi";
export type Platform =
  | "win"
  | "lin"
  | "mac"
  | "web"
  | "ios"
  | "and"
  | "dvd"
  | "bdp"
  | "ps1"
  | "ps2"
  | "ps3"
  | "ps4"
  | "ps5"
  | "psp"
  | "psv"
  | "xbo"
  | "x36"
  | "x68"
  | "nds"
  | "3ds"
  | "swi"
  | "wii"
  | "gba"
  | "msx"
  | "fmt"
  | "nec"
  | "sfc"
  | "smd"
  | "sat"
  | "drc"
  | "oth";
export type Gender = "m" | "f" | "b" | "n";
export type BloodType = "a" | "b" | "ab" | "o";
export type DevStatus = 0 | 1 | 2; // 0: Finished, 1: In development, 2: Cancelled
export type TagCategory = "cont" | "ero" | "tech";
export type CharacterRole = "main" | "primary" | "side" | "appears";
export type ReleaseType = "trial" | "partial" | "complete";
export type VoicedStatus = 1 | 2 | 3 | 4; // 1: not voiced, 2: only ero scenes, 3: partially, 4: fully
export type ProducerType = "co" | "in" | "ng"; // company, individual, amateur group
export type CupSize =
  | "AAA"
  | "AA"
  | "A"
  | "B"
  | "C"
  | "D"
  | "E"
  | "F"
  | "G"
  | "H"
  | "I"
  | "J"
  | "K"
  | "L"
  | "M"
  | "N"
  | "O"
  | "P"
  | "Q"
  | "R"
  | "S"
  | "T"
  | "U"
  | "V"
  | "W"
  | "X"
  | "Y"
  | "Z";
export type ImageType =
  | "pkgfront"
  | "pkgback"
  | "pkgcontent"
  | "pkgside"
  | "pkgmed"
  | "dig";

// Base image interface
export interface VndbImage {
  id: string;
  url: string;
  dims: [number, number];
  sexual: number;
  violence: number;
  votecount: number;
  thumbnail?: string;
  thumbnail_dims?: [number, number];
}

// Title object
export interface VndbTitle {
  lang: Language;
  title: string;
  latin: string | null;
  official: boolean;
  main: boolean;
}

// External links
export interface ExternalLink {
  url: string;
  label: string;
  name: string;
  id: string;
}

// Visual Novel interfaces
export interface VisualNovel {
  id: VndbId;
  title: string;
  alttitle: string | null;
  titles: VndbTitle[];
  aliases: string[];
  olang: Language;
  devstatus: DevStatus;
  released: ReleaseDate | null;
  languages: Language[];
  platforms: Platform[];
  image: VndbImage | null;
  length: number | null;
  length_minutes: number | null;
  length_votes: number;
  description: string | null;
  average: number | null;
  rating: number | null;
  votecount: number;
  screenshots: VndbScreenshot[];
  relations: VnRelation[];
  tags: VnTag[];
  developers: Producer[];
  editions: VnEdition[];
  staff: VnStaff[];
  va: VnVoiceActor[];
  extlinks: ExternalLink[];
}

export interface VndbScreenshot extends VndbImage {
  release: Release;
}

export interface VnRelation extends VisualNovel {
  relation: string;
  relation_official: boolean;
}

export interface VnTag extends Tag {
  rating: number;
  spoiler: 0 | 1 | 2;
  lie: boolean;
}

export interface VnEdition {
  eid: number;
  lang: Language | null;
  name: string;
  official: boolean;
}

export interface VnStaff extends Staff {
  eid: number | null;
  role: string;
  note: string | null;
}

export interface VnVoiceActor {
  note: string | null;
  staff: Staff[] | null;
  character: Character[] | null;
}

// Release interfaces
export interface Release {
  id: VndbId;
  title: string;
  alttitle: string | null;
  languages: ReleaseLanguage[];
  platforms: Platform[];
  media: ReleaseMedia[];
  vns: ReleaseVn[];
  producers: ReleaseProducer[];
  images: ReleaseImage[];
  released: ReleaseDate;
  minage: number | null;
  patch: boolean;
  freeware: boolean;
  uncensored: boolean | null;
  official: boolean;
  has_ero: boolean;
  resolution: [number, number] | "non-standard" | null;
  engine: string | null;
  voiced: VoicedStatus | null;
  notes: string | null;
  gtin: string | null;
  catalog: string | null;
  extlinks: ExternalLink[];
}

export interface ReleaseLanguage {
  lang: Language;
  title: string | null;
  latin: string | null;
  mtl: boolean;
  main: boolean;
}

export interface ReleaseMedia {
  medium: string;
  qty: number;
}

export interface ReleaseVn extends VisualNovel {
  rtype: ReleaseType;
}

export interface ReleaseProducer extends Producer {
  developer: boolean;
  publisher: boolean;
}

export interface ReleaseImage extends VndbImage {
  type: ImageType;
  vn: VndbId | null;
  languages: Language[] | null;
  photo: boolean;
}

// Producer interface
export interface Producer {
  id: VndbId;
  name: string;
  original: string | null;
  aliases: string[];
  lang: Language;
  type: ProducerType;
  description: string | null;
  extlinks: ExternalLink[];
}

// Character interface
export interface Character {
  id: VndbId;
  name: string;
  original: string | null;
  aliases: string[];
  description: string | null;
  image: VndbImage | null;
  blood_type: BloodType | null;
  height: number | null;
  weight: number | null;
  bust: number | null;
  waist: number | null;
  hips: number | null;
  cup: CupSize | null;
  age: number | null;
  birthday: [number, number] | null;
  sex: [Gender | null, Gender | null] | null;
  gender: [Gender | null, Gender | null] | null;
  vns: CharacterVn[];
  traits: CharacterTrait[];
}

export interface CharacterVn extends VisualNovel {
  spoiler: number;
  role: CharacterRole;
  release: Release | null;
}

export interface CharacterTrait extends Trait {
  spoiler: 0 | 1 | 2;
  lie: boolean;
}

// Staff interface
export interface Staff {
  id: VndbId;
  aid: number;
  ismain: boolean;
  name: string;
  original: string | null;
  lang: Language;
  gender: Gender | null;
  description: string | null;
  extlinks: ExternalLink[];
  aliases: StaffAlias[];
}

export interface StaffAlias {
  aid: number;
  name: string;
  latin: string | null;
  ismain: boolean;
}

// Tag interface
export interface Tag {
  id: VndbId;
  name: string;
  aliases: string[];
  description: string;
  category: TagCategory;
  searchable: boolean;
  applicable: boolean;
  vn_count: number;
}

// Trait interface
export interface Trait {
  id: VndbId;
  name: string;
  aliases: string[];
  description: string;
  searchable: boolean;
  applicable: boolean;
  sexual: boolean;
  group_id: VndbId;
  group_name: string;
  char_count: number;
}

// Quote interface
export interface Quote {
  id: VndbId;
  quote: string;
  score: number;
  vn: VisualNovel[] | null;
  character: Character[] | null;
}

// User list interfaces
export interface UserListEntry {
  id: VndbId;
  added: number;
  voted: number | null;
  lastmod: number;
  vote: number | null;
  started: string | null;
  finished: string | null;
  notes: string | null;
  labels: UserLabel[];
  vn: {
    // All VN fields available
    [key: string]: unknown;
  };
  releases: UserListRelease[];
}

export interface UserLabel {
  id: number;
  label: string;
}

export interface UserListRelease {
  list_status: 0 | 1 | 2 | 3 | 4; // Unknown, Pending, Obtained, On loan, Deleted
  // All release fields available
  [key: string]: unknown;
}

export interface UserLabelInfo extends UserLabel {
  private: boolean;
  count?: number;
}

// Filter types
export type FilterOperator = "=" | "!=" | ">" | ">=" | "<" | "<=";
export type FilterValue =
  | string
  | number
  | boolean
  | null
  | string[]
  | number[]
  | (string | number)[];
export type SimpleFilter = [string, FilterOperator, FilterValue];
export type AndFilter = ["and", ...Filter[]];
export type OrFilter = ["or", ...Filter[]];
export type Filter = SimpleFilter | AndFilter | OrFilter;

// Query interface
export interface ApiQuery {
  filters?: Filter | Filter[] | string;
  fields?: string;
  sort?: string;
  reverse?: boolean;
  results?: number;
  page?: number;
  user?: string | null;
  count?: boolean;
  compact_filters?: boolean;
  normalized_filters?: boolean;
}

// Response interfaces
export interface ApiResponse<T> {
  results: T[];
  more: boolean;
  count?: number;
  compact_filters?: string;
  normalized_filters?: Filter[];
}

// Simple API responses
export interface StatsResponse {
  chars: number;
  producers: number;
  releases: number;
  staff: number;
  tags: number;
  traits: number;
  vn: number;
}

export interface UserInfo {
  id: string;
  username: string;
  lengthvotes?: number;
  lengthvotes_sum?: number;
}

export interface UserLookupResponse {
  [key: string]: UserInfo | null;
}

export interface AuthInfo {
  id: string;
  username: string;
  permissions: ("listread" | "listwrite")[];
}

export interface UserListLabelsResponse {
  labels: UserLabelInfo[];
}

// Error types
export interface VndbError extends Error {
  status?: number;
  response?: unknown;
}

// Client configuration
export interface VndbClientConfig {
  baseURL?: string;
  token?: string;
  timeout?: number;
  userAgent?: string;
  rateLimit?: {
    requests?: number;
    window?: number;
  };
}

// Sort options for different endpoints
export type VnSortField =
  | "id"
  | "title"
  | "released"
  | "rating"
  | "votecount"
  | "searchrank";
export type ReleaseSortField = "id" | "title" | "released" | "searchrank";
export type ProducerSortField = "id" | "name" | "searchrank";
export type CharacterSortField = "id" | "name" | "searchrank";
export type StaffSortField = "id" | "name" | "searchrank";
export type TagSortField = "id" | "name" | "vn_count" | "searchrank";
export type TraitSortField = "id" | "name" | "char_count" | "searchrank";
export type QuoteSortField = "id" | "score";
export type UListSortField =
  | "id"
  | "title"
  | "released"
  | "rating"
  | "votecount"
  | "voted"
  | "vote"
  | "added"
  | "lastmod"
  | "started"
  | "finished"
  | "searchrank";

// Update interfaces for list management
export interface UListUpdateData {
  vote?: number | null;
  notes?: string | null;
  started?: string | null;
  finished?: string | null;
  labels?: number[];
  labels_set?: number[];
  labels_unset?: number[];
}

export interface RListUpdateData {
  status?: 0 | 1 | 2 | 3 | 4;
}
