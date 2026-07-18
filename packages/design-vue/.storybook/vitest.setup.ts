const warn = console.warn;
console.warn = (...args) => {
  if (
    typeof args[0] === 'string' &&
    args[0].includes('[@vue/compiler-core]')
  ) {
    return;
  }
  warn(...args);
};
