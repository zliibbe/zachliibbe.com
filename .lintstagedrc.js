const buildBiomeCommand = filenames =>
  `biome check --write ${filenames.join(' ')}`;

module.exports = {
  '*.{js,jsx,ts,tsx,json,css}': [buildBiomeCommand],
};
