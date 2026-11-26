import { createContext, useContext, type ReactNode } from "react";

import { slotCatalogue, type SlotCatalogue } from "./catalogue";
import type { SlotMap } from "./contributions";

export type SlotContextValue = {
  slots: SlotMap;
  catalogue: SlotCatalogue;
};

const SlotContext = createContext<SlotContextValue | null>(null);

export function SlotProvider({
  slots,
  catalogue = slotCatalogue,
  children,
}: {
  slots: SlotMap;
  catalogue?: SlotCatalogue;
  children: ReactNode;
}) {
  return (
    <SlotContext.Provider value={{ slots, catalogue }}>
      {children}
    </SlotContext.Provider>
  );
}

export function useSlotContext(): SlotContextValue {
  const value = useContext(SlotContext);

  if (!value) {
    throw new Error("Slot components must be used within SlotProvider");
  }

  return value;
}
