'use strict'

const app = require('express')()
const routes = require('./routes')
const config = require('./config')
const errors = require('./utils/errors')
const bodyParser = require('body-parser')
const db = require('./utils/db')

app.use(bodyParser.json())

// Load the routes
routes(app)

// Default error handler, to avoid unhandled errors
app.use(errors.errorResponseMW)

// start db, wait for connecton to be open to start app
db
.init()
.then(() => {
    app.listen(config.server.port)
    // eslint-disable-next-line
    console.log(`App listening @ ${config.server.port}`)
})
.catch(console.error) // eslint-disable-line

module.exports = app
