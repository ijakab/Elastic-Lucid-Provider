'use strict'
const ace = require('@adonisjs/ace')
const fs = use('fs')
const Helpers = use('Helpers')
const ElasticAdapter = use('App/Elastic/Adapter')
const Schema = use('App/Elastic/Models/Schema')

class RunMigration extends ace.Command {
    static get signature() {
        return 'elastic_migration:run'
    }

    static get description() {
        return 'Run schemas'
    }

    async handle() {
        const confirm = await this
            .confirm('Are you sure you want to run mapping? You might loose some data')

        if(confirm) {
            let runSchemas = []
            if(await ElasticAdapter.indexExists(Schema.index)) {
                let schemas = await Schema.all()
                runSchemas = schemas.rows.map(row => row.body.name)
            }

            let items = fs.readdirSync(Helpers.appRoot('app/Elastic/Schemas'))
            let schemas = items.map(item => item.split('.js')[0])

            for(let schemaFile of schemas) {
                let schema = use(`App/Elastic/Schemas/${schemaFile}`)
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

            this.success('Schemas run')
        }
        process.exit(0)
    }
}

module.exports = RunMigration