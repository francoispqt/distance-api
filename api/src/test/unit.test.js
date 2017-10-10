if (!process.env.GMAPS_API_KEY) {
    throw new Error(`
        You must provide a google maps API key:
        export GMAPS_API_KEY=<YOUR_API_KEY>
    `)
}

const sinon = require('sinon')
const chai = require('chai')

const validation = require('../utils/validation')
const googleMaps = require('../utils/gmaps')
const errors = require('../utils/errors')

const Joi = validation.Joi
const googleMapsClient = googleMaps.client

const expect = chai.expect

describe('getFastestDrive', () => {
    // Prepare stubs for google maps client directions
    beforeEach(() => {
        sinon.stub(googleMapsClient, 'directions').callsArgWithAsync(1, null, {
            json: {
                routes: [
                    {
                        legs: [
                            {
                                distance: {
                                    value: 2,
                                },
                                duration: {
                                    value: 1,
                                },
                            },
                            {
                                distance: {
                                    value: 1,
                                },
                                duration: {
                                    value: 2,
                                },
                            },
                            {
                                distance: {
                                    value: 2,
                                },
                                duration: {
                                    value: 1,
                                },
                            },
                        ],
                    },
                ],
                status: 'OK',
            },
        })
    })

    // Clear stubs for google maps client directions
    afterEach(() => {
        googleMapsClient.directions.restore()
    })

    // Run test
    it('It should return a result with {status: "success", total_distance: 5, total_time: 4 }', done => {
        googleMaps
            .getFastestDrive([
                [22.286394, 114.149139],
                [23.286394, 114.883334],
                [23.453535, 115.234234],
            ])
            .then(result => {
                expect(result.status).to.equal('success')
                expect(result.total_distance).to.equal(5)
                expect(result.total_time).to.equal(4)
                done()
            })
    })
})


describe('validationMiddleware', () => {
    // Prepare stubs for errorResponse and Joi.Validate
    beforeEach(() => {
        const { error, value } = Joi.validate({ test: 1 }, { test: Joi.string().required() })
        sinon.stub(validation.Joi, 'validate')
        .returns({ error, value })
        sinon.stub(errors, 'errorResponse')
        .callsFake((arg1, arg2, arg3, arg4) => {
            return {
                statusCode: arg3,
                status: arg4,
                message: arg2,
            }
        })
    })

    // Clear stubs
    afterEach(() => {
        validation.Joi.validate.restore()
        errors.errorResponse.restore()
    })

    it('It should return a result with {status: "success", total_distance: 5, total_time: 4 }', done => {
        const req = { body: { test: 1 } }
        const r = validation.MW({ body: { test: Joi.string().required() } })(req, {}, () => {})
        expect(r.message[0]).to.equal('"test" must be a string')
        expect(r.statusCode).to.equal(400)
        expect(r.status).to.equal('failure')
        done()
    })
})
