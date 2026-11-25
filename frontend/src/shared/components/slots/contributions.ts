export type SlotPlatform = "web" | "ios" | "android";

export type SlotContribution = {
  id: string;
  module: string;
  component: string;
  order: number;
  platforms?: SlotPlatform[];
  permissions: string[];
  props: Record<string, unknown>;
};

export type SlotMap = Record<string, SlotContribution[]>;

function compareText(left: string, right: string): number {
  if (left === right) {
    return 0;
  }
  return left < right ? -1 : 1;
}

export function compareContributions(
  left: SlotContribution,
  right: SlotContribution,
): number {
  return (
    left.order - right.order ||
    compareText(left.module, right.module) ||
    compareText(left.id, right.id)
  );
}

/**
 * Filters contributions for the current platform and returns them in the
 * deterministic order shared with the server: order, module, then id. An
 * absent `platforms` field means every platform; an empty array means none.
 */
export function visibleContributions(
  contributions: readonly SlotContribution[],
  platform: SlotPlatform,
): SlotContribution[] {
  return contributions
    .filter(
      (contribution) =>
        contribution.platforms === undefined ||
        contribution.platforms.includes(platform),
    )
    .slice()
    .sort(compareContributions);
}

/**
 * Keeps only contributions whose component exists in the client catalogue.
 * Modules can ship contributions for components this client does not know;
 * they are ignored instead of breaking the slot.
 */
export function renderableContributions(
  contributions: readonly SlotContribution[],
  platform: SlotPlatform,
  componentKeys: ReadonlySet<string>,
): SlotContribution[] {
  return visibleContributions(contributions, platform).filter((contribution) =>
    componentKeys.has(contribution.component),
  );
}

export function hasVisibleContributions(
  contributions: readonly SlotContribution[],
  platform: SlotPlatform,
): boolean {
  return visibleContributions(contributions, platform).length > 0;
}
