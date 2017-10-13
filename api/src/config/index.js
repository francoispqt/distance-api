/**
 * The config file
 * if it grows bigger, can be split in multiple files
 */

exports.server = {
    port: process.env.PORT || 8080,
    tz: process.env.TZ || 'Europe/Paris',
}

exports.status = {
    success: 'success',
    failure: 'failure',
}

exports.tokens = {
    route: {
        ttl: 1800,
    },
}

exports.errors = {
    statusCode: 500,
    status: 'failure',
    message: 'oups, something went wrong !',
    notFound: 'Not found',
}

exports.validation = {
    statusCode: 400,
    message: 'oups, something is invalid in your request !',
}

exports.gmaps = {
    maxRetries: 2,
    apiKey: process.env.GMAPS_API_KEY,
    units: 'metric',
}

exports.db = {
    conn: process.env.MONGO_CONN || 'mongodb://database:27017/distance',
}
