const ElasticModel = require('./Base')

class Step extends ElasticModel{
    static get index() {
        return 'app_schema'
    }
}

module.exports = Step
