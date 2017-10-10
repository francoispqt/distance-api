const fs = require('fs')
const path = require('path')

// current file name
const mName = path.basename(module.filename)

/**
 * @param {express} app the express ass
 * Requires all files in dir
 * @return {undefined} returns undefined
 */
module.exports = (app) => {
    fs
        .readdirSync(__dirname)
        .filter((f) => {
            return f !== mName && !fs.statSync(path.resolve(__dirname, f)).isDirectory()
        })
        .forEach((f) => {
            /* eslint-disable */
            const r = require(path.resolve(__dirname, f)) 
            /* eslint-disable */
            return r(app)
        })
}
