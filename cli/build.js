const path = require('path')
const webpack = require('webpack')
const merge = require('webpack-merge')

const config = require('../webpack.config')
const buildConfig = merge(config, {
    mode: "production"
})

webpack(buildConfig, (err, stats) => {
    if (err || stats.hasErrors()) {
        // 在这里处理错误
    }
    // 处理完成
});