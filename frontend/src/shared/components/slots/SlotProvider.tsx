import {
  createContext,
  useContext,
  type ComponentType,
  type ReactNode,
} from "react";

import { slotCatalogue, type SlotComponentProps } from "./catalogue";
import type { SlotMap } from "./contributions";

export type SlotContextValue = {
  slots: SlotMap;
  catalogue: Record<string, ComponentType<SlotComponentProps>>;
};

const SlotContext = createContext<SlotContextValue | null>(null);

export function SlotProvider({
  slots,
  children,
}: {
  slots: SlotMap;
  children: ReactNode;
}) {
  return (
    <SlotContext.Provider value={{ slots, catalogue: slotCatalogue }}>
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
