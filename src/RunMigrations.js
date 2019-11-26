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
            if(!(await ElasticAdapter.indexExists(schema.index))) await ElasticAdapter.createIndex(schema.index)
            if(schema.mappings) await ElasticAdapter.runMapping(schema.index, schema.mappings)
            if(schema.settings) await ElasticAdapter.runSettings(schema.index, schema.settings)
        } catch (e) {
            console.log('error during migrations %o', e)
            throw e
        }
        
        await Schema.create({
            name: schemaFile
        })
    }
}
