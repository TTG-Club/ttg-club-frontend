const { defineConfig } = require('@vue/cli-service');
const path = require('path');

module.exports = defineConfig({
  outputDir: process.env.VUE_APP_BUILD_PATH || './dist/',
  filenameHashing: false,
  runtimeCompiler: true,
  productionSourceMap: true,
  transpileDependencies: false,
  devServer: {
    proxy: {
      '^/': {
        target: process.env.VUE_APP_API_URL || 'http://localhost:8080',
        changeOrigin: true,
        ws: false,
        secure: false,
        onProxyReq(req) {
          req.setHeader('origin', process.env.VUE_APP_API_URL || 'http://localhost:8080');
        },
        /* eslint-disable consistent-return */
        bypass(req) {
          if (req.headers.accept.indexOf('html') !== -1) {
            return '/index.html';
          }
        }
        /* eslint-enable consistent-return */
      }
    }
  },
  chainWebpack: config => {
    const removeHTML = () => {
      config.plugins.delete('html');
      config.plugins.delete('preload');
      config.plugins.delete('prefetch');
    };

    if (process.env.BUILD_TARGET !== 'serve') {
      removeHTML();
    }

    config.optimization.runtimeChunk('single');

    config.output.filename('js/[name].js');
    config.output.chunkFilename('js/[name].[chunkhash].js');

    config.module
      .rule('svg')
      .exclude
      .add(path.resolve(__dirname, './src/assets/icons/svg'))
      .end();

    config.module
      .rule('svg-icon')
      .test(/\.svg$/)
      .include
      .add(path.resolve(__dirname, './src/assets/icons/svg'))
      .end()
      .use('svg-sprite-loader')
      .loader('svg-sprite-loader')
      .options({ symbolId: 'dnd5club-icon-[name]' })
      .end()
      .use('svgo-loader')
      .loader('svgo-loader')
      .options({
        plugins: [
          {
            name: 'preset-default',
            params: {
              overrides: { removeViewBox: false }
            }
          },
          {
            name: 'removeAttrs',
            params: {
              attrs: '(width|height|style|color|fill|stroke)'
            }
          }
        ]
      })
      .end();
  },
  css: {
    extract: process.env.BUILD_TARGET !== 'serve'
      ? {
        filename: 'css/[name].css',
        chunkFilename: 'css/[name].[chunkhash].css'
      }
      : false,
    loaderOptions: {
      css: {
        url: false
      },
      sass: {
        additionalData: '@import "@/assets/styles/_variables.scss";',
        sassOptions: {
          outputStyle: 'compressed',
          includePaths: ['./node_modules']
        }
      }
    },
    sourceMap: true
  }
});
