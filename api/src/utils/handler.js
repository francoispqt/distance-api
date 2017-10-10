const { wrap } = require('co')

/**
 * wraps a generator and calls next middleware on error
 * @param {generator} fn generator to be ran
 * @return {function} returns express route handler wrapped with co
 */
const handler = (fn) => {
    return (req, res, next) => {
        return wrap(fn)(req, res, next)
        .catch((error) => {
            return next(error)
        })
    }
}

module.exports = handler
