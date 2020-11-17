const pick = require('lodash/pick')
const objectToScript = require('./ObjectToScript')
const promiseCall = require('./PromiseCall')

module.exports = {
    
    setClient(client) {
        this.client = client
    },
    
    async indexExists(index) {
        const p = this.client.indices.exists({index})
        let response = await promiseCall(p, true)
        return response && response.body
    },
    
    async createIndex(index) {
        const p = this.client.indices.create({index})
        return await promiseCall(p, true)
    },
    
    async openIndex(index) {
        const p = this.client.indices.open({index})
        return await promiseCall(p, true)
    },
    
    async closeIndex(index) {
        const p = this.client.indices.close({index})
        return await promiseCall(p, true)
    },
    
    async runMapping(index, body) {
        let properties = Object.keys(body.properties)
        for(let property of properties) {
            if(typeof body.properties[property] === 'string') {
                body.properties[property] = {type: body.properties[property]}
            }
        }
        const p = this.client.indices.putMapping({
            index,
            body: JSON.stringify(body)
        })
        return await promiseCall(p, true)
    },
    
    async runSettings(index, body) {
        const p = this.client.indices.putSettings({
            index,
            body: JSON.stringify(body)
        })
        return await promiseCall(p, true)
    },
    
    async createOrUpdate(index, body, id) {
        return await this.client.index({
            index,
            body,
            id
        })
    },
    
    async getSingle(index, id) {
        const p = this.client.get({
            index,
            id
        });
        return await promiseCall(p, true)
    },
    
    async deleteSingle(index, id) {
        const p = this.client.delete({
            index,
            type: this.type,
            id
        })
        return await promiseCall(p, true)
    },
    
    async search(index, body) {
        const p = this.client.search({
            index,
            body
        })
        return await promiseCall(p, true)
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
        const p = this.client.bulk({
            body: elasticStupidBody
        })
        return await promiseCall(p, true)
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
        const p = this.client.msearch({body: elasticStupidBody})
        let elasticResponse = await promiseCall(p, true)
        return elasticResponse.responses
    },
    
    async dropIndex(index) {
        const p = this.client.indices.delete({
            index
        });
        return await promiseCall(p, true)
    },
    
    async updateByQuery(index, query, updateObject) {
        const p = this.client.updateByQuery({
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
        return await promiseCall(p, true)
    },
    
    async deleteByQuery(index, body) {
        const p = this.client.deleteByQuery({
            index,
            type: this.type,
            conflicts: 'proceed',
            body
        })
        return await promiseCall(p, true)
    },
    
    async dropIndex(index) {
        const p = this.client.indices.delete({
            index
        });
        return await promiseCall(p, true)
    },
    
    async startScroll(index, body, timeout) {
        const p = this.client.search({
            size: 10000,
            index,
            body,
            rest_total_hits_as_int: true,
            scroll: timeout
        })
        return await promiseCall(p, true)
    },
    
    async nextScroll(scrollId, timeout) {
        const p = this.client.scroll({
            scrollId,
            scroll: timeout,
            rest_total_hits_as_int: true
        })
        return await promiseCall(p, true)
    }
}
