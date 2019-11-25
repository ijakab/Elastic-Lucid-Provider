const ElasticModel = require('./Base')
const config = require('../config')

class Step extends ElasticModel {
    static get index() {
        return config.schemaIndex || 'app_schema'
    }
}

module.exports = Step
