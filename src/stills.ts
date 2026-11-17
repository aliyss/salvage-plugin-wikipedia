/**
 * A card's picture is the article's lead image, and its colour is read out of
 * that picture: Wikipedia reports neither, and the colour view sorts by it. Both
 * are kept in the plugin's own folder, the picture as a file the helper serves
 * back and the colour as a small map beside it, so one image is fetched and read
 * once in its life.
 */

import { createHash } from "node:crypto";
import { mkdir, readFile, rename, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { decode } from "jpeg-js";

const TIMEOUT_MS = 10_000;
const MAX_BYTES = 1_500_000;
/** Enough of a sha256 to name one picture, and no more. */
const HASH_CHARS = 32;
const CONCURRENCY = 4;
const EXTENSIONS = ["jpg", "jpeg", "png", "webp", "avif", "gif"];
/** A decoded pixel is four channels, and the alpha is the last of them. */
const RGBA_CHANNELS = 4;
const ALPHA_INDEX = 3;
const OPAQUE_ALPHA = 255;
const TRANSPARENT_ALPHA = 128;
const SAMPLE_SIZE = 64;
const BUCKET_SHIFT = 4;
const CHANNEL_MAX = 255;
const HEX = /^#[0-9A-F]{6}$/;

function mediaDirectory(): string {
  return join(process.env.SALVAGE_PLUGIN_DATA ?? ".", "media");
}

function extensionOf(pathname: string): string | null {
  const last = pathname.split(".").pop()?.toLowerCase() ?? "";
  return EXTENSIONS.includes(last) ? last : null;
}

/** The name one picture is filed under: a hash of its address, then its kind. */
export function stillName(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:") {
    return null;
  }
  const extension = extensionOf(parsed.pathname);
  if (!extension) {
    return null;
  }
  const hash = createHash("sha256").update(url).digest("hex");
  return `${hash.slice(0, HASH_CHARS)}.${extension}`;
}

async function filed(name: string): Promise<boolean> {
  return Boolean(await stat(join(mediaDirectory(), name)).catch(() => null));
}

async function keepOne(url: string | null): Promise<string | null> {
  const name = url ? stillName(url) : null;
  if (!url || !name) {
    return null;
  }
  if (await filed(name)) {
    return name;
  }

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { "user-agent": "salvage-plugin-wikipedia/0.1.0" },
    });
    if (!response.ok) {
      await response.body?.cancel().catch(() => undefined);
      return null;
    }
    if (!(response.headers.get("content-type") ?? "").startsWith("image/")) {
      await response.body?.cancel().catch(() => undefined);
      return null;
    }
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.byteLength > MAX_BYTES) {
      return null;
    }
    await mkdir(mediaDirectory(), { recursive: true });
    const part = join(mediaDirectory(), `${name}.part`);
    await writeFile(part, bytes).catch(() => undefined);
    await rename(part, join(mediaDirectory(), name)).catch(() => undefined);
    return name;
  } catch {
    return null;
  }
}

/** Files a page's pictures, a few at a time, in the same order. */
export async function keepStills(
  urls: (string | null)[],
): Promise<(string | null)[]> {
  const names: (string | null)[] = urls.map(() => null);
  let next = 0;

  const worker = async (): Promise<void> => {
    for (;;) {
      const index = next;
      next += 1;
      if (index >= urls.length) {
        return;
      }
      names[index] = await keepOne(urls[index] ?? null);
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, urls.length) }, worker),
  );
  return names;
}

/** True for a colour in the form the canvas stores one, `#RRGGBB`. */
export function isColor(value: unknown): value is string {
  return typeof value === "string" && HEX.test(value);
}

function channelOf(value: number): string {
  return Math.min(CHANNEL_MAX, Math.max(0, Math.round(value)))
    .toString(16)
    .padStart(2, "0")
    .toUpperCase();
}

/** The most common coarse colour of a JPEG, or null when it cannot be read. */
export function leadingColorOf(bytes: Uint8Array): string | null {
  if (
    bytes.length < 4 ||
    bytes[0] !== 0xff ||
    bytes[1] !== 0xd8 ||
    bytes[2] !== 0xff
  ) {
    return null;
  }

  let image: { width: number; height: number; data: Uint8Array };
  try {
    image = decode(bytes, { useTArray: true, maxMemoryUsageInMB: 96 });
  } catch {
    return null;
  }
  if (image.width <= 0 || image.height <= 0) {
    return null;
  }

  const step = Math.max(
    1,
    Math.ceil(Math.max(image.width, image.height) / SAMPLE_SIZE),
  );
  const buckets = new Map<string, { count: number; r: number; g: number; b: number }>();
  for (let y = 0; y < image.height; y += step) {
    for (let x = 0; x < image.width; x += step) {
      const index = (y * image.width + x) * RGBA_CHANNELS;
      if (
        (image.data[index + ALPHA_INDEX] ?? OPAQUE_ALPHA) < TRANSPARENT_ALPHA
      ) {
        continue;
      }
      const r = image.data[index] ?? 0;
      const g = image.data[index + 1] ?? 0;
      const b = image.data[index + 2] ?? 0;
      const key = `${String(r >> BUCKET_SHIFT)}-${String(g >> BUCKET_SHIFT)}-${String(
        b >> BUCKET_SHIFT,
      )}`;
      const bucket = buckets.get(key) ?? { count: 0, r: 0, g: 0, b: 0 };
      bucket.count += 1;
      bucket.r += r;
      bucket.g += g;
      bucket.b += b;
      buckets.set(key, bucket);
    }
  }

  let best: { count: number; r: number; g: number; b: number } | null = null;
  for (const bucket of buckets.values()) {
    if (!best || bucket.count > best.count) {
      best = bucket;
    }
  }
  return best
    ? `#${channelOf(best.r / best.count)}${channelOf(best.g / best.count)}${channelOf(best.b / best.count)}`
    : null;
}

/** The colour each picture of a page leads with, by the name it is filed under. */
export async function coloursOf(
  names: (string | null)[],
): Promise<Record<string, string>> {
  const colours: Record<string, string> = {};
  for (const name of names) {
    if (!name || colours[name]) {
      continue;
    }
    const bytes = await readFile(join(mediaDirectory(), name)).catch(
      () => null,
    );
    if (!bytes) {
      continue;
    }
    const hex = leadingColorOf(new Uint8Array(bytes));
    if (hex) {
      colours[name] = hex;
    }
  }
  return colours;
}
