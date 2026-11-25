import {
  hasVisibleContributions,
  renderableContributions,
  visibleContributions,
  type SlotContribution,
} from "@/shared/components/slots/contributions";

function contribution(
  overrides: Partial<SlotContribution> & Pick<SlotContribution, "id">,
): SlotContribution {
  return {
    module: "amibot_chat",
    component: "Button",
    order: 0,
    permissions: [],
    props: {},
    ...overrides,
  };
}

describe("visibleContributions", () => {
  it("keeps contributions without a platforms field", () => {
    const entries = [contribution({ id: "all" })];

    expect(visibleContributions(entries, "web")).toEqual(entries);
  });

  it("keeps contributions that include the current platform", () => {
    const entries = [contribution({ id: "ios", platforms: ["ios"] })];

    expect(visibleContributions(entries, "ios")).toEqual(entries);
    expect(visibleContributions(entries, "web")).toEqual([]);
  });

  it("treats an empty platforms array as none", () => {
    const entries = [contribution({ id: "none", platforms: [] })];

    expect(visibleContributions(entries, "web")).toEqual([]);
  });

  it("sorts by order, then module, then id", () => {
    const entries = [
      contribution({ id: "b", module: "amibot_chat", order: 10 }),
      contribution({ id: "a", module: "amibot_chat", order: 10 }),
      contribution({ id: "c", module: "amibot_alpha", order: 10 }),
      contribution({ id: "first", module: "amibot_zeta", order: 0 }),
    ];

    const ids = visibleContributions(entries, "web").map((entry) => entry.id);

    expect(ids).toEqual(["first", "c", "a", "b"]);
  });

  it("does not mutate the input array", () => {
    const entries = [
      contribution({ id: "b", order: 2 }),
      contribution({ id: "a", order: 1 }),
    ];

    visibleContributions(entries, "web");

    expect(entries.map((entry) => entry.id)).toEqual(["b", "a"]);
  });
});

describe("renderableContributions", () => {
  it("keeps only components present in the catalogue", () => {
    const entries = [
      contribution({ id: "known", component: "Button" }),
      contribution({ id: "unknown", component: "Chart" }),
    ];

    const renderable = renderableContributions(
      entries,
      "web",
      new Set(["Button"]),
    );

    expect(renderable.map((entry) => entry.id)).toEqual(["known"]);
  });
});

describe("hasVisibleContributions", () => {
  it("reports false for an empty list", () => {
    expect(hasVisibleContributions([], "web")).toBe(false);
  });

  it("reports false for contributions excluded by platform", () => {
    expect(
      hasVisibleContributions(
        [contribution({ id: "ios", platforms: ["ios"] })],
        "web",
      ),
    ).toBe(false);
  });

  it("reports true for a visible contribution", () => {
    expect(hasVisibleContributions([contribution({ id: "web" })], "web")).toBe(
      true,
    );
  });
});
