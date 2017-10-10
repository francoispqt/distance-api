const util = require('util')
const config = require('../../config')
const errors = require('../errors')
const co = require('co')

const client = require('@google/maps')
.createClient({
    key: config.gmaps.apiKey,
})

// Gmaps known errors
const gmapsErrors = {
    ZERO_RESULTS: {
        code: 'ZERO_RESULTS',
        message: 'No results',
    },
}

/**
 * Computes the pins and calls the Directions API
 * Computes the directions result to the desired response
 * @param {array} pins Array of pins from the Route
 * @return {object} returns an object { status, path, total_distance, total_time }
 * @throws {GmapsError} throws a GmapsError if response has known error
 */
const getFastestDrive = function*(pins) {
    // prepare points
    const origin = pins.shift()
    const destination = pins.pop()
    const waypoints = pins
    const units = config.gmaps.units
    const opts = { origin, destination, waypoints, units }

    const response = yield util.promisify(client.directions)(opts)
    // handle google response
    if (gmapsErrors[response.json.status]) {
        const gmapErr = gmapsErrors[response.json.status]
        const msg = gmapErr.message || config.errors.message
        throw new errors.GmapsError(msg, {
            response: {
                status: config.errors.status,
                message: msg,
            },
        })
    }

    // format the gmaps response
    // calculate total time and total distance
    const result = response.json.routes[0].legs.reduce(
        (agg, leg) => {
            agg.total_distance += leg.distance.value
            agg.total_time += leg.duration.value
            return agg
        },
        {
            status: config.status.success,
            path: [origin, ...waypoints, destination],
            total_distance: 0,
            total_time: 0,
        }
    )

    return result
}

module.exports = {
    client,
    errors,
    getFastestDrive: co.wrap(getFastestDrive),
}
