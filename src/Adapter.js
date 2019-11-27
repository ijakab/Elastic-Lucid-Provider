const pick = require('lodash/pick')
const objectToScript = require('./ObjectToScript')

module.exports = {

    setClient(client) {
        this.client = client
    },

    async indexExists(index) {
        let response = await this.client.indices.exists({index})
        return response && response.body
    },

    async createIndex(index) {
        return await this.client.indices.create({index})
    },
    
    async openIndex(index) {
        return await this.client.indices.open({index})
    },
    
    async closeIndex(index) {
        return await this.client.indices.close({index})
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
            body,
            id
        })
    },

    async getSingle(index, id) {
        return await this.client.get({
            index,
            id
        });
    },
    
    async deleteSingle(index, id) {
        return await this.client.delete({
            index,
            type: this.type,
            id
        })
    },

    async search(index, body) {
        return  await this.client.search({
            index,
            body
        })
    },

    async bulkAction(index, body, pluckFields) {
        let elasticStupidBody = []
        for(let item of body) {
            let elasticItem = {
                _index: index,
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
    },
    
    deleteByQuery(index, body) {
        return this.client.deleteByQuery({
            index,
            type: this.type,
            conflicts: 'proceed',
            body
        })
    },
    
    
    async startScroll(index, body, timeout) {
        let response = await this.client.search({
            size: 10000,
            index,
            body,
            rest_total_hits_as_int: true,
            scroll: timeout
        })
        return response
    },
    
    async nextScroll(scrollId, timeout) {
        return await this.client.scroll({
            scrollId,
            scroll: timeout,
            rest_total_hits_as_int: true
        })
    }
}
