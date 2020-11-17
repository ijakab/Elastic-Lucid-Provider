const config = require('./config')
const { Client } = require('@elastic/elasticsearch')
const ElasticAdapter = require('../src/Adapter')

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
    
    let esConfig = {
        node: connectionConfig.host,
        log: connectionConfig.log // trace is useful sometimes
    }
    const user = connectionConfig.username
    const pass = connectionConfig.password
    if (user && pass) {
        esConfig.auth = {
            username: user,
            password: pass
        }
    }
    if (connectionConfig.apiKey && connectionConfig.apiKeyId) {
        esConfig.auth = {
            apiKey: {
                id: connectionConfig.apiKeyId,
                api_key: connectionConfig.apiKey
            }
        }
    }
    
    if(connectionConfig.cloudId) {
        esConfig.cloud = {
            id: connectionConfig.cloudId
        }
    }
    
    ElasticAdapter.setClient(new Client(esConfig))
}
