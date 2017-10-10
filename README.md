# DISTANCE API
Test api to get shortest way for a given route

## Get started
### Clone the api
```bash
$ git clone https://github.com/francoispqt/distance-api
```

### Set you API key
set your env var GMAPS_API_KEY to you API key
```bash
$ export GMAPS_API_KEY=<YOUR_API_KEY>
```

### Run in docker
*you need a docker-compose 2.xx*
#### start
```bash
$ cd distance-api
$ docker-compose up -d
```

#### tests
```bash
$ cd distance-api
$ docker-compose -f docker-compose.yml -f docker-compose.test.yml up
```

#### Make commands
```bash
$ make # run for dev 
$ make test # run tests
$ make build-test # rm the containers and rebuild
$ make prod # run for prod
$ make build-prod # rm the containers and rebuild
```

### without docker
#### start
```bash
$ cd distance-api/api
$ npm i
$ npm start
```

```bash
$ cd distance-api/api
$ npm i
$ npm test
```

#### Routes
*POST/route*
request body: 
```json
[
    [41.43206,-81.38992],
    [41.43206,-82.03535],
    [41.43206,-90.38992]
]
```
response body:
```json
{ "token": "65e05679-f46d-4f23-a214-6042b289ce12" }
```

The token is valid for a number of minutes set in the config
After that, it is unusable

*GET/route/:token*
request params: 
```json
{ "token": "65e05679-f46d-4f23-a214-6042b289ce12" }
```
response body:
```json
{
  "total_time": 28411,
  "total_distance": 818689,
  "status": "success",
  "path": [
    [
      41.43206,
      -81.38992
    ],
    [
      41.43206,
      -82.03535
    ],
    [
      41.43206,
      -90.38992
    ]
  ]
}
```
The first time you call *GET/route/:token*, it will call the google maps api, then save the result in the Route document which as a defined ttl. The next time you call it, it will retrieve the result from mongo until the doc expires.