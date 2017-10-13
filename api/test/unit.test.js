if (!process.env.GMAPS_API_KEY) {
    throw new Error(`
        You must provide a google maps API key:
        export GMAPS_API_KEY=<YOUR_API_KEY>
    `)
}

const sinon = require('sinon')
const chai = require('chai')

const validation = require('../src/utils/validation')
const googleMaps = require('../src/utils/gmaps')
const errors = require('../src/utils/errors')
const gmapsTestRes = require('./data/gmaps')

const Joi = validation.Joi
const googleMapsClient = googleMaps.client

const expect = chai.expect

describe('getFastestDrive', () => {
    // Prepare stubs for google maps client directions
    beforeEach(() => {
        sinon
            .stub(googleMapsClient, 'distanceMatrix')
            .callsArgWithAsync(1, null, gmapsTestRes)
    })

    // Clear stubs for google maps client directions
    afterEach(() => {
        googleMapsClient.distanceMatrix.restore()
    })

    // Run test
    it('It should return a result with {status: "success", total_distance: 6, total_time: 6 }', done => {
        googleMaps
            .getFastestDrive([
                [22.286394, 114.149139],
                [23.286394, 114.883334],
                [23.286394, 114.994567],
                [23.453535, 115.234234],
            ])
            .then(result => {
                expect(result.status).to.equal('success')
                expect(result.path).to.deep.equal([
                    [22.286394, 114.149139],
                    [23.453535, 115.234234],
                    [23.286394, 114.883334],
                    [23.286394, 114.994567],
                ])
                expect(result.total_distance).to.equal(6)
                expect(result.total_time).to.equal(6)
                done()
            })
    })

    it('Should get all permutatations from an array', done => {
        const a = Array.from(googleMaps.permute([1, 2, 3, 4]))
        expect(a).to.deep.equal([
            [1, 2, 3, 4],
            [2, 1, 3, 4],
            [3, 1, 2, 4],
            [1, 3, 2, 4],
            [2, 3, 1, 4],
            [3, 2, 1, 4],
            [4, 2, 3, 1],
            [2, 4, 3, 1],
            [3, 4, 2, 1],
            [4, 3, 2, 1],
            [2, 3, 4, 1],
            [3, 2, 4, 1],
            [4, 1, 3, 2],
            [1, 4, 3, 2],
            [3, 4, 1, 2],
            [4, 3, 1, 2],
            [1, 3, 4, 2],
            [3, 1, 4, 2],
            [4, 1, 2, 3],
            [1, 4, 2, 3],
            [2, 4, 1, 3],
            [4, 2, 1, 3],
            [1, 2, 4, 3],
            [2, 1, 4, 3],
        ])
        done()
    })
})

describe('validationMiddleware', () => {
    // Prepare stubs for errorResponse and Joi.Validate
    beforeEach(() => {
        const { error, value } = Joi.validate(
            { test: 1 },
            { test: Joi.string().required() }
        )
        sinon.stub(validation.Joi, 'validate').returns({ error, value })
        sinon
            .stub(errors, 'errorResponse')
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

    it('It should return a result with validation error message', done => {
        const req = { body: { test: 1 } }
        const r = validation.MW({
            body: { test: Joi.string().required() },
        })(req, {}, () => {})
        expect(r.message[0]).to.equal('"test" must be a string')
        expect(r.statusCode).to.equal(400)
        expect(r.status).to.equal('failure')
        done()
    })
})
