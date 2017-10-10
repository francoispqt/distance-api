const defError = require('def-error')
const config = require('../config')

const DefaultError = defError('DefaultError')
const GmapsError = defError('GmapsError')
const ValidationError = defError('ValidationError')

/**
 * errorResponseCatcher is an express middleware to catch errors
 * helps avoid uncaught errors
 * @param {*} err the values passed to next in the previous middleware
 * @param {request} req the express request
 * @param {response} res the express response
 * @param {function} next the callback to go to the next middleware
 */
// eslint-disable-next-line
const errorResponseMW = function(error, req, res, next) {
    // should use a logger
    // eslint-disable-next-line
    console.error(error)
    if (!res.headersSent) {
        const status = config.errors.status
        let message = config.errors.message
        let statusCode = config.errors.statusCode
        if (error instanceof DefaultError) {
            statusCode = error.statusCode || statusCode
            message = error.message || message
        }
        return res.status(statusCode).send({
            status,
            error: message,
        })
    }
}

/**
 * Sends the generic error response
 * @param {response} res the express response
 * @param {*} message the message to sens
 * @param {*} statusCode the statusCode of reponse
 * @param {*} status the status
 * @return {object} the error object { error, status }
 */
const errorResponse = (
    res,
    message,
    statusCode = config.errors.statusCode,
    status = config.errors.status
) => {
    return res.status(statusCode).send({
        error: message,
        status,
    })
}

module.exports = {
    errorResponse,
    errorResponseMW,
    DefaultError,
    GmapsError,
    ValidationError,
}
