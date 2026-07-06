import { CommandSeq } from '../types/component';

export const COMMAND_SEQUENCE: CommandSeq[] = [
  {
    input: 'npm install -g @mindfiredigital/mdslide-cli',
    output: '+ @mindfiredigital/mdslide-cli@1.0.0\nadded 124 packages in 3.42s',
  },
  {
    input: 'mdslide init presentation',
    output:
      'Creating new presentation workspace...\n✓ Created presentation/slides.md\n✓ Created presentation/custom.css',
  },
  {
    input: 'mdslide watch presentation/slides.md',
    output:
      'Watching workspace...\nServer running at http://localhost:3000\n[24ms] Compiled successfully!',
  },
];
