const path = require('path')

const htmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
    mode: "development",
    devtool: "source-map",
    entry: path.resolve(__dirname, 'src/index.js'),
    output: {
        filename: '[name].[hash].bundle.js',
        publicPath: "./"
    },
    plugins: [
        // new htmlWebpackPlugin(),
        new htmlWebpackPlugin({
            hash: true,
            // 注入位置
            inject: "head",
            template: path.resolve(__dirname, './public/index.html')
        }),
    ],
    module: {
        rules: [{
            test: /\.js$/,
            exclude: /node_modules/,
            use: {
                loader: 'babel-loader'
            } // options 在 .babelrc 定义
        }]
    }
}