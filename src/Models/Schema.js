const ElasticModel = use('ElasticLucid/Model')

class Step extends ElasticModel{
    static get index() {
        return 'app_schema'
    }
}

module.exports = Step