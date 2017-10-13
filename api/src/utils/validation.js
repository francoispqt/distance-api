const Joi = require('joi')
const errors = require('./errors')
const config = require('../config')

const keyToValidate = ['params', 'query', 'body', 'headers']

/**
 * Validation middleware
 * @param {object} schema the object containing schemas for validation { body: {}, params: {} }
 * @return {function} returns the express middleware for input validation
 */
const MW = schema => {
    return function(req, res, next) {
        // loops through the keys to validate
        for (let i = 0; i < keyToValidate.length; i++) {
            const k = keyToValidate[i]
            // check if key to validate is in req and schema
            if (req[k] && schema[k]) {
                // do validation
                const { error, value } = Joi.validate(req[k], schema[k])
                if (error) {
                    const statusCode = config.validation.statusCode
                    const message = error.details.map(d => {
                        return d.message
                    })
                    const status = config.errors.status
                    return errors.errorResponse(res, message, statusCode, status)
                }
                req[k] = value
            }
        }
        return next()
    }
}

module.exports = {
    MW,
    Joi,
}
