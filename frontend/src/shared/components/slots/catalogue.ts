import type { ComponentType } from "react";

export type SlotComponentProps = {
  props: Record<string, unknown>;
  module: string;
  contributionId: string;
};

export type SlotCatalogue = Record<string, ComponentType<SlotComponentProps>>;

/**
 * Components that modules may reference from their UI contributions. The
 * catalogue is intentionally empty in the skeleton and grows with generic,
 * module-agnostic components only. Never load components from a remote URL.
 * Module-specific catalogues are merged in the app composition root.
 */
export const slotCatalogue: SlotCatalogue = {};
