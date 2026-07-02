export function platformInfo(name: string): { label: string; os: string } {
  const n = name.toLowerCase();
  if (n.includes('darwin') && n.includes('arm64')) {
    return { label: 'macOS Apple Silicon', os: 'mac' };
  }
  if (n.includes('darwin') && n.includes('x64')) {
    return { label: 'macOS Intel', os: 'mac' };
  }
  if (n.includes('linux') && n.includes('arm64')) {
    return { label: 'Linux ARM64', os: 'linux' };
  }
  if (n.includes('linux') && n.includes('x64')) {
    return { label: 'Linux x64', os: 'linux' };
  }
  if (n.includes('windows') || n.endsWith('.exe')) {
    return { label: 'Windows x64', os: 'windows' };
  }
  return { label: name, os: 'other' };
}
