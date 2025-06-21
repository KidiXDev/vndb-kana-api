# API Reference

> **⚠️ Development Notice**  
> This package is under active development. Some functions may be untested and could produce unexpected behavior. Use with caution in production environments.

Simple reference for the VNDB Kana API wrapper.

## Quick Start

```typescript
import { VndbClient } from "vndb-kana-api";

const vndb = new VndbClient({
  token: "your-api-token", // Optional, required for user operations
});
```

## Basic Operations

### Get Visual Novel

```typescript
// Single VN
const vn = await vndb.getVisualNovel("v11");

// Search by title
const results = await vndb.searchVisualNovels("clannad");

// Multiple VNs
const vns = await vndb.getVisualNovelsByIds(["v11", "v17"]);
```

### Other Database Queries

```typescript
// Releases, characters, staff, producers, tags, traits
const release = await vndb.getRelease("r1");
const character = await vndb.getCharacter("c1");
const staff = await vndb.getStaffMember("s1");
const producer = await vndb.getProducer("p1");
const tag = await vndb.getTag("g1");
const trait = await vndb.getTrait("i1");

// Random quote
const quote = await vndb.getRandomQuote();
```

## Advanced Queries

### Using Filters

```typescript
import { filters, and, or } from "vndb-kana-api";

// Simple filters
const highRated = await vndb.getVisualNovels({
  filters: ["rating", ">=", 85],
  sort: "rating",
  reverse: true,
});

// Complex filters with helper functions
const complexQuery = await vndb.getVisualNovels({
  filters: and(
    filters.language(["en", "ja"]),
    filters.ratingRange(80),
    or(
      filters.tag("g596"), // Nakige
      filters.tag("g104") // Comedy
    )
  ),
  fields: "title,rating,released",
});
```

### Common Filter Examples

```typescript
// Language and platform filters
filters.language("en"); // English only
filters.platform(["win", "lin"]); // Windows or Linux

// Rating and date ranges
filters.ratingRange(75, 95); // Between 75-95
filters.dateRange("2020-01-01", "2023-12-31");

// Boolean filters
filters.hasDescription(); // Has description
filters.hasAnime(); // Has anime adaptation
filters.finished(); // Development finished
filters.freeware(); // Free to play
```

## User Operations

> **⚠️ Note:** Requires authentication token

```typescript
// Get user's VN list
const userList = await vndb.getUserList({
  user: "u2",
  sort: "vote",
  reverse: true,
});

// Update list entry
await vndb.updateUserListEntry("v11", {
  vote: 90,
  notes: "Great story!",
  finished: "2024-01-15",
});

// Delete from list
await vndb.deleteUserListEntry("v11");
```

## Field Selection

```typescript
import { fields } from "vndb-kana-api";

// Use predefined field sets
const vns = await vndb.getVisualNovels({
  fields: fields.vnBasic, // 'title,released,rating,platforms'
  filters: filters.language("en"),
});

// Or specify custom fields
const customFields = "title,rating,image.url,developers.name";
```

## Error Handling

```typescript
import { isVndbError, isRateLimitError } from "vndb-kana-api";

try {
  const vn = await vndb.getVisualNovel("v11");
} catch (error) {
  if (isRateLimitError(error)) {
    console.log("Rate limited, retry after:", error.retryAfter);
  } else if (isVndbError(error)) {
    console.log("API error:", error.friendlyMessage);
  }
}
```

## Utilities

### Formatting

```typescript
import { formatRating, formatPlayTime, formatReleaseDate } from "vndb-kana-api";

formatRating(85); // "8.5"
formatPlayTime(1440); // "1d 0h"
formatReleaseDate("2004-04-28"); // "4/28/2004"
```

### ID Validation

```typescript
import { isValidVndbId, parseVndbId } from "vndb-kana-api";

isValidVndbId("v11"); // true
parseVndbId("v11"); // { type: 'v', number: 11 }
```

### Pagination

```typescript
import { getAllResults } from "vndb-kana-api";

// Get all results across multiple pages
const allResults = await getAllResults((page) =>
  vndb.getVisualNovels({
    filters: ["rating", ">=", 85],
    page,
    results: 100,
  })
);
```

## Configuration Options

```typescript
const vndb = new VndbClient({
  baseURL: "https://api.vndb.org/kana", // API endpoint
  token: "your-token", // Authentication
  timeout: 30000, // Request timeout (ms)
  userAgent: "MyApp/1.0.0", // Custom user agent
  rateLimit: {
    requests: 200, // Max requests per window
    window: 300000, // Time window (ms)
  },
});
```

## Common Query Patterns

```typescript
// Top-rated English VNs
const topRated = await vndb.getVisualNovels({
  filters: and(filters.language("en"), filters.ratingRange(85)),
  sort: "rating",
  reverse: true,
  results: 50,
});

// Recent releases for specific platform
const recentReleases = await vndb.getReleases({
  filters: and(filters.platform("win"), filters.dateRange("2023-01-01")),
  sort: "released",
  reverse: true,
});

// Characters with specific traits
const characters = await vndb.getCharacters({
  filters: and(
    filters.trait("i59"), // Blonde hair
    ["sex", "=", "f"] // Female
  ),
  fields: "name,image.url,vns.title",
});
```

### Field Selection Presets

```typescript
import { fields } from "vndb-kana-api";

// Visual novel fields
fields.vnBasic; // 'title,released,rating,platforms'
fields.vnDetailed; // Commonly used fields
fields.vnFull; // All available fields

// Release fields
fields.releaseBasic;
fields.releaseDetailed;

// Character fields
fields.characterBasic;
fields.characterDetailed;

// Producer fields
fields.producerBasic;
fields.producerDetailed;

// Staff fields
fields.staffBasic;
fields.staffDetailed;

// Tag/Trait fields
fields.tagBasic;
fields.traitBasic;
```

## User List Management

**Note:** These operations require authentication.

### Get User List

```typescript
getUserList(query: ApiQuery & { user: string; sort?: UListSortField }): Promise<ApiResponse<UserListEntry>>
```

**Sort Options:** `'id' | 'title' | 'released' | 'rating' | 'votecount' | 'voted' | 'vote' | 'added' | 'lastmod' | 'started' | 'finished' | 'searchrank'`

### Get User Labels

```typescript
getUserLabels(userId?: string, fields?: string[]): Promise<UserListLabelsResponse>
```

### Update User List Entry

```typescript
updateUserListEntry(vnId: string, data: UListUpdateData): Promise<void>

interface UListUpdateData {
  vote?: number | null;         // 10-100
  notes?: string | null;
  started?: string | null;      // Date string
  finished?: string | null;     // Date string
  labels?: number[];            // Replace all labels
  labels_set?: number[];        // Add labels
  labels_unset?: number[];      // Remove labels
}
```

### Delete User List Entry

```typescript
deleteUserListEntry(vnId: string): Promise<void>
```

### Release List Management

```typescript
updateUserReleaseEntry(releaseId: string, data: RListUpdateData): Promise<void>
deleteUserReleaseEntry(releaseId: string): Promise<void>

interface RListUpdateData {
  status?: 0 | 1 | 2 | 3 | 4;  // Unknown, Pending, Obtained, On loan, Deleted
}
```

## Error Handling

### Error Classes

```typescript
// Base API error
class VndbApiError extends Error {
  status?: number;
  response?: any;
  isRateLimit: boolean;
  isAuthError: boolean;
  isClientError: boolean;
  isServerError: boolean;
  friendlyMessage: string;
}

// Specific error types
class VndbRateLimitError extends VndbApiError {
  retryAfter?: number;
}

class VndbAuthenticationError extends VndbApiError {}
class VndbValidationError extends Error {}
```

### Error Checking

```typescript
import { isVndbError, isRateLimitError, isAuthError } from "vndb-kana-api";

try {
  const vn = await vndb.getVisualNovel("v11");
} catch (error) {
  if (isRateLimitError(error)) {
    console.log("Rate limited, retry after:", error.retryAfter);
  } else if (isAuthError(error)) {
    console.log("Authentication failed");
  } else if (isVndbError(error)) {
    console.log("API error:", error.friendlyMessage);
  }
}
```

### Retry Logic

```typescript
import { withRetry, defaultRetryConfig } from "vndb-kana-api";

const result = await withRetry(() => vndb.getVisualNovel("v11"), {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
});
```

## Utility Functions

### Formatting Functions

```typescript
import {
  formatRating,
  formatPlayTime,
  formatReleaseDate,
  formatDevStatus,
  formatCharacterRole,
  formatProducerType,
  getLengthCategory,
} from "vndb-kana-api";

formatRating(85); // "8.5"
formatPlayTime(1440); // "1d 0h"
formatReleaseDate("2004-04-28"); // "4/28/2004"
formatDevStatus(0); // "Finished"
formatCharacterRole("main"); // "Protagonist"
formatProducerType("co"); // "Company"
getLengthCategory(600); // "Short"
```

### ID Utilities

```typescript
import { parseVndbId, isValidVndbId } from "vndb-kana-api";

parseVndbId("v11"); // { type: 'v', number: 11 }
isValidVndbId("v11"); // true
isValidVndbId("v11", "v"); // true (with type check)
```

### Pagination Utilities

```typescript
import { buildPaginationInfo, getAllResults } from "vndb-kana-api";

// Get pagination info
const pagination = buildPaginationInfo(response, currentPage);

// Get all results across pages
const allResults = await getAllResults(
  (page) =>
    vndb.getVisualNovels({
      filters: ["rating", ">=", 85],
      page,
      results: 100,
    }),
  10 // Max pages
);
```

### Other Utilities

```typescript
import { chunk, debounce, throttle, RateLimiter } from "vndb-kana-api";

// Chunk arrays
const chunks = chunk([1, 2, 3, 4, 5], 2); // [[1, 2], [3, 4], [5]]

// Rate limiting
const limiter = new RateLimiter(200, 300000);
if (limiter.canMakeRequest()) {
  limiter.recordRequest();
  // Make API call
}

// Function utilities
const debouncedFn = debounce(myFunction, 1000);
const throttledFn = throttle(myFunction, 1000);
```

## Query Examples

### Basic Queries

```typescript
// Get a specific VN
const vn = await vndb.getVisualNovel("v11");

// Search by title
const results = await vndb.searchVisualNovels("fate");

// Get multiple VNs
const vns = await vndb.getVisualNovelsByIds(["v11", "v17"]);
```

### Advanced Queries

```typescript
// High-rated English VNs from recent years
const results = await vndb.getVisualNovels({
  filters: [
    "and",
    ["lang", "=", "en"],
    ["rating", ">=", 85],
    ["released", ">=", "2020-01-01"],
  ],
  fields: "title,rating,released",
  sort: "rating",
  reverse: true,
  results: 25,
});

// Characters with specific traits
const characters = await vndb.getCharacters({
  filters: [
    "and",
    ["trait", "=", "i59"], // Blonde hair
    ["sex", "=", "f"], // Female
  ],
  fields: "name,image.url,vns.title",
});

// Releases for specific platforms
const releases = await vndb.getReleases({
  filters: [
    "or",
    ["platform", "=", "swi"], // Nintendo Switch
    ["platform", "=", "ps5"], // PlayStation 5
  ],
  fields: "title,platforms,released",
  sort: "released",
  reverse: true,
});
```

### User List Queries

```typescript
// Get user's top-rated VNs
const topRated = await vndb.getUserList({
  user: "u2",
  filters: [
    "and",
    ["vote", ">=", 80],
    ["label", "=", 7], // Voted label
  ],
  fields: "vote,vn.title",
  sort: "vote",
  reverse: true,
});

// Update user list entry
await vndb.updateUserListEntry("v11", {
  vote: 90,
  started: "2024-01-01",
  finished: "2024-01-15",
  labels_set: [2], // Finished label
  notes: "Excellent story!",
});
```
