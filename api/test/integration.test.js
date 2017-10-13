if (!process.env.GMAPS_API_KEY) {
    throw new Error(`
        You must provide a google maps API key:
        export GMAPS_API_KEY=<YOUR_API_KEY>
    `)
}

const chai = require('chai')
const chaiHTTP = require('chai-http')
const app = require('../src/')
const db = require('../src/utils/db')

const expect = chai.expect

chai.use(chaiHTTP)

const testToken = (token, assertions, done) => {
    chai
        .request(app)
        .get(`/route/${token}`)
        .send()
        .end((err, res) => {
            assertions(err, res)
            done()
        })
}

/** TESTS */
describe('The API', () => {
    it('Throws a validation error if the payload is wrong', done => {
        db.init().then(() => {
            chai
                .request(app)
                .post('/route')
                .send({ foo: 'bar' })
                .end((err, res) => {
                    expect(res.body.error[0]).to.equal(
                        '"value" must be an array'
                    )
                    expect(res).to.have.status(400)
                    done()
                })
        })
    })

    it('Submits a route and returns a token when provided a path', done => {
        db.init().then(() => {
            chai
                .request(app)
                .post('/route')
                .send([
                    [41.43206, -81.38992],
                    [41.43206, -82.03535],
                    [41.43206, -90.38992],
                ])
                .end((err, res) => {
                    expect(res.body.token).to.be.ok // eslint-disable-line
                    expect(res).to.have.status(200)
                    return done()
                })
        })
    })

    it('Submits a route, and uses the token to get fastest drive', done => {
        db.init().then(() => {
            chai
                .request(app)
                .post('/route')
                .send([
                    [41.43206, -81.38992],
                    [41.43206, -82.03535],
                    [41.43206, -90.38992],
                ])
                .end((err, res) => {
                    const token = res.body.token
                    expect(token).to.be.ok // eslint-disable-line
                    expect(res).to.have.status(200)
                    // run this one in timeout to let time to get answer from google api
                    setTimeout(() => {
                        testToken(
                            token,
                            (err, res) => { // eslint-disable-line
                                expect(res.body.status).to.equal('success')
                                expect(res.body.total_time).to.not.be.null // eslint-disable-line
                                expect(res.body.total_distance).not.be.null // eslint-disable-line
                                expect(res).to.have.status(200)
                            },
                            () => {
                                testToken(
                                    token,
                                    (err, res) => { // eslint-disable-line
                                        expect(res.body.status).to.equal('success')
                                        expect(res.body.total_time).to.not.be.null // eslint-disable-line
                                        expect(res.body.total_distance).not.be.null // eslint-disable-line
                                        expect(res).to.have.status(200)
                                    },
                                    done
                                )
                            }
                        )
                    }, 1000)
                })
        })
    })

    it('Submits a route, and uses the token to get fastest drive but fails if has no response from maps api', done => {
        db.init().then(() => {
            chai
                .request(app)
                .post('/route')
                .send([
                    [0.43206, -0.38992],
                    [1.43206, -0.03535],
                    [2.43206, -1.03535],
                    [3.43206, -4.38992],
                ])
                .end((err, res) => {
                    expect(res.body.token).to.be.ok // eslint-disable-line
                    expect(res).to.have.status(200)
                    testToken(
                        res.body.token,
                        (err, res) => { // eslint-disable-line
                            expect(res).to.have.status(400)
                            expect(res.body.status).to.equal('failure')
                        },
                        done
                    )
                })
        })
    })
})
