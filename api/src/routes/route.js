const Joi = require('joi')
const config = require('../config')
const errors = require('../utils/errors')
const handler = require('../utils/handler')
const GMaps = require('../utils/gmaps')
const validationMW = require('../utils/validation').MW
const Route = require('../models/route')

/**
 * submitRoute saves a route taking an array for [lat,lng]
 * @param {request} req the express request
 * @param {response} res the express response
 * @return {object} an object with the route token { token }
 */
const submitRoute = function*(req, res) {
    const r = yield Route.create({ path: req.body })
    return res.send({ token: r.token })
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
    if (!r) return errors.errorResponse(res, config.errors.notFound)

    // check if r is successful
    // if yes respond, this coupled with the expire on the model works as cache
    if (r.status && r.status === 'success') {
        return res.send(r)
    }

    // get result from google
    const gmapsRes = yield GMaps.getFastestDrive(r.path).catch(error => {
        if (error instanceof errors.GmapsError) {
            const statusCode = error.statusCode || 400
            let message
            let status
            if (error.response) {
                message = error.response.message || message
                status = error.response.status || status
            }
            errors.errorResponse(res, message, statusCode, status)
        }
        throw error
    })

    yield r.update(gmapsRes)
    Object.assign(r, gmapsRes)

    // send the response
    return res.send(r)
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
