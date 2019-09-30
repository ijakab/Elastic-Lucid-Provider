const config = require('./config')
const fs = require('fs-extra')
const ElasticAdapter = require('./Adapter')
const Schema = require('./Models/Schema')

module.exports = async () => {
    let runSchemas = []
    if(await ElasticAdapter.indexExists(Schema.index)) {
        let schemas = await Schema.query().paginate(1, 1000)
        runSchemas = schemas.rows.map(row => row.body.name)
    }
    
    let items = await fs.readdir(config.migrationsDirectory)
    items = items.filter(item => item.endsWith('.js'))
    let schemas = items.map(item => item.split('.js')[0])
    
    for(let schemaFile of schemas) {
        let schema = require(`${config.migrationsDirectory}/${schemaFile}`)
        if(!schema.index) continue
        if(runSchemas.includes(schemaFile)) continue
        if(!(await ElasticAdapter.indexExists(schema.index))) await ElasticAdapter.createIndex(schema.index)
        if(schema.mappings) await ElasticAdapter.runMapping(schema.index, schema.mappings)
        if(schema.settings) await ElasticAdapter.runSettings(schema.index, schema.settings)
        await Schema.create({
            name: schemaFile
        })
        this.success(`Run schema for ${schemaFile}`)
    }
}