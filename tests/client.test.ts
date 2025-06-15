import {
  VndbClient,
  filters,
  fields,
  formatRating,
  SimpleFilter,
} from "../src/index";

describe("VndbClient", () => {
  let client: VndbClient;

  beforeEach(() => {
    client = new VndbClient();
  });

  describe("Basic API calls", () => {
    test("should get database stats", async () => {
      const stats = await client.getStats();

      expect(stats).toBeDefined();
      expect(typeof stats.vn).toBe("number");
      expect(typeof stats.releases).toBe("number");
      expect(typeof stats.chars).toBe("number");
      expect(stats.vn).toBeGreaterThan(0);
    });

    test("should get a visual novel by ID", async () => {
      const vn = await client.getVisualNovel("v17", fields.vnBasic);

      expect(vn).toBeDefined();
      expect(vn?.id).toBe("v17");
      expect(vn?.title).toBeDefined();
      expect(typeof vn?.title).toBe("string");
    });

    test("should search visual novels", async () => {
      const results = await client.searchVisualNovels(
        "clannad",
        fields.vnBasic,
        5
      );

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      expect(results.length).toBeLessThanOrEqual(5);

      results.forEach((vn) => {
        expect(vn.id).toBeDefined();
        expect(vn.title).toBeDefined();
      });
    });

    test("should handle non-existent visual novel", async () => {
      const vn = await client.getVisualNovel("v999999");
      expect(vn).toBeNull();
    });
  });

  describe("Advanced queries", () => {
    test("should query with filters", async () => {
      const response = await client.getVisualNovels({
        filters: filters.ratingRange(85),
        fields: "title,rating",
        results: 10,
        sort: "rating",
        reverse: true,
      });

      expect(response.results).toBeDefined();
      expect(Array.isArray(response.results)).toBe(true);
      expect(response.results.length).toBeLessThanOrEqual(10);

      // Check that all results have rating >= 85
      response.results.forEach((vn) => {
        if (vn.rating !== null) {
          expect(vn.rating).toBeGreaterThanOrEqual(85);
        }
      });
    });
    test("should query releases", async () => {
      const response = await client.getReleases({
        filters: filters.platform("win"),
        fields: "title,platforms",
        results: 5,
      });

      expect(response.results).toBeDefined();
      expect(Array.isArray(response.results)).toBe(true);

      response.results.forEach((release) => {
        expect(release.platforms).toContain("win");
      });
    });

    test("should get multiple VNs by IDs", async () => {
      const ids = ["v17", "v11"];
      const vns = await client.getVisualNovelsByIds(ids, "title");

      expect(vns.length).toBe(2);
      expect(vns.map((vn) => vn.id).sort()).toEqual(ids.sort());
    });
  });

  describe("Error handling", () => {
    test("should handle invalid query gracefully", async () => {
      // This should throw an error because 'invalid' is not a valid ID
      await expect(
        client.getVisualNovels({
          filters: ["id", "=", "invalid"] as SimpleFilter,
          results: 1,
        })
      ).rejects.toThrow();
    });
  });

  describe("Utility functions", () => {
    test("should format ratings correctly", () => {
      expect(formatRating(85)).toBe("8.5");
      expect(formatRating(100)).toBe("10.0");
      expect(formatRating(null)).toBe("Not rated");
    });
  });

  describe("Filter utilities", () => {
    test("should create proper ID filters", () => {
      const singleId = filters.id("v17");
      expect(singleId).toEqual(["id", "=", "v17"]);

      const multipleIds = filters.id(["v17", "v11"]);
      expect(multipleIds).toEqual([
        "or",
        ["id", "=", "v17"],
        ["id", "=", "v11"],
      ]);
    });

    test("should create search filters", () => {
      const searchFilter = filters.search("clannad");
      expect(searchFilter).toEqual(["search", "=", "clannad"]);
    });

    test("should create rating range filters", () => {
      const ratingFilter = filters.ratingRange(80, 95);
      expect(ratingFilter).toEqual([
        "and",
        ["rating", ">=", 80],
        ["rating", "<=", 95],
      ]);
    });
  });
});

// Integration tests (these hit the real API)
describe("Integration Tests", () => {
  let client: VndbClient;

  beforeEach(() => {
    client = new VndbClient();
  });

  test("should fetch real data from VNDB", async () => {
    // Test with a well-known VN (Fate/stay night)
    const vn = await client.getVisualNovel("v11", "title,rating,released");

    expect(vn).toBeDefined();
    expect(vn?.title).toBeDefined();
    expect(vn?.id).toBe("v11");
  }, 10000); // Extended timeout for network calls

  test("should get random quote", async () => {
    const quote = await client.getRandomQuote();

    expect(quote).toBeDefined();
    expect(quote?.quote).toBeDefined();
    expect(typeof quote?.quote).toBe("string");
    expect(quote?.vn).toBeDefined();
  }, 10000);
});
