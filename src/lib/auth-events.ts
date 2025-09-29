const unauthorizedHandlers = new Set<() => void>();

export function addUnauthorizedHandler(handler: () => void) {
  unauthorizedHandlers.add(handler);
  return () => unauthorizedHandlers.delete(handler);
}

export function notifyUnauthorized() {
  unauthorizedHandlers.forEach((handler) => {
    try {
      handler();
    } catch (error) {
      console.error("Error executing unauthorized handler", error);
    }
  });
}
