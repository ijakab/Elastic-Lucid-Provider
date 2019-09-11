'use strict'
const ace = require('@adonisjs/ace')
const runMigrations = require('../src/RunMigrations')

class RunMigration extends ace.Command {
    static get signature() {
        return 'elastic_migration:run'
    }

    static get description() {
        return 'Run schemas'
    }

    async handle(args) {
        const confirm = await this
            .confirm('Are you sure you want to run mapping? You might loose some data')

        if(confirm) {
            await runMigrations()

            this.success('Schemas run')
        }
        
        if(!args.noExit) process.exit(0)
    }
}

module.exports = RunMigration
