import {
  requestNewConversation,
  subscribeNewConversation,
} from "../newConversation";

describe("newConversation", () => {
  it("notifies subscribers until they unsubscribe", () => {
    const listener = jest.fn();
    const unsubscribe = subscribeNewConversation(listener);

    requestNewConversation();
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    requestNewConversation();
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
