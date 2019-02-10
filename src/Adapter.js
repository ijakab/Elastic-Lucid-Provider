const {pick} = use('lodash')
const objectToScript = use('ElasticLucid/ObjectToScript')

module.exports = {
    type: '_doc',

    setClient(client) {
        this.client = client
    },

    async indexExists(index) {
        return await this.client.indices.exists({index})
    },

    async createIndex(index) {
        return await this.client.indices.create({index})
    },

    async runMapping(index, body) {
        let properties = Object.keys(body.properties)
        for(let property of properties) {
            if(typeof body.properties[property] === 'string') {
                body.properties[property] = {type: body.properties[property]}
            }
        }
        return await this.client.indices.putMapping({
            index,
            type: this.type,
            body: JSON.stringify(body)
        })
    },

    async runSettings(index, body) {
        return await this.client.indices.putSettings({
            index,
            body: JSON.stringify(body)
        })
    },

    async createOrUpdate(index, body, id) {
        return await this.client.index({
            index,
            type: this.type,
            body,
            id
        })
    },

    async getSingle(index, id) {
        return await this.client.get({
            index,
            type: this.type,
            id
        });
    },

    async search(index, body) {
        let response = await this.client.search({
            index,
            body
        })
        return response
    },

    async bulkAction(index, body, pluckFields) {
        let elasticStupidBody = []
        for(let item of body) {
            let elasticItem = {
                _index: index,
                _type: this.type
            }
            if(item.modelInstance.id) elasticItem._id = item.modelInstance.id
            elasticStupidBody.push({
                [item.action]: elasticItem
            })
            let updateBody = item.modelInstance.body
            if(pluckFields && pluckFields.length) updateBody = pick(item.modelInstance.body, pluckFields)

            elasticStupidBody.push({doc: updateBody})
        }
        return await this.client.bulk({
            type: this.type,
            body: elasticStupidBody
        })
    },

    async multiSearch(index, searches) {
        let elasticStupidBody = []
        for(let search of searches) {
            elasticStupidBody.push({
                index,
                type: this.type
            })
            elasticStupidBody.push(search)
        }
        let elasticResponse = await this.client.msearch({body: elasticStupidBody})
        return elasticResponse.responses
    },

    updateByQuery(index, query, updateObject) {
        return this.client.updateByQuery({
            index,
            type: this.type,
            conflicts: 'proceed',
            body: {
                ...query,
                script: {
                    lang: 'painless',
                    source: objectToScript(updateObject)
                }
            }
        })
    }
}
