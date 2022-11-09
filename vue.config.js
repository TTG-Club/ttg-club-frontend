const { defineConfig } = require('@vue/cli-service');
const path = require('path');

module.exports = defineConfig({
    publicPath: process.env.BUILD_TARGET === 'gh-pages'
        ? '/ttg-club-frontend/'
        : '/',
    outputDir: process.env.BUILD_PATH || './dist/',
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
                /* eslint-disable consistent-return */
                // @ts-ignore
                bypass(req) {
                    if (req.headers.accept.indexOf('html') !== -1) {
                        return '/index.html';
                    }
                }
                /* eslint-enable consistent-return */
            }
        }
    },
    configureWebpack: {
        optimization: {
            moduleIds: 'deterministic',
            runtimeChunk: 'single'
        },
        output: {
            filename: 'js/[name].js',
            chunkFilename: 'js/[name].[chunkhash].js'
        }
    },
    chainWebpack: config => {
        const removeHTML = () => {
            config.plugins.delete('html');
            config.plugins.delete('preload');
            config.plugins.delete('prefetch');
        };

        if (!['serve', 'gh-pages'].includes(process.env.BUILD_TARGET)) {
            removeHTML();
        }

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
        extract: process.env.VUE_SERVE !== 'true'
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
