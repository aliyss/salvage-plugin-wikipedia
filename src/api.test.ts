import { describe, expect, test } from "bun:test";

import { articleOf, backlinks, pageUrl, summaries } from "./api";


describe("the article a link names", () => {
  test("is read out of a page address, in any of its forms", () => {
    expect(articleOf("https://en.wikipedia.org/wiki/Alan_Turing")).toEqual({
      language: "en",
      title: "Alan Turing",
    });
    expect(
      articleOf("https://de.m.wikipedia.org/wiki/K%C3%B6ln"),
    ).toEqual({ language: "de", title: "Köln" });
    expect(
      articleOf("https://en.wikipedia.org/w/index.php?title=Turing_test&oldid=1"),
    ).toEqual({ language: "en", title: "Turing test" });
  });

  test("is null for a link that is not an article", () => {
    expect(articleOf("https://en.wikipedia.org/wiki/")).toBeNull();
    expect(articleOf("https://example.com/wiki/Thing")).toBeNull();
    expect(articleOf(null)).toBeNull();
  });

  test("round trips through the address a card links to", () => {
    expect(pageUrl("en", "Alan Turing")).toBe(
      "https://en.wikipedia.org/wiki/Alan_Turing",
    );
  });
});

describe("what Wikipedia answers", () => {
  test("maps a redirect back to the name that was asked for", async () => {
    const original = globalThis.fetch.bind(globalThis);
    globalThis.fetch = (async () =>
      new Response(
        JSON.stringify({
          query: {
            normalized: [{ from: "alan_turing", to: "Alan Turing" }],
            redirects: [
              { from: "Alan Turing", to: "Alan Turing (disambiguation)" },
            ],
            pages: [
              {
                title: "Alan Turing (disambiguation)",
                extract: "Several things are called Alan Turing.",
                description: "Topics referred to by the same term",
              },
            ],
          },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      )) as unknown as typeof fetch;

    try {
      const found = await summaries("en", ["alan_turing"]);
      expect(found.get("alan_turing")?.title).toBe(
        "Alan Turing (disambiguation)",
      );
      expect(found.get("alan_turing")?.extract).toContain("Several things");
    } finally {
      globalThis.fetch = original;
    }
  });

  test("drops a backlink that is the article itself, and repeats", async () => {
    const original = globalThis.fetch.bind(globalThis);
    globalThis.fetch = (async () =>
      new Response(
        JSON.stringify({
          query: {
            backlinks: [
              { title: "Alan Turing" },
              { title: "Turing test" },
              { title: "Turing test" },
              { title: "Bletchley Park" },
            ],
          },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      )) as unknown as typeof fetch;

    try {
      expect(await backlinks("en", "Alan Turing")).toEqual([
        "Turing test",
        "Bletchley Park",
      ]);
    } finally {
      globalThis.fetch = original;
    }
  });

  test("answers nothing at all when Wikipedia is unreachable", async () => {
    const original = globalThis.fetch.bind(globalThis);
    globalThis.fetch = (async () => {
      throw new Error("offline");
    }) as unknown as typeof fetch;

    try {
      expect(await summaries("en", ["Alan Turing"])).toEqual(new Map());
      expect(await backlinks("en", "Alan Turing")).toEqual([]);
    } finally {
      globalThis.fetch = original;
    }
  });
});
