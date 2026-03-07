import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import type {
  VndbClientConfig,
  ApiQuery,
  ApiResponse,
  StatsResponse,
  UserLookupResponse,
  AuthInfo,
  UserListLabelsResponse,
  VisualNovel,
  Release,
  Producer,
  Character,
  Staff,
  Tag,
  Trait,
  Quote,
  UserListEntry,
  UListUpdateData,
  RListUpdateData,
  VnSortField,
  ReleaseSortField,
  ProducerSortField,
  CharacterSortField,
  StaffSortField,
  TagSortField,
  TraitSortField,
  QuoteSortField,
  UListSortField,
  Filter,
  SimpleFilter,
  AndFilter,
  FieldSelection,
} from "../types/index.js";
import {
  VndbApiError,
  VndbRateLimitError,
  VndbAuthenticationError,
  VndbValidationError,
  sleep,
} from "./errors.js";
import { RateLimiter, isValidVndbId, chunk } from "./utils.js";

/**
 * VNDB Kana API Client
 *
 * A complete TypeScript wrapper for the VNDB Kana API (v2)
 *
 * @example
 * ```typescript
 * import { VndbClient } from 'vndb-kana-api';
 *
 * const client = new VndbClient({
 *   token: 'your-api-token' // Optional for read-only operations
 * });
 *
 * // Search for visual novels
 * const vns = await client.getVisualNovels({
 *   filters: [['search', '=', 'fate stay night']],
 *   fields: 'title,released,rating',
 *   results: 10
 * });
 * ```
 */
export class VndbClient {
  private readonly http: AxiosInstance;
  private readonly config: Required<VndbClientConfig>;
  private token: string;
  private rateLimiter: RateLimiter;

  /**
   * Create a new VNDB API client
   * @param config - Client configuration options
   */
  constructor(config: VndbClientConfig = {}) {
    this.token = config.token ?? "";
    this.config = {
      baseURL: config.baseURL ?? "https://api.vndb.org/kana",
      token: config.token ?? "",
      timeout: config.timeout ?? 30000,
      userAgent: config.userAgent ?? "vndb-kana-api/1.0.0",
      rateLimit: {
        requests: config.rateLimit?.requests ?? 200,
        window: config.rateLimit?.window ?? 300000, // 5 minutes
      },
    };

    this.rateLimiter = new RateLimiter(
      this.config.rateLimit.requests ?? 200,
      this.config.rateLimit.window ?? 300000,
    );

    this.http = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        "User-Agent": this.config.userAgent,
        "Content-Type": "application/json",
        ...(this.token && {
          Authorization: `Token ${this.token}`,
        }),
      },
    });

    // Add request interceptor to enforce rate limiting
    this.http.interceptors.request.use(async (axiosConfig) => {
      if (!this.rateLimiter.canMakeRequest()) {
        const waitMs = this.rateLimiter.getTimeUntilNextRequest();
        await sleep(waitMs);
      }
      this.rateLimiter.recordRequest();
      return axiosConfig;
    });

    // Add response interceptor for error handling
    this.http.interceptors.response.use(
      (response) => response,
      (error) => {
        const status: number | undefined = error.response?.status;
        if (status === 429) throw new VndbRateLimitError();
        if (status === 401) throw new VndbAuthenticationError();
        throw new VndbApiError(
          error.response?.data?.message ?? error.message ?? "Unknown API error",
          status,
          error.response?.data,
        );
      },
    );
  }

  /**
   * Normalize query parameters for the API
   * @param query - Raw query parameters
   * @returns Normalized query parameters
   */
  private prepareQuery<T extends ApiQuery>(query: T): T {
    const prepared = { ...query };
    if (Array.isArray(prepared.fields)) {
      prepared.fields = prepared.fields.join(",");
    }
    return prepared;
  }

  /**
   * Update the authentication token
   * @param token - New API token
   */
  setToken(token: string): void {
    this.token = token;
    this.http.defaults.headers.Authorization = `Token ${token}`;
  }

  /**
   * Remove the authentication token
   */
  clearToken(): void {
    this.token = "";
    delete this.http.defaults.headers.Authorization;
  }

  // Simple API endpoints

  /**
   * Get database statistics
   * @returns Database statistics
   */
  async getStats(): Promise<StatsResponse> {
    const response = await this.http.get<StatsResponse>("/stats");
    return response.data;
  }
  /**
   * Get API schema information
   * @returns Schema object with metadata about API objects
   */
  async getSchema(): Promise<Record<string, unknown>> {
    const response = await this.http.get("/schema");
    return response.data;
  }

  /**
   * Look up users by ID or username
   * @param queries - User IDs or usernames to look up
   * @param fields - Additional fields to select
   * @returns User lookup results
   */
  async getUsers(
    queries: string[],
    fields?: string[],
  ): Promise<UserLookupResponse> {
    const params = new URLSearchParams();
    queries.forEach((q) => params.append("q", q));
    if (fields?.length) {
      params.append("fields", fields.join(","));
    }

    const response = await this.http.get<UserLookupResponse>(
      `/user?${params.toString()}`,
    );
    return response.data;
  }

  /**
   * Validate and get information about the current API token
   * @returns Authentication information
   */
  async getAuthInfo(): Promise<AuthInfo> {
    const response = await this.http.get<AuthInfo>("/authinfo");
    return response.data;
  }

  /**
   * Get user list labels
   * @param userId - User ID (optional, defaults to authenticated user)
   * @param fields - Additional fields to select
   * @returns User labels
   */
  async getUserLabels(
    userId?: string,
    fields?: string[],
  ): Promise<UserListLabelsResponse> {
    const params = new URLSearchParams();
    if (userId) params.append("user", userId);
    if (fields?.length) params.append("fields", fields.join(","));

    const response = await this.http.get<UserListLabelsResponse>(
      `/ulist_labels?${params.toString()}`,
    );
    return response.data;
  }

  // Database querying endpoints

  /**
   * Query visual novel entries
   * @param query - Query parameters
   * @returns Visual novel search results
   */
  async getVisualNovels(
    query: ApiQuery<VisualNovel> & { sort?: VnSortField } = {},
  ): Promise<ApiResponse<VisualNovel>> {
    const response = await this.http.post<ApiResponse<VisualNovel>>(
      "/vn",
      this.prepareQuery(query),
    );
    return response.data;
  }
  /**
   * Get a single visual novel by ID
   * @param id - Visual novel ID
   * @param fields - Fields to select
   * @returns Visual novel data
   */
  async getVisualNovel(
    id: string,
    fields?: FieldSelection<VisualNovel>,
  ): Promise<VisualNovel | null> {
    if (!isValidVndbId(id, "v")) {
      throw new VndbValidationError(
        `Invalid visual novel ID: "${id}". Expected format: v<number> (e.g. v17)`,
      );
    }
    const result = await this.getVisualNovels({
      filters: ["id", "=", id] as SimpleFilter,
      fields,
      results: 1,
    });
    return result.results[0] || null;
  }

  /**
   * Query release entries
   * @param query - Query parameters
   * @returns Release search results
   */
  async getReleases(
    query: ApiQuery<Release> & { sort?: ReleaseSortField } = {},
  ): Promise<ApiResponse<Release>> {
    const response = await this.http.post<ApiResponse<Release>>(
      "/release",
      this.prepareQuery(query),
    );
    return response.data;
  }
  /**
   * Get a single release by ID
   * @param id - Release ID
   * @param fields - Fields to select
   * @returns Release data
   */
  async getRelease(
    id: string,
    fields?: FieldSelection<Release>,
  ): Promise<Release | null> {
    if (!isValidVndbId(id, "r")) {
      throw new VndbValidationError(
        `Invalid release ID: "${id}". Expected format: r<number> (e.g. r123)`,
      );
    }
    const result = await this.getReleases({
      filters: ["id", "=", id] as SimpleFilter,
      fields,
      results: 1,
    });
    return result.results[0] || null;
  }

  /**
   * Query producer entries
   * @param query - Query parameters
   * @returns Producer search results
   */
  async getProducers(
    query: ApiQuery<Producer> & { sort?: ProducerSortField } = {},
  ): Promise<ApiResponse<Producer>> {
    const response = await this.http.post<ApiResponse<Producer>>(
      "/producer",
      this.prepareQuery(query),
    );
    return response.data;
  }
  /**
   * Get a single producer by ID
   * @param id - Producer ID
   * @param fields - Fields to select
   * @returns Producer data
   */
  async getProducer(
    id: string,
    fields?: FieldSelection<Producer>,
  ): Promise<Producer | null> {
    if (!isValidVndbId(id, "p")) {
      throw new VndbValidationError(
        `Invalid producer ID: "${id}". Expected format: p<number> (e.g. p123)`,
      );
    }
    const result = await this.getProducers({
      filters: ["id", "=", id] as SimpleFilter,
      fields,
      results: 1,
    });
    return result.results[0] || null;
  }

  /**
   * Query character entries
   * @param query - Query parameters
   * @returns Character search results
   */
  async getCharacters(
    query: ApiQuery<Character> & { sort?: CharacterSortField } = {},
  ): Promise<ApiResponse<Character>> {
    const response = await this.http.post<ApiResponse<Character>>(
      "/character",
      this.prepareQuery(query),
    );
    return response.data;
  }
  /**
   * Get a single character by ID
   * @param id - Character ID
   * @param fields - Fields to select
   * @returns Character data
   */
  async getCharacter(
    id: string,
    fields?: FieldSelection<Character>,
  ): Promise<Character | null> {
    if (!isValidVndbId(id, "c")) {
      throw new VndbValidationError(
        `Invalid character ID: "${id}". Expected format: c<number> (e.g. c456)`,
      );
    }
    const result = await this.getCharacters({
      filters: ["id", "=", id] as SimpleFilter,
      fields,
      results: 1,
    });
    return result.results[0] || null;
  }

  /**
   * Query staff entries
   * @param query - Query parameters
   * @returns Staff search results
   */
  async getStaff(
    query: ApiQuery<Staff> & { sort?: StaffSortField } = {},
  ): Promise<ApiResponse<Staff>> {
    const response = await this.http.post<ApiResponse<Staff>>(
      "/staff",
      this.prepareQuery(query),
    );
    return response.data;
  }
  /**
   * Get a single staff member by ID
   * @param id - Staff ID
   * @param fields - Fields to select
   * @returns Staff data
   */
  async getStaffMember(
    id: string,
    fields?: FieldSelection<Staff>,
  ): Promise<Staff | null> {
    if (!isValidVndbId(id, "s")) {
      throw new VndbValidationError(
        `Invalid staff ID: "${id}". Expected format: s<number> (e.g. s123)`,
      );
    }
    const result = await this.getStaff({
      filters: ["and", ["ismain", "=", 1], ["id", "=", id]] as AndFilter,
      fields,
      results: 1,
    });
    return result.results[0] || null;
  }

  /**
   * Query tag entries
   * @param query - Query parameters
   * @returns Tag search results
   */
  async getTags(
    query: ApiQuery<Tag> & { sort?: TagSortField } = {},
  ): Promise<ApiResponse<Tag>> {
    const response = await this.http.post<ApiResponse<Tag>>(
      "/tag",
      this.prepareQuery(query),
    );
    return response.data;
  }
  /**
   * Get a single tag by ID
   * @param id - Tag ID
   * @param fields - Fields to select
   * @returns Tag data
   */
  async getTag(id: string, fields?: FieldSelection<Tag>): Promise<Tag | null> {
    if (!isValidVndbId(id, "g")) {
      throw new VndbValidationError(
        `Invalid tag ID: "${id}". Expected format: g<number> (e.g. g123)`,
      );
    }
    const result = await this.getTags({
      filters: ["id", "=", id] as SimpleFilter,
      fields,
      results: 1,
    });
    return result.results[0] || null;
  }

  /**
   * Query trait entries
   * @param query - Query parameters
   * @returns Trait search results
   */
  async getTraits(
    query: ApiQuery<Trait> & { sort?: TraitSortField } = {},
  ): Promise<ApiResponse<Trait>> {
    const response = await this.http.post<ApiResponse<Trait>>(
      "/trait",
      this.prepareQuery(query),
    );
    return response.data;
  }
  /**
   * Get a single trait by ID
   * @param id - Trait ID
   * @param fields - Fields to select
   * @returns Trait data
   */
  async getTrait(
    id: string,
    fields?: FieldSelection<Trait>,
  ): Promise<Trait | null> {
    if (!isValidVndbId(id, "i")) {
      throw new VndbValidationError(
        `Invalid trait ID: "${id}". Expected format: i<number> (e.g. i123)`,
      );
    }
    const result = await this.getTraits({
      filters: ["id", "=", id] as SimpleFilter,
      fields,
      results: 1,
    });
    return result.results[0] || null;
  }

  /**
   * Query quote entries
   * @param query - Query parameters
   * @returns Quote search results
   */
  async getQuotes(
    query: ApiQuery<Quote> & { sort?: QuoteSortField } = {},
  ): Promise<ApiResponse<Quote>> {
    const response = await this.http.post<ApiResponse<Quote>>(
      "/quote",
      this.prepareQuery(query),
    );
    return response.data;
  }
  /**
   * Get a quote from the database
   * @param fields - Fields to select
   * @returns A quote entry (sorted by id; not truly random due to API constraints)
   */
  async getRandomQuote(fields?: FieldSelection<Quote>): Promise<Quote | null> {
    const result = await this.getQuotes({
      sort: "id",
      fields: fields || "vn{id,title},character{id,name},quote",
      results: 1,
    });
    return result.results[0] || null;
  }

  // User list management

  /**
   * Get a user's visual novel list
   * @param query - Query parameters (user field is required)
   * @returns User list entries
   */
  async getUserList(
    query: ApiQuery<UserListEntry> & { sort?: UListSortField; user: string },
  ): Promise<ApiResponse<UserListEntry>> {
    const response = await this.http.post<ApiResponse<UserListEntry>>(
      "/ulist",
      this.prepareQuery(query),
    );
    return response.data;
  }

  /**
   * Add or update a visual novel in user's list
   * @param vnId - Visual novel ID
   * @param data - Update data
   * @returns Promise that resolves when update is complete
   */
  async updateUserListEntry(
    vnId: string,
    data: UListUpdateData,
  ): Promise<void> {
    await this.http.patch(`/ulist/${vnId}`, data);
  }

  /**
   * Remove a visual novel from user's list
   * @param vnId - Visual novel ID
   * @returns Promise that resolves when deletion is complete
   */
  async deleteUserListEntry(vnId: string): Promise<void> {
    await this.http.delete(`/ulist/${vnId}`);
  }

  /**
   * Add or update a release in user's list
   * @param releaseId - Release ID
   * @param data - Update data
   * @returns Promise that resolves when update is complete
   */
  async updateUserReleaseEntry(
    releaseId: string,
    data: RListUpdateData,
  ): Promise<void> {
    await this.http.patch(`/rlist/${releaseId}`, data);
  }

  /**
   * Remove a release from user's list
   * @param releaseId - Release ID
   * @returns Promise that resolves when deletion is complete
   */
  async deleteUserReleaseEntry(releaseId: string): Promise<void> {
    await this.http.delete(`/rlist/${releaseId}`);
  }

  // Utility methods
  /**
   * Search for visual novels by title
   * @param title - Title to search for
   * @param fields - Fields to select
   * @param limit - Maximum number of results
   * @returns Visual novel search results
   */
  async searchVisualNovels(
    title: string,
    fields?: FieldSelection<VisualNovel>,
    limit: number = 25,
  ): Promise<VisualNovel[]> {
    const result = await this.getVisualNovels({
      filters: ["search", "=", title] as SimpleFilter,
      fields,
      results: limit,
      sort: "searchrank",
    });
    return result.results;
  }
  /**
   * Get visual novels by multiple IDs
   * @param ids - Array of visual novel IDs
   * @param fields - Fields to select
   * @returns Visual novels
   */ async getVisualNovelsByIds(
    ids: string[],
    fields?: FieldSelection<VisualNovel>,
  ): Promise<VisualNovel[]> {
    if (ids.length === 0) return [];

    const batches = chunk(ids, 100);
    const results: VisualNovel[] = [];

    for (const batch of batches) {
      const batchFilter: Filter =
        batch.length === 1
          ? ["id", "=", batch[0]]
          : ["or", ...batch.map((id) => ["id", "=", id] as SimpleFilter)];

      const result = await this.getVisualNovels({
        filters: batchFilter,
        fields,
        results: batch.length,
      });
      results.push(...result.results);
    }

    return results;
  }

  /**
   * Get voice actors for a specific character in a visual novel
   * @param characterId - Character ID
   * @param vnid - Visual novel ID
   * @returns List of voice actor names
   **/
  async getCharacterVoiceActors(
    characterId: string,
    vnid: string,
  ): Promise<{ name: string; note: string | null }[]> {
    const result = await this.getVisualNovel(
      vnid,
      "va{note,staff{name,id},character{id}}",
    );

    return (
      result?.va
        ?.filter((va) => va.character.id === characterId)
        .map((va) => ({
          name: va.staff.name,
          note: va.note ?? null,
        })) ?? []
    );
  }

  /**
   * Get all voice actors mapped with their characters in a VN
   * @param vnid
   * @returns List of voice actors with character id, name, and note
   */
  async getAllCharacterVoiceActors(
    vnid: string,
  ): Promise<{ character_id: string; name: string; note: string | null }[]> {
    const res = await this.getVisualNovel(
      vnid,
      "va{character{id},staff{name,id},note}",
    );

    return (
      res?.va?.map((va) => ({
        character_id: va.character.id,
        name: va.staff.name,
        note: va.note ?? null,
      })) ?? []
    );
  }

  /**
   * Get all results from a paginated query
   * @param queryFn - Function that returns a query for a given page
   * @param maxPages - Maximum number of pages to fetch (safety limit)
   * @param delayMs - Delay in milliseconds between page requests (default: 500ms)
   * @returns All results
   */
  async getAllResults<T>(
    queryFn: (page: number) => Promise<ApiResponse<T>>,
    maxPages: number = 100,
    delayMs: number = 500,
  ): Promise<T[]> {
    const results: T[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore && page <= maxPages) {
      if (page > 1 && delayMs > 0) {
        await sleep(delayMs);
      }
      const response = await queryFn(page);
      results.push(...response.results);
      hasMore = response.more;
      page++;
    }

    return results;
  }

  /**
   * Make a raw API request
   * @param config - Axios request configuration
   * @returns Response data
   */
  async request<T>(config: AxiosRequestConfig): Promise<T> {
    const response = await this.http.request<T>(config);
    return response.data;
  }
}

/**
 * Create a new VNDB client instance
 * @param config - Client configuration
 * @returns VNDB client instance
 */
export function createVndbClient(config?: VndbClientConfig): VndbClient {
  return new VndbClient(config);
}

// Export default instance for quick usage
export const vndb = new VndbClient();
