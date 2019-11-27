const config = require('./config')
const fs = require('fs-extra')
const ElasticAdapter = require('./Adapter')
const Schema = require('./Models/Schema') //Schema model
const SchemaSchema = require('./Migrations/Schema') //Schema migration

module.exports = async () => {
    let runSchemas = []
    if(await ElasticAdapter.indexExists(Schema.index)) {
        let schemas = await Schema.query().paginate(1, 1000)
        runSchemas = schemas.rows.map(row => row.body.name)
    } else {
        await ElasticAdapter.createIndex(Schema.index)
        await ElasticAdapter.runMapping(Schema.index, SchemaSchema.mappings)
    }
    
    let items = await fs.readdir(config.migrationsDirectory)
    items = items.filter(item => item.endsWith('.js'))
    let schemas = items.map(item => item.split('.js')[0])
    
    for(let schemaFile of schemas) {
        let schema = require(`${config.migrationsDirectory}/${schemaFile}`)
        if(!schema.index) continue
        if(runSchemas.includes(schemaFile)) continue
        try {
            if(!(await ElasticAdapter.indexExists(schema.index))) {
                await ElasticAdapter.createIndex(schema.index)
                console.log('Created index ', schema.index)
            }
            
            if(schema.settings) {
                await ElasticAdapter.closeIndex(schema.index)
                try {
                    await ElasticAdapter.runSettings(schema.index, schema.settings)
                } catch (e) {
                    await ElasticAdapter.openIndex(schema.index)
                    throw e
                }
                await ElasticAdapter.openIndex(schema.index)
    
    
                console.log('Run settings for ', schemaFile)
            }
    
            if(schema.mappings) {
                await ElasticAdapter.runMapping(schema.index, schema.mappings)
                console.log('Run mapping for ', schemaFile)
            }
        } catch (e) {
            console.error('error during migrations %o', e)
            console.warn('Be aware that if only part of migration is successful, it will not be reverted, but this migration will run again. If you need to revert anything, you need to do it manually')
            throw e
        }
        
        await Schema.create({
            name: schemaFile
        })
    }
}
