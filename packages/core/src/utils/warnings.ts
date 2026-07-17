type WarnHandler = (message: string) => void;

const defaultHandler: WarnHandler = (message) => console.warn(message);

let handler: WarnHandler = defaultHandler;

// Non-fatal compiler diagnostics go through here instead of console.warn so
// the pipeline can collect them into CompileResult.warnings (and consumers
// like the CLI can honor --silent / --strict).
export function emitWarning(message: string): void {
  handler(message);
}

export function setWarningHandler(next: WarnHandler | null): void {
  handler = next ?? defaultHandler;
}
