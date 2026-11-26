import { chatCatalogue } from "@/features/chat/catalogue";
import { slotCatalogue } from "@/shared/components/slots/catalogue";

jest.mock("@/features/chat/components/ChatPanel", () => ({
  __esModule: true,
  default: () => null,
}));

describe("chat slot catalogue", () => {
  it("registers the ChatPanel component", () => {
    expect(Object.keys(chatCatalogue)).toEqual(["ChatPanel"]);
  });

  it("merges with the base catalogue in the composition root", () => {
    const merged = { ...slotCatalogue, ...chatCatalogue };

    expect(merged.ChatPanel).toBe(chatCatalogue.ChatPanel);
  });
});
