module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          alias: {
            '@components': './components',
            '@screens': './screens',
            '@lib': './lib',
            '@navigation': './navigation',
            '@services': './services',
            '@contexts': './contexts',
          },
        },
      ],
    ],
  };
};
