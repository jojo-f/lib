const path = require('path')
const webpack = require('webpack')
const merge = require('webpack-merge')
const webpackDevServer = require('webpack-dev-server')


const htmlWebpackPlugin = require('html-webpack-plugin')

const config = require('../webpack.config')
const devConfig = merge(config, {
    mode: "development",
    devtool: "source-map",
    plugins: [
        new htmlWebpackPlugin({
            hash: true,
            // 注入位置
            inject: "head",
            template: path.resolve(__dirname, '../public/index.html')
        }),
    ],
})

const compiler = webpack(devConfig)
// 使用这种方式创建的 dev server 服务,webpack.config 中的 devServer 配置无效,需要在当前位置作为第二参数传入
const server = new webpackDevServer(compiler, {
    // https: true,
    contentBase: path.join(__dirname, '../public'),
    publicPath: "/"
})

server.listen(5000, "localhost", () => {
    console.log(`dev server running in http://localhost:5000`);
})