# VNDB Kana API Wrapper

> **⚠️ Under Development**  
> This package is under active development. Some functions may be untested and could produce unexpected behavior. Use with caution in production environments.

A type-safe TypeScript wrapper for the [VNDB Kana API (v2)](https://api.vndb.org/kana). Query the VNDB (Visual Novel Database) with full TypeScript support and built-in error handling.

## Features

- 🚀 **Complete API Coverage** - All VNDB Kana API endpoints
- 📝 **TypeScript Support** - Full type definitions
- 🛡️ **Error Handling** - Built-in retry logic
- 🎯 **Filter Utilities** - Helper functions for queries
- 📊 **Rate Limiting** - Respects API limits
- 🔧 **User Lists** - Authenticated operations support

## Installation

```bash
# Not yet published
npm install vndb-kana-api
```

## Quick Start

```typescript
import { VndbClient, filters, fields } from "vndb-kana-api";

// Create a client
const vndb = new VndbClient();

// Search for visual novels
const results = await vndb.searchVisualNovels("fate stay night");

// Get a specific visual novel
const vn = await vndb.getVisualNovel("v11", fields.vnDetailed);

// Query with filters
const highRated = await vndb.getVisualNovels({
  filters: filters.ratingRange(80, 100),
  fields: fields.vnBasic,
  sort: "rating",
  reverse: true,
});
```

## Authentication

For user list operations, you need an API token:

```typescript
const vndb = new VndbClient({
  token: "your-api-token-here", // Get from https://vndb.org/u/tokens
});

// Update user's visual novel list
await vndb.updateUserListEntry("v11", {
  vote: 85,
  notes: "Great visual novel!",
});
```

## Common Usage Examples

### Search and Filter

```typescript
// Search visual novels
const vns = await vndb.searchVisualNovels("clannad");

// Filter by language and rating
const results = await vndb.getVisualNovels({
  filters: filters.and(filters.language(["en", "ja"]), filters.ratingRange(80)),
  fields: "title,rating,released",
});
```

### Other Database Queries

```typescript
// Get releases, characters, staff
const release = await vndb.getRelease("r12");
const character = await vndb.getCharacter("c1");
const staff = await vndb.getStaffMember("s81");
```

## Filter Utilities

```typescript
import { filters, and, or } from "vndb-kana-api";

// Basic filters
filters.search("clannad");
filters.language(["en", "ja"]);
filters.ratingRange(80, 100);
filters.dateRange("2020-01-01");

// Tags and traits
filters.tag("g596"); // Nakige tag
filters.trait("i13"); // Ahoge trait

// Boolean filters
filters.hasDescription();
filters.hasAnime();
filters.finished();

// Complex combinations
const complexFilter = and(
  filters.language("en"),
  or(filters.tag("g596"), filters.tag("g193"))
);
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

## Documentation

- [API Reference](docs/API_REFERENCE.md) - Complete function reference
- [VNDB API Docs](https://api.vndb.org/kana) - Official API documentation

## License

MIT License - see [LICENSE](LICENSE) file for details.
