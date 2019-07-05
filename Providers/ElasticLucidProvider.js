'use strict'
const { ServiceProvider } = use('@adonisjs/fold')

class ElasticLucidProvider extends ServiceProvider {
    register () {
        this.app.bind('ElasticLucid/Model', () => {
            return require('../src/Models/Base')
        })
        this.app.bind('ElasticLucid/Schema', () => {
            return require('../src/Models/Schema')
        })
        this.app.bind('ElasticLucid/Adapter', () => {
            return require('../src/Adapter')
        })
        this.app.bind('ElasticLucid/ObjectToScript', () => {
            return require('../src/ObjectToScript')
        })
    }

    boot () {
        const Config = this.app.use('Adonis/Src/Config')
        let connectionConfig = Config.get('elasticLucid.connection')
        if(!connectionConfig) {
            let error = new Error()
            error.message = 'Could not find connection object in config/elasticLucid'
            throw error
        }

        const elasticSearch = require('elasticsearch')

        let esConfig = {
            host: connectionConfig.host,
            log: connectionConfig.log // trace is useful sometimes
        }

        if (connectionConfig.vpcActive) {
            esConfig.connectionClass = require('http-aws-es')
        } else {
            const user = connectionConfig.username
            const pass = connectionConfig.password
            if (user && pass) {
                esConfig.httpAuth = `${user}:${pass}`
            }
        }
        const client = new elasticSearch.Client(esConfig)

        const ElasticAdapter = this.app.use('ElasticLucid/Adapter')
        ElasticAdapter.setClient(client)
    }
}

module.exports = ElasticLucidProvider