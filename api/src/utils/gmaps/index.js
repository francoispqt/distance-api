const util = require('util')
const config = require('../../config')
const errors = require('../errors')
const co = require('co')

const client = require('@google/maps').createClient({
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
 * Returns an array with all permutations from previous array
 * uses the Heaps algorithm
 * @param {*} a initial array
 * @param {number} n length of initial array
 * @return {array} Array with all permutations
 */
function* permute(a, n = a.length) {
    if (n <= 1) yield a.slice()
    else {
        for (let i = 0; i < n; i++) {
            yield* permute(a, n - 1)
            const j = n % 2 ? 0 : i
            ;[a[n - 1], a[j]] = [a[j], a[n - 1]]
        }
    }
}
/**
 * recursive solution to get distances from permutation
 * @param {array} perm the permutation
 * @param {array} rows rows from the gmaps response
 * @param {number} index current row index
 * @param {number} permI current permutation index
 * @param {object} result computed result
 */
const getPathFromPerm = (
    perm,
    rows,
    index,
    permI,
    result = { duration: 0, distance: 0 }
) => {
    if (permI === perm.length) return result

    const start = rows[index]
    const next = perm[permI]
    result.duration += start.elements[next].duration.value
    result.distance += start.elements[next].distance.value
    return getPathFromPerm(perm, rows, next, permI + 1, result)
}

const getPathsFromPerms = function*(perms, rows) {
    for (let i = 0; i < perms.length; i++) {
        const perm = perms[i]
        const metrics = getPathFromPerm(perm, rows, 0, 0)
        yield { perm, metrics }
    }
}

/**
 * Computes the pins and calls the Distance Matrix API
 * Gets all permutations possible after starting point
 * Calc the best way, duration prevails
 * Computes the directions result to the desired response
 * @param {array} pins Array of pins from the Route
 * @return {object} returns an object { status, path, total_distance, total_time }
 * @throws {GmapsError} throws a GmapsError if response has known error
 */
const getFastestDrive = function*(pins) {
    const opts = {
        origins: pins,
        destinations: pins,
        units: config.gmaps.units,
    }
    const response = yield util.promisify(client.distanceMatrix)(opts)

    // handle errors
    // matrix errors need to be handled by points
    // matrix will return ok even if a point is in the middle of the pacific ocean
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

    const rows = response.json.rows
    // error could and should be improved
    // test possibility of a road even if some combos have no results
    rows.forEach(r => {
        if (
            r.elements.every(e => {
                return gmapsErrors[e.status] !== undefined
            })
        ) {
            // throw err, no route available for this pin
            const gmapErr = gmapsErrors[r.elements[0].status]
            const msg = gmapErr.message || config.errors.message
            throw new errors.GmapsError(msg, {
                response: {
                    status: config.errors.status,
                    message: msg,
                },
            })
        }
    })

    // make arrays from keys and remove first one ex: [1,2,3]
    const arr = Array.from(pins.keys()).slice(1) 
    // get all permuations
    // uses heaps algorithm
    const perms = Array.from(permute(arr))

    // get the best from all permuations
    let best
    // checking all perms
    for (const d of getPathsFromPerms(perms, rows)) {
        if (best === undefined || d.metrics.duration < best.metrics.duration) {
            best = d
        }
    }

    // rearrange path according to perm
    // eslint-disable-next-line
    const bestFullPath = [pins[0]].concat(best.perm.map(i => pins[i]))

    // best path result
    const result = {
        total_distance: best.metrics.distance,
        total_time: best.metrics.duration,
        status: config.status.success,
        path: bestFullPath,
    }

    return result
}

module.exports = {
    client,
    errors,
    permute,
    getFastestDrive: co.wrap(getFastestDrive),
}
