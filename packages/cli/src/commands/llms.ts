import syntaxReference from '../docs/SYNTAX.md';

// Plain markdown to stdout, no logger/ANSI decoration: the output is meant to
// be captured into an AI agent's context or piped to a file.
export function llmsCommand(): void {
  const text = syntaxReference.endsWith('\n') ? syntaxReference : `${syntaxReference}\n`;
  process.stdout.write(text);
}
