import type { ReactNode } from "react";

import { SlotProvider } from "@/shared/components/slots/SlotProvider";

import useManifest from "../hooks/useManifest";

/**
 * Feeds the manifest's UI slots to the shared slot renderer. While the
 * manifest is unavailable the provider exposes an empty slot map, so screens
 * render without waiting for a server.
 */
export default function ManifestSlotBridge({
  children,
}: {
  children: ReactNode;
}) {
  const { data } = useManifest();

  return <SlotProvider slots={data?.ui.slots ?? {}}>{children}</SlotProvider>;
}
