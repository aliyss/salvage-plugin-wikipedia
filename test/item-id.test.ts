import { describe, expect, it } from "bun:test";

import { itemIdOf } from "../src/plugin";

/** The rule the server holds every item id to. */
const ITEM_ID = /^[A-Za-z0-9._:-]{1,64}$/;

describe("the id a card is filed under", () => {
  const titles = [
    "!",
    "Exclamation mark",
    "AC/DC",
    "Amsterdam Centraal station",
    "C++",
    "Zürich",
    "A very long title that goes on for rather more characters than an item id is allowed to hold, twice over even",
  ];

  it("is one the server accepts for any article title", () => {
    for (const title of titles) {
      expect(itemIdOf(title)).toMatch(ITEM_ID);
    }
  });

  it("is the same id for the same title, every time", () => {
    expect(itemIdOf("Amsterdam")).toBe(itemIdOf("Amsterdam"));
  });

  it("tells two titles apart, even when they sanitise alike", () => {
    expect(itemIdOf("AC/DC")).not.toBe(itemIdOf("AC DC"));
  });
});
