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
        
        const serverInit = require('../src/ServerInit')
        serverInit(Config.get('elasticLucid'))
    }
}

module.exports = ElasticLucidProvider
