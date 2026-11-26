type NewConversationListener = () => void;

const listeners = new Set<NewConversationListener>();

export function requestNewConversation(): void {
  for (const listener of listeners) {
    listener();
  }
}

export function subscribeNewConversation(
  listener: NewConversationListener,
): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}
