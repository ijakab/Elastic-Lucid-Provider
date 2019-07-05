const adapter = use('ElasticLucid/Adapter')
const bodybuilder = require('bodybuilder')

class ElasticBaseModel {
    constructor(body, id) {
        this.id = id
        this.body = body
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

    static async raw(query) {
        let response = await adapter.search(this.index, query)
        return this.responseToObject(response)
    }

    static async rawMany(queries) {
        let results = await adapter.multiSearch(this.index, queries)
        return results.map(result => this.responseToObject(result))
    }

    static query() {
        let builder = bodybuilder()

        builder.fetch = async () => {
            let response = await adapter.search(this.index, builder.build())
            return this.responseToObject(response)
        }

        builder.paginate = async (page, limit) => {
            builder.size(limit)
            builder.from(limit * (page-1))
            let data = await builder.fetch()
            data.pagination.page = page
            data.pagination.limit = limit
            data.pagination.perPage = limit
            return data
        }

        builder.first = async () => {
            let data = await builder.fetch()
            return data.rows[0]
        }

        builder.nativeResult = () => {
            return adapter.search(this.index, builder.build())
        }

        builder.update = (updateObject) => {
            return adapter.updateByQuery(this.index, builder.build(), updateObject)
        }
        
        builder.iterate = async (iteratee, timeout='10m') => {
            let startScrollRes = await adapter.startScroll(this.index, builder.build(), timeout)
            let scrollId = startScrollRes._scroll_id
            
            let hits = startScrollRes.hits.hits
            while(hits.length) {
                for(let hit of hits) {
                    let obj = new this(hit._source, hit._id)
                    await iteratee(obj)
                }
                let scrolledResponse = await adapter.nextScroll(scrollId, timeout)
                hits = scrolledResponse.hits.hits
            }
        }

        return builder
    }

    static responseToObject(response) {
        let rows = response.hits.hits.map(hit => new this(hit._source, hit._id))
        return {
            pagination: {total: response.hits.total},
            aggregations: response.aggregations,
            rows
        }
    }

    static async bulkAction(bulkBody, ...pluckFields) {
        return await adapter.bulkAction(this.index, bulkBody, pluckFields)
    }
}

module.exports = ElasticBaseModel