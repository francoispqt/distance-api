const Joi = require('joi')
const co = require('co')
const config = require('../config')
const errors = require('../utils/errors')
const handler = require('../utils/handler')
const GMaps = require('../utils/gmaps')
const validationMW = require('../utils/validation').MW
const Route = require('../models/route')

/**
 * submitRoute saves a route taking an array of [lat,lng]
 * example: [[0.0,0.0], [0.1,0.3], [0.2,0.4]]
 * @param {request} req the express request
 * @param {response} res the express response
 * @return {object} an object with the route token { token }
 */
const submitRoute = function*(req, res) {
    const r = yield Route.create({ path: req.body })

    // send response and call google's api after
    res.send({ token: r.token })

    // get result from google
    // if throws error update route document with status and error
    try {
        const gmapsRes = yield GMaps.getFastestDrive(r.path)
        yield r.update(gmapsRes)
    } catch (error) {
        const u = {
            status: config.status.failure,
            error: error.message,
        }
        if (
            error instanceof errors.GmapsError &&
            error.response &&
            error.response.status
        ) {
            u.status = error.response.status
            u.error = error.response.message
        }
        yield r.update(u)

        // throw error, let the middleware deal with it
        throw error
    }
}

/**
 * GetShortestDriving returns the shortest driving for a given route
 * @param {request} req the express request
 * @param {response} res the express response
 * @return {object} object returned from Gmaps.getFastestDrive
 * @throws {error} throw errors if not a GmapsError
 */
const getShortestDriving = function*(req, res) {
    const token = req.params.token
    const r = yield Route.findOne({ token })
    // if no result found,
    if (!r) return errors.errorResponse(res, config.errors.notFound, 404)
    // if does not have a status and hasnt exceed the retries allowed rerun the request
    // this is use to prevent a call done too fast after retrieving the token
    // and gmaps call has not resolved yet
    if (!r.status && (!req.retries || req.retries < config.gmaps.maxRetries)) {
        req.retries = req.retries || 0
        req.retries++
        return setTimeout(() => {
            return co.wrap(getShortestDriving)(req, res)
        }, 500)
    }
    // if has status and status is 'success' send r and code 200
    // else send r with status 400
    return r.status === 'success' ? res.send(r) : res.status(400).send(r)
}

module.exports = app => {
    app.post(
        '/route',
        validationMW({
            body: Joi.array()
                .items(
                    Joi.array()
                        .items(Joi.number())
                        .length(2)
                )
                .min(2)
                .max(12), // avoid having too many waypoints, limit from google is 10
        }),
        handler(submitRoute)
    )
    app.get(
        '/route/:token',
        validationMW({
            params: {
                token: Joi.string()
                    .uuid()
                    .required(),
            },
        }),
        handler(getShortestDriving)
    )
}
