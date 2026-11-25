import type { ComponentType } from "react";

export type SlotComponentProps = {
  props: Record<string, unknown>;
  module: string;
  contributionId: string;
};

/**
 * Components that modules may reference from their UI contributions. The
 * catalogue is intentionally empty in the skeleton and grows with generic,
 * module-agnostic components only. Never load components from a remote URL.
 */
export const slotCatalogue: Record<
  string,
  ComponentType<SlotComponentProps>
> = {};
