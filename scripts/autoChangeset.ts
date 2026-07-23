import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';
import path from 'node:path';

export function parseCommitMessage(params: {
  fullMessage: string;
  changedPackages: Set<string>;
  packages: { dirName: string; packageName: string }[];
}): { packageBumps: Map<string, 'major' | 'minor' | 'patch'>; descriptions: string[] } {
  const lines = params.fullMessage.split('\n');
  const packageBumps = new Map<string, 'major' | 'minor' | 'patch'>();
  const descriptions: string[] = [];

  for (const rawLine of lines) {
    let line = rawLine.trim();
    // Strip common bullet list markers or numbering
    line = line.replace(/^[-*+]\s+/, '');
    line = line.replace(/^\d+\.\s+/, '');

    const match = line.match(
      /^(feat|fix|refactor|docs|style|test|chore|perf|ci|build)(?:\(([^)]+)\))?(!?): (.+)/i
    );
    if (!match) continue;

    const [_, type, scope, breaking, desc] = match;
    const isLineBreaking = !!breaking || line.includes('BREAKING CHANGE');

    let lineChangeType: 'major' | 'minor' | 'patch' | null = null;
    if (isLineBreaking) {
      lineChangeType = 'major';
    } else if (type.toLowerCase() === 'feat') {
      lineChangeType = 'minor';
    } else if (type.toLowerCase() === 'fix') {
      lineChangeType = 'patch';
    }

    if (!lineChangeType) continue; // Skip chore, docs, refactor unless marked as breaking

    const targetPackages = new Set<string>();
    if (scope) {
      // Resolve scope to a package name (matching either dirName or packageName suffix)
      const matched = params.packages.find(
        (p) =>
          p.dirName.toLowerCase() === scope.toLowerCase() ||
          p.packageName.toLowerCase().endsWith(scope.toLowerCase())
      );
      if (matched && params.changedPackages.has(matched.packageName)) {
        targetPackages.add(matched.packageName);
      }
    }

    // Fallback: if no scope matches any changed package, apply the bump to all changed packages
    if (targetPackages.size === 0) {
      params.changedPackages.forEach((p) => targetPackages.add(p));
    }

    // Update package bump levels, keeping the highest level: major > minor > patch
    targetPackages.forEach((pkgName) => {
      const currentBump = packageBumps.get(pkgName);
      if (!currentBump) {
        packageBumps.set(pkgName, lineChangeType!);
      } else if (lineChangeType === 'major') {
        packageBumps.set(pkgName, 'major');
      } else if (lineChangeType === 'minor' && currentBump !== 'major') {
        packageBumps.set(pkgName, 'minor');
      }
    });

    descriptions.push(`${scope ? scope + ': ' : ''}${desc.trim()}`);
  }

  return { packageBumps, descriptions };
}

const isRunDirectly =
  typeof process !== 'undefined' &&
  process.argv[1] &&
  /autoChangeset\.[jt]s$/.test(process.argv[1]);

if (isRunDirectly) {
  // Get workspace packages
  const PACKAGES_DIR = join(import.meta.dirname, '..', 'packages');
  const packages = readdirSync(PACKAGES_DIR, { withFileTypes: true })
    .filter(
      (entry) => entry.isDirectory() && existsSync(join(PACKAGES_DIR, entry.name, 'package.json'))
    )
    .map((entry) => {
      const pkgJson = JSON.parse(
        readFileSync(join(PACKAGES_DIR, entry.name, 'package.json'), 'utf8')
      );
      return {
        dirName: entry.name,
        packageName: pkgJson.name,
      };
    });

  // Get latest commit info
  let commitHash = '';
  let commitSubject = '';
  let commitBody = '';
  let fullMessage = '';

  try {
    commitHash = execSync('git rev-parse --short HEAD').toString().trim();
    commitSubject = execSync('git log -1 --format=%s').toString().trim();
    commitBody = execSync('git log -1 --format=%b').toString().trim();
    fullMessage = execSync('git log -1 --format=%B').toString().trim();
  } catch (error) {
    console.error('Error reading git commit info:', error);
    process.exit(1);
  }

  console.log(`Processing commit message: "${commitSubject}" (hash: ${commitHash})`);

  // Check if changeset for this commit already exists
  const changesetDir = join(import.meta.dirname, '..', '.changeset');
  const outputFilePath = join(changesetDir, `auto-${commitHash}.md`);

  if (existsSync(outputFilePath)) {
    console.log(
      `Changeset for commit ${commitHash} already exists at ${outputFilePath}, skipping.`
    );
    process.exit(0);
  }

  // Get list of modified files in the latest commit
  let modifiedFiles: string[] = [];
  try {
    modifiedFiles = execSync('git diff-tree --no-commit-id --name-only -r HEAD')
      .toString()
      .trim()
      .split('\n')
      .filter(Boolean);
  } catch (error) {
    console.error('Error getting modified files from git:', error);
    process.exit(1);
  }

  // Skip if the commit itself already contains a changeset file
  const hasChangesetInCommit = modifiedFiles.some(
    (file) => file.startsWith('.changeset/') && file.endsWith('.md') && !file.endsWith('README.md')
  );
  if (hasChangesetInCommit) {
    console.log('Changeset already exists in the latest commit, skipping generation.');
    process.exit(0);
  }

  // Identify which packages were changed in the latest commit
  const changedPackages = new Set<string>();
  for (const file of modifiedFiles) {
    if (file.startsWith('packages/')) {
      const parts = file.split('/');
      const dirName = parts[1];
      const matched = packages.find((p) => p.dirName === dirName);
      if (matched) {
        changedPackages.add(matched.packageName);
      }
    }
  }

  if (changedPackages.size === 0) {
    console.log(
      'No workspace packages were modified in the latest commit. Skipping changeset generation.'
    );
    process.exit(0);
  }

  const { packageBumps, descriptions } = parseCommitMessage({
    fullMessage,
    changedPackages,
    packages,
  });

  if (packageBumps.size > 0) {
    const frontmatter = Array.from(packageBumps.entries())
      .map(([pkgName, bump]) => `'${pkgName}': ${bump}`)
      .join('\n');

    const changesetContent = `---
${frontmatter}
---

${descriptions.join('\n')}
`;

    if (!existsSync(changesetDir)) {
      mkdirSync(changesetDir, { recursive: true });
    }

    writeFileSync(outputFilePath, changesetContent, 'utf8');
    console.log(
      `Changeset created successfully at ${outputFilePath} for packages:\n${Array.from(
        packageBumps.entries()
      )
        .map(([pkg, bump]) => `  - ${pkg} (${bump})`)
        .join('\n')}`
    );
  } else {
    // Safe Fallback: Generate a patch bump for all modified packages to prevent missed releases
    console.warn(
      'Warning: No valid release-triggering conventional commits were parsed from the commit message.'
    );
    console.warn(
      'Generating a fallback patch changeset for all modified packages to prevent missed releases.'
    );

    const fallbackDescription = commitSubject || 'No description provided.';
    const frontmatter = Array.from(changedPackages)
      .map((pkgName) => `'${pkgName}': patch`)
      .join('\n');

    const changesetContent = `---
${frontmatter}
---

${fallbackDescription}
`;

    if (!existsSync(changesetDir)) {
      mkdirSync(changesetDir, { recursive: true });
    }

    writeFileSync(outputFilePath, changesetContent, 'utf8');
    console.log(
      `Fallback changeset created successfully at ${outputFilePath} for packages: ${Array.from(
        changedPackages
      ).join(', ')} (patch)`
    );
  }
}
