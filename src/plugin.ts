import { backlinks, pageUrl, readArticle, summaries } from "./api";
import type { Article } from "./api";
import { archiveOf, readTitles } from "./index";
import { PluginError, serve } from "./sdk";
import { coloursOf, keepStills } from "./stills";

import type { Data, Paging, Subject } from "./sdk";

const DEFAULT_PER_PAGE = 30;
const MIN_PER_PAGE = 5;
const MAX_PER_PAGE = 50;
const MAX_OVERVIEW = 600;
const MAX_EXTRACT = 1_200;

/** `enwiki` is English Wikipedia, `simplewiki` is Simple English. */
function languageOf(archive: string): string {
  return archive.replace(/wiki$/, "") || "en";
}

function perPageOf(value: unknown): number {
  const wanted =
    typeof value === "number" ? Math.round(value) : DEFAULT_PER_PAGE;
  return Math.min(MAX_PER_PAGE, Math.max(MIN_PER_PAGE, wanted));
}

/** The page a canvas asked for: where it starts, and how much it holds. */
function pageOf(
  paging: Paging | undefined,
  perPage: number,
): { offset: number; limit: number } {
  const limit = Math.min(
    MAX_PER_PAGE,
    Math.max(MIN_PER_PAGE, Math.round(paging?.limit ?? perPage)),
  );
  return { offset: Math.max(0, Math.round(paging?.offset ?? 0)), limit };
}

/**
 * A page of the canvas: titles from the index this computer downloaded, each
 * card filled from one batched read of Wikipedia and given the colour its lead
 * image leads with.
 */
async function catalogue(
  settings: Record<string, unknown>,
  paging: Paging | undefined,
): Promise<Data> {
  const archive = archiveOf(settings.archive);
  const perPage = perPageOf(settings.perPage);
  const { offset, limit } = pageOf(paging, perPage);
  const language = languageOf(archive);
  const query = typeof settings.query === "string" ? settings.query : "";

  // The list of what exists is on this computer; what each one is, is not.
  const page = await readTitles(archive, { query, offset, limit });
  const articles = await summaries(language, page.titles);

  const found = page.titles.map((title) => articles.get(title) ?? null);
  const covers = await keepStills(found.map((article) => article?.thumbnail ?? null));
  const colours = await coloursOf(covers);

  const items = page.titles.map((title, index) => {
    const article = found[index] ?? null;
    const cover = covers[index] ?? null;
    const extract = article?.extract ?? null;
    return {
      id: title,
      title: article?.title ?? title,
      overview: extract
        ? extract.slice(0, MAX_OVERVIEW)
        : (article?.description ?? null),
      cover,
      color: cover ? (colours[cover] ?? null) : null,
      url: pageUrl(language, title),
    };
  });

  return {
    kind: "wikipedia-catalogue",
    text: JSON.stringify({ items, known: [], hasMore: page.hasMore }),
  };
}

/** Markdown of one article: what it is, and what links to it. */
function articleText(language: string, article: Article, links: string[]): string {
  const lines = [`# ${article.title}`];
  if (article.description) {
    lines.push("", `*${article.description}*`);
  }
  if (article.extract) {
    lines.push("", article.extract.slice(0, MAX_EXTRACT));
  }
  if (links.length > 0) {
    lines.push("", "## Linked from");
    for (const title of links) {
      lines.push(`- [${title}](${pageUrl(language, title)})`);
    }
  }
  lines.push("", `[Read on Wikipedia](${pageUrl(language, article.title)})`);
  return lines.join("\n");
}

/**
 * What one entry's link says: the article's own introduction, and the articles
 * that link to it — which is what connects it to the rest of a canvas.
 */
async function article(subject: Subject | undefined): Promise<Data> {
  const read = await readArticle(subject?.link?.url);
  return {
    kind: "wikipedia-article",
    text: articleText(read.language, read.article, read.backlinks),
  };
}

/**
 * The article a note is about: the one its link names, or the one its title
 * names when it has no link. This is the section the note keeps, which the app
 * writes once and leaves alone after the user edits it.
 */
async function noteArticle(
  subject: Subject | undefined,
  settings: Record<string, unknown>,
): Promise<Data> {
  if (subject?.link?.url) {
    return await article(subject);
  }

  const language =
    typeof settings.language === "string" &&
    /^[a-z-]{2,16}$/.test(settings.language)
      ? settings.language
      : "en";
  const title = (subject?.title ?? "").trim();
  if (!title) {
    throw new PluginError(
      "bad_subject",
      "This note has no title to look an article up by.",
    );
  }

  const found = (await summaries(language, [title])).get(title);
  if (!found) {
    throw new PluginError(
      "no_data",
      `Wikipedia has no article called “${title}”.`,
    );
  }

  const links = await backlinks(language, found.title).catch(() => []);
  return {
    kind: "wikipedia-article",
    text: articleText(language, found, links),
  };
}

export default () =>
  serve(async ({ command, params }) => {
    if (command === "catalogue") {
      return await catalogue(params.settings ?? {}, params.paging);
    }
    if (command === "article") {
      return await article(params.subject);
    }
    if (command === "note-article") {
      return await noteArticle(params.subject, params.settings ?? {});
    }

    throw new PluginError("unsupported", `Unknown command ${command}.`);
  });
