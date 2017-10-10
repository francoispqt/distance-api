const db = require('../utils/db').db
const uuidv4 = require('uuid/v4')
const config = require('../config')
const moment = require('moment-timezone')

/**
 * Route is the schema for a route
 * It expires after the number of seconds set in config.tokens.route.ttl
 */
const RouteSchema = new db.Schema({
    token: { type: String, index: { unique: true }, default: uuidv4 },
    createdAt: {
        type: Date,
        expires: config.tokens.route.ttl,
        default: moment.tz.bind(null, config.server.tz),
    },
    path: [
        [Number],
    ],
    status: { type: String },
    total_distance: Number,
    total_time: Number,
})

// hide token
RouteSchema.set('toJSON', {
    transform: (doc, ret) => {
        delete ret.token
        delete ret._id
        delete ret.__v
        delete ret.createdAt
        return ret
    },
})

const Route = db.model(
    'Route',
    RouteSchema
)

module.exports = Route
