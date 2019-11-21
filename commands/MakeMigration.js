'use strict'

const { Command } = use('@adonisjs/ace')
const Helpers = use('Helpers')
const upperFirst = require('lodash/upperFirst')
const lowerFirst = require('lodash/lowerFirst')
const config = require('../src/config')

class MakeMigration extends Command {
    static get signature () {
        return 'make:elastic_migration {name: migration name} { --model: create a model also }'
    }

    static get description () {
        return 'Make elastic migration'
    }

    async handle (args, options) {
        await this.ensureFile(`${config.migrationsDirectory}/${Date.now()}_${lowerFirst(args.name)}.js`)
        if(options.model) await this.ensureFile(Helpers.appRoot(`app/Elastic/Models/${upperFirst(args.name)}.js`))
        this.success('Migration created')
        process.exit(0)
    }
}

module.exports = MakeMigration
