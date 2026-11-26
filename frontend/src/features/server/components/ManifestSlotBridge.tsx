import type { ReactNode } from "react";

import type { SlotCatalogue } from "@/shared/components/slots/catalogue";
import { SlotProvider } from "@/shared/components/slots/SlotProvider";

import useManifest from "../hooks/useManifest";

/**
 * Feeds the manifest's UI slots to the shared slot renderer. While the
 * manifest is unavailable the provider exposes an empty slot map, so screens
 * render without waiting for a server. The composition root supplies the
 * merged catalogue; it defaults to the shared base catalogue when omitted.
 */
export default function ManifestSlotBridge({
  catalogue,
  children,
}: {
  catalogue?: SlotCatalogue;
  children: ReactNode;
}) {
  const { data } = useManifest();

  return (
    <SlotProvider slots={data?.ui.slots ?? {}} catalogue={catalogue}>
      {children}
    </SlotProvider>
  );
}
