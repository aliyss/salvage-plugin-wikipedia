/**
 * The titles a canvas reads.
 *
 * The helper fetches a language's whole article list and turns it into a SQLite
 * index in the plugin's own folder, which is the only reason a canvas can list
 * articles without asking Wikipedia anything: the list of what exists is here,
 * and only the text of the few cards on screen comes from the site.
 */

import { Database } from "bun:sqlite";
import { stat } from "node:fs/promises";
import { join } from "node:path";

import { PluginError } from "./sdk";

/** Enough for one page, and a stop for a runaway answer. */
const MAX_TITLES = 50;
const MAX_QUERY = 60;

function indexFile(archive: string): string {
  return join(process.env.SALVAGE_PLUGIN_DATA ?? ".", "downloads", `${archive}.sqlite`);
}

/** Where a language's archive lives, and what it is called in the manifest. */
export function archiveOf(value: unknown): string {
  const archive = typeof value === "string" ? value.trim() : "";
  return /^[a-z]{2,16}wiki$/.test(archive) ? archive : "enwiki";
}

export async function indexReady(archive: string): Promise<boolean> {
  return Boolean(await stat(indexFile(archive)).catch(() => null));
}

/**
 * One page of titles, in the order the index keeps them. A query reads it by
 * what a title contains — the only search a title list can answer — and puts
 * the shortest matches first, because a search is usually someone typing a
 * name rather than a description.
 */
export async function readTitles(
  archive: string,
  options: { query?: string; offset?: number; limit?: number } = {},
): Promise<{ titles: string[]; hasMore: boolean }> {
  const file = indexFile(archive);
  if (!(await indexReady(archive))) {
    throw new PluginError(
      "no_data",
      "Download this Wikipedia's titles on the plugin's own page first.",
    );
  }

  const offset = Math.max(0, Math.round(options.offset ?? 0));
  const limit = Math.min(
    MAX_TITLES,
    Math.max(1, Math.round(options.limit ?? 30)),
  );
  // One more than the page holds, so the answer can say whether more follow.
  const rows = Math.max(1, limit + 1);
  const query = (options.query ?? "").trim().slice(0, MAX_QUERY);

  const db = new Database(file, { readonly: true });
  try {
    const statement = query
      ? db.prepare(
          `SELECT title FROM titles WHERE title LIKE ? ESCAPE '\\'
           ORDER BY length(title), title LIMIT ? OFFSET ?`,
        )
      : db.prepare("SELECT title FROM titles ORDER BY title LIMIT ? OFFSET ?");
    const found = query
      ? statement.all(`%${query.replace(/[%_\\]/g, "\\$&")}%`, rows, offset)
      : statement.all(rows, offset);

    const titles = found.map((row) => (row as { title: string }).title);
    return {
      titles: titles.slice(0, limit),
      hasMore: titles.length > limit,
    };
  } finally {
    db.close();
  }
}
