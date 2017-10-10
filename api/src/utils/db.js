const mongoose = require('mongoose')
const config = require('../config')

mongoose.Promise = global.Promise

const connectWithRetry = function(tries, resolve, reject) {
    if (tries > 30) return reject(new Error('Cannot start db'))
    return mongoose
        .connect(config.db.conn, { useMongoClient: true }, err => {
            if (err) {
                return setTimeout(
                    connectWithRetry.bind(null, tries + 1, resolve, reject),
                    1000
                )
            }
            return resolve({
                conn: mongoose.connection,
            })
        })
        .catch(error => {
            // eslint-disable-next-line
            console.log(error.message, 'retrying to connect in 1s')
            setTimeout.bind(
                null,
                connectWithRetry.bind(null, tries + 1, resolve, reject),
                1000
            )
        })
}

module.exports = {
    db: mongoose,
    init: () => {
        return new Promise((resolve, reject) => {
            connectWithRetry(0, resolve, reject)
        })
    },
}
