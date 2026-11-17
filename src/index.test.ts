import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { archiveOf, indexReady, readTitles } from "./index";

/** A fresh folder per test, with an index as the helper would build one. */
let root = "";
const TITLES = [
  "Alan Turing",
  "Bletchley Park",
  "Computability",
  "Enigma machine",
  "Turing test",
];

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "salvage-wikipedia-"));
  process.env.SALVAGE_PLUGIN_DATA = root;
  await mkdir(join(root, "downloads"), { recursive: true });
  const db = new Database(join(root, "downloads", "enwiki.sqlite"), {
    create: true,
  });
  db.run("CREATE TABLE titles (title TEXT PRIMARY KEY) WITHOUT ROWID");
  const insert = db.prepare("INSERT INTO titles (title) VALUES (?)");
  for (const title of TITLES) {
    insert.run(title);
  }
  db.close();
});

afterEach(async () => {
  delete process.env.SALVAGE_PLUGIN_DATA;
  await rm(root, { recursive: true, force: true });
});

describe("the titles a canvas reads", () => {
  test("come in the order the index keeps them", async () => {
    const page = await readTitles("enwiki", { offset: 0, limit: 2 });
    expect(page.titles).toEqual(["Alan Turing", "Bletchley Park"]);
    expect(page.hasMore).toBe(true);

    const next = await readTitles("enwiki", { offset: 2, limit: 3 });
    expect(next.titles).toEqual(["Computability", "Enigma machine", "Turing test"]);
    expect(next.hasMore).toBe(false);
  });

  test("are searched by what a title contains, shortest first", async () => {
    const page = await readTitles("enwiki", { query: "turing" });
    expect(page.titles).toEqual(["Alan Turing", "Turing test"]);
  });

  test("treat a percent sign as a title, not as a pattern", async () => {
    const page = await readTitles("enwiki", { query: "%" });
    expect(page.titles).toEqual([]);
  });

  test("are missing until a language has been downloaded", async () => {
    expect(await indexReady("enwiki")).toBe(true);
    expect(await indexReady("dewiki")).toBe(false);
    await expect(readTitles("dewiki")).rejects.toThrow(
      "Download this Wikipedia's titles on the plugin's own page first.",
    );
  });
});

describe("the archive a canvas names", () => {
  test("is only ever a language's own wiki", () => {
    expect(archiveOf("dewiki")).toBe("dewiki");
    expect(archiveOf("../../etc/passwd")).toBe("enwiki");
    expect(archiveOf(undefined)).toBe("enwiki");
  });
});
