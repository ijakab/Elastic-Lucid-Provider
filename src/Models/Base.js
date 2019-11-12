const adapter = require('../Adapter')
const bodybuilder = require('bodybuilder')
const cloneDeep = require('lodash/cloneDeep')
const extendBuilder = require('../ExtendBuilder')

class ElasticBaseModel {
    constructor(body, id) {
        this.id = id
        this.body = body
        this.adapter = adapter
    }

    static get createdAtField() {
        return 'createdAt'
    }

    static async create(body, id) {
        if(this.createdAtField) {
            body[this.createdAtField] = new Date()
        }
        let obj = new this(body, id)
        let response = await obj.save()
        obj.id = response._id
        return obj
    }

    static all() {
        return this.query().fetch()
    }

    static async find(id) {
        try {
            return await this.findOrFail(id)
        } catch (e) {
            return undefined
        }
    }

    static async findOrFail(id) {
        let response = await adapter.getSingle(this.index, id)
        return new this(response._source, response._id)
    }

    async save() {
        return await adapter.createOrUpdate(this.constructor.index, this.body, this.id)
    }
    
    toJSON() {
        let clonedBody = cloneDeep(this.body)
        clonedBody.id = this.id
        return clonedBody
    }

    static async raw(query) {
        let response = await adapter.search(this.index, query)
        return this.responseToObject(response)
    }

    static async rawMany(queries) {
        let results = await adapter.multiSearch(this.index, queries)
        return results.map(result => this.responseToObject(result))
    }

    static query() {
        return extendBuilder(bodybuilder(), this)
    }

    static responseToObject(response, pagination) {
        let rows = response.hits.hits.map(hit => new this(hit._source, hit._id))
        return {
            pagination: {total: response.hits.total},
            aggregations: response.aggregations,
            rows,
            toJSON() {
                let records = rows.map(row => row.toJSON())
                if(!pagination) return records
                return {
                    pagination,
                    records
                }
            }
        }
    }

    static async bulkAction(bulkBody, ...pluckFields) {
        return await adapter.bulkAction(this.index, bulkBody, pluckFields)
    }
}

module.exports = ElasticBaseModel
