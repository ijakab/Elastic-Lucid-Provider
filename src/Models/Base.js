const adapter = require('../Adapter')
const bodybuilder = require('bodybuilder')
const extendBuilder = require('../ExtendBuilder')
const BaseSerializer = require('../Serializers/Base')

class ElasticBaseModel {
    constructor(body, id) {
        this.id = id
        this.body = body
    }
    
    static get adapter() {
        return adapter
    }
    
    static get resourceType() {
        return this.name
    }
    
    static get resourceTypeField() {
        return 'resourceType'
    }

    static async create(body, id) {
        if(this.resourceType) {
            body[this.resourceTypeField] = this.resourceType
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
    
    static async findBy(field, value) {
        return await this.query()
            .query('match', field, value)
            .first()
    }

    static async findOrFail(id) {
        let response = await adapter.getSingle(this.index, id)
        return new this(response._source, response._id)
    }
    
    static async findByOrFail(field, value) {
        let instance = await this.query()
            .query('match', field, value)
            .first()
        if(!instance) throw {status: 400, message: 'error.notFound'}
        return instance
    }

    merge(newBody) {
        Object.assign(this.body, newBody)
    }
    
    async save() {
        return await adapter.createOrUpdate(this.constructor.index, this.body, this.id)
    }
    
    async delete() {
        return await adapter.deleteSingle(this.constructor.index, this.id)
    }
    
    toJSON() {
        const Serializer = this.constructor.resolveSerializer()
        const serializer = new Serializer([this], null, {isOne: true})
        return serializer.toJSON()
    }

    static async raw(query) {
        let response = await adapter.search(this.index, query)
        return this.responseToObject(response)
    }

    static async rawMany(queries) {
        let results = await adapter.multiSearch(this.index, queries)
        return results.map(result => this.responseToObject(result))
    }
    
    static queryMacro(name, handler) {
        if(!this._queryMacro) this._queryMacro = {}
        this._queryMacro[name] = handler
    }

    static query() {
        return extendBuilder(bodybuilder(), this)
    }
    
    static get Serializer() {
        return BaseSerializer
    }
    
    static resolveSerializer() {
        if(typeof this.Serializer === 'string') {
            return use(this.Serializer)
        } else {
            return this.Serializer
        }
    }

    static responseToObject(response, pagination={}) {
        const rows = response.body.hits.hits.map(hit => new this(hit._source, hit._id))
        pagination.total = response.body.hits.total.value
        const Serializer = this.resolveSerializer()
        return new Serializer(rows, response.body.aggregations, pagination)
    }

    static async bulkAction(bulkBody, ...pluckFields) {
        return await adapter.bulkAction(this.index, bulkBody, pluckFields)
    }
    
    static _bootIfNotBooted () {
        if (!this.$booted) {
            this.$booted = true
            this.boot()
        }
    }
    
    static boot() {}
    
    static addTrait(trait, options) {
        let Trait
        if(typeof trait !== 'string') Trait = trait
        else {
            try {
                Trait = use('App/Models/Traits/Elastic/' + trait)
            } catch (e) {
                Trait = use(trait)
            }
        }
        let traitInstance = new Trait()
        traitInstance.register(this, options)
    }
    
    static get iocHooks () {
        return ['_bootIfNotBooted']
    }
    
    static get makePlain () {
        return true
    }
    
    static async iterateRaw(rawQuery, iteratee, { mode = 'Single', timeout = '10m' }) {
        let startScrollRes = await this.adapter.startScroll(this.index, rawQuery, timeout)
        let scrollId = startScrollRes.body._scroll_id
        
        let hits = startScrollRes.body.hits.hits
        let scrolledResponse = startScrollRes
        while(hits.length) {
            if(mode === 'Single' || mode === 'SingleOnce') {
                for(let hit of hits) {
                    let obj = new this(hit._source, hit._id)
                    await iteratee(obj)
                }
            } else {
                const serializer = this.responseToObject(scrolledResponse)
                await iteratee(serializer)
            }
            
            if(mode === 'SingleOnce' || mode === 'BatchOnce') break
            
            scrolledResponse = await this.adapter.nextScroll(scrollId, timeout)
            hits = scrolledResponse.body.hits.hits
        }
    }
    
}

module.exports = ElasticBaseModel
