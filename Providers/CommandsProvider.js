'use strict'

const ace = require('@adonisjs/ace')
const { ServiceProvider } = require('@adonisjs/fold')

class CommandsProvider extends ServiceProvider {
    register () {
        this.app.bind('ElasticLucid/MakeMigration', () => require('../commands/MakeMigration'))
        this.app.bind('ElasticLucid/RunMigration', () => require('../commands/RunMigration'))
    }

    boot () {
        ace.addCommand('ElasticLucid/MakeMigration')
        ace.addCommand('ElasticLucid/RunMigration')
    }
}

module.exports = CommandsProvider