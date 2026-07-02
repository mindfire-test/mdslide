module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [2, 'always', ['parser', 'renderer', 'shared', 'core', 'cli', 'config', 'root', 'mdslide-docs']],
    'scope-empty': [2, 'never'],
    'scope-case': [2, 'always', 'lower-case'],
  },
  ignores: [(message) => message.includes('[skip-commitlint]')],
};
