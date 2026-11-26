import { chatModelsResponseSchema } from "@/features/chat/schema";

describe("chatModelsResponseSchema", () => {
  it("accepts a valid models response", () => {
    expect(
      chatModelsResponseSchema.safeParse({
        models: [
          { id: "glm-5.3-flash", label: "GLM 5.3 Flash" },
          { id: "glm-5.3", label: "GLM 5.3" },
        ],
        default_model: "glm-5.3-flash",
      }).success,
    ).toBe(true);
  });

  it("rejects an empty model list", () => {
    expect(
      chatModelsResponseSchema.safeParse({
        models: [],
        default_model: "glm-5.3-flash",
      }).success,
    ).toBe(false);
  });

  it("rejects a missing default model", () => {
    expect(
      chatModelsResponseSchema.safeParse({
        models: [{ id: "glm-5.3-flash", label: "GLM 5.3 Flash" }],
      }).success,
    ).toBe(false);
  });

  it("rejects models without an id or label", () => {
    expect(
      chatModelsResponseSchema.safeParse({
        models: [{ id: "glm-5.3-flash" }],
        default_model: "glm-5.3-flash",
      }).success,
    ).toBe(false);
  });
});
