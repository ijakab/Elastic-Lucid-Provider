const config = require('./config')

module.exports = (configSource) => {
    if(!configSource && typeof configSource !== 'object') throw {
        status: 500,
        message: 'Invalid configuration passed to serverInit on elastic lucid provider'
    }
    Object.assign(config, configSource)
    
    if(!config.migrationsDirectory) throw {
        status: 500,
        message: 'Could not find migrationsDirectory in serverInit configuration'
    }
    
    let connectionConfig = config.connection
    if(!connectionConfig) {
        let error = new Error()
        error.message = 'Could not find connection object in serverInit configuration'
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
    
    const ElasticAdapter = require('../src/Adapter')
    ElasticAdapter.setClient(client)
}
