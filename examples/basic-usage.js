/**
 * Basic usage examples for the VNDB Kana API
 */

import {
  VndbClient,
  filters,
  fields,
  formatRating,
  formatReleaseDate,
  and,
} from "../dist/index.js";

async function basicExamples() {
  // Create a client (no authentication needed for read-only operations)
  const vndb = new VndbClient();

  console.log("=== Basic Examples ===\n");

  // 1. Get database statistics
  console.log("1. Database Statistics:");
  const stats = await vndb.getStats();
  console.log(`Visual Novels: ${stats.vn.toLocaleString()}`);
  console.log(`Releases: ${stats.releases.toLocaleString()}`);
  console.log(`Characters: ${stats.chars.toLocaleString()}\n`);

  // 2. Get a specific visual novel
  console.log("2. Get Visual Novel (Fate/stay night):");
  const vnData = await vndb.getVisualNovel("v11", fields.vnBasic);
  if (vnData) {
    console.log(`Title: ${vnData.title}`);
    console.log(`Rating: ${formatRating(vnData.rating)}`);
    console.log(`Released: ${formatReleaseDate(vnData.released)}`);
    console.log(`Platforms: ${vnData.platforms.join(", ")}\n`);
  }

  // 3. Search for visual novels
  console.log('3. Search Results for "clannad":');
  const searchResults = await vndb.searchVisualNovels(
    "clannad",
    "title,rating,released",
    5
  );
  searchResults.forEach((vn, index) => {
    console.log(
      `${index + 1}. ${vn.title} (${formatRating(
        vn.rating
      )}) - ${formatReleaseDate(vn.released)}`
    );
  });
  console.log();

  // 4. Get a random quote
  console.log("4. Random Quote:");
  const randomQuote = await vndb.getRandomQuote();
  if (randomQuote) {
    console.log(`"${randomQuote.quote}"`);
    if (randomQuote.character && randomQuote.vn) {
      console.log(
        `— ${randomQuote.character.name} from ${randomQuote.vn.title}\n`
      );
    } else {
      console.log("— Unknown source\n");
    }
  }
}

async function advancedQueries() {
  const vndb = new VndbClient();

  console.log("=== Advanced Query Examples ===\n");
  // 1. Find highly-rated English visual novels
  console.log("1. Highly-rated English Visual Novels (Rating >= 85):");

  // This two examples should produce the same results, but the second one is more readable
  // Manually constructing the filter for demonstration
  //   const highRatedEN = await vndb.getVisualNovels({
  //     filters: [
  //       "and",
  //       ["lang", "=", "en"],
  //       ["rating", ">=", 85],
  //       ["released", ">=", "2020-01-01"],
  //     ],
  //     fields: "title,rating,released,languages",
  //     sort: "rating",
  //     reverse: true,
  //     results: 10,
  //   });

  // Using the filters utility for better readability
  const highRatedEN = await vndb.getVisualNovels({
    filters: and(
      filters.language("en"),
      filters.ratingRange(85),
      filters.dateRange("2020-01-01")
    ),
    fields: "title,rating,released,languages",
    sort: "rating",
    reverse: true,
    results: 10,
  });

  highRatedEN.results.forEach((vn, index) => {
    console.log(`${index + 1}. ${vn.title} (${formatRating(vn.rating)})`);
  });
  console.log();
  // 2. Find visual novels with specific tags
  console.log('2. Visual Novels with "School" tag:');
  const schoolVNs = await vndb.getVisualNovels({
    filters: filters.tag("g842"), // School tag
    fields: "title,rating,tags{name,rating}",
    sort: "rating",
    reverse: true,
    results: 5,
  });

  schoolVNs.results.forEach((vn, index) => {
    console.log(`${index + 1}. ${vn.title} (${formatRating(vn.rating)})`);
  });
  console.log();
  // 3. Find recent releases
  console.log("3. Recent Releases (2023-2024):");
  const recentReleases = await vndb.getReleases({
    filters: and(
      filters.dateRange("2023-01-01", "2024-12-31"),
      filters.official()
    ),
    fields: "title,released,platforms,vns.title",
    sort: "released",
    reverse: true,
    results: 10,
  });

  recentReleases.results.forEach((release, index) => {
    console.log(
      `${index + 1}. ${release.title} - ${formatReleaseDate(release.released)}`
    );
    console.log(`   Platforms: ${release.platforms.join(", ")}`);
  });
  console.log();
  // 4. Character search with traits
  console.log('4. Characters with "Ahoge" trait:');
  const ahogeCharacters = await vndb.getCharacters({
    filters: filters.trait("i13"),
    fields: "name,vns{title,role}",
    results: 5,
  });

  ahogeCharacters.results.forEach((char, index) => {
    console.log(`${index + 1}. ${char.name}`);
    if (char.vns.length > 0) {
      console.log(`   From: ${char.vns[0].title} (${char.vns[0].role})`);
    }
  });
  console.log();
}

async function filterExamples() {
  const vndb = new VndbClient();

  console.log("=== Filter Examples ===\n");
  // Complex filter combinations
  console.log(
    "1. Complex Filter - English Nakige from 2000s with high rating:"
  );
  const complexQuery = await vndb.getVisualNovels({
    filters: and(
      filters.language("en"),
      filters.tag("g596"), // Nakige
      filters.dateRange("2000-01-01", "2009-12-31"),
      filters.ratingRange(80)
    ),
    fields: "title,rating,released,tags{name}",
    sort: "rating",
    reverse: true,
    results: 5,
  });

  complexQuery.results.forEach((vn, index) => {
    console.log(`${index + 1}. ${vn.title}`);
    console.log(
      `   Rating: ${formatRating(vn.rating)}, Released: ${formatReleaseDate(
        vn.released
      )}`
    );
  });
  console.log();
  // Platform-specific search
  console.log("2. Nintendo Switch Visual Novels:");
  const switchVNs = await vndb.getVisualNovels({
    filters: and(filters.platform("swi"), filters.language("en")),
    fields: "title,rating,released",
    sort: "released",
    reverse: true,
    results: 10,
  });

  switchVNs.results.forEach((vn, index) => {
    console.log(`${index + 1}. ${vn.title} (${formatRating(vn.rating)})`);
  });
  console.log();
}

async function paginationExample() {
  const vndb = new VndbClient();

  console.log("=== Pagination Example ===\n");

  console.log(
    "Getting all English visual novels with rating >= 90 (demonstrating pagination):"
  );

  const allHighRatedVNs = await vndb.getAllResults(
    (page) =>
      vndb.getVisualNovels({
        filters: and(filters.language("en"), filters.ratingRange(90)),
        fields: "title,rating",
        sort: "rating",
        reverse: true,
        page,
        results: 25,
      }),
    5 // Max 5 pages for demo
  );

  console.log(
    `Found ${allHighRatedVNs.length} highly-rated English visual novels:`
  );
  allHighRatedVNs.slice(0, 10).forEach((vn, index) => {
    console.log(`${index + 1}. ${vn.title} (${formatRating(vn.rating)})`);
  });

  if (allHighRatedVNs.length > 10) {
    console.log(`... and ${allHighRatedVNs.length - 10} more`);
  }
  console.log();
}

// Main execution
async function main() {
  try {
    await basicExamples();
    await advancedQueries();
    await filterExamples();
    await paginationExample();

    console.log("=== Examples completed successfully! ===");
  } catch (error) {
    console.error("Error running examples:", error);
  }
}

// Run the main function
main();
