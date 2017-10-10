const fs = require('fs')
const path = require('path')

// current file name
const mName = path.basename(module.filename)

/**
 * Requires all models in dir and maps them according to their modelName
 * @return {object} an object of all models
 */
module.exports = () => {
    return fs
        .readdirSync(__dirname)
        .filter(f => {
            return (
                f !== mName &&
                !fs.statSync(path.resolve(__dirname, f)).isDirectory()
            )
        })
        .reduce((agg, f) => {
            /* eslint-disable */
            const r = require(path.resolve(__dirname, f))
            agg[r.modelName] = r
            return agg
        }, {})
}
