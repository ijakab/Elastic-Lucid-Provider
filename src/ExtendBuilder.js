module.exports = (builderInstance, Model) => {
    builderInstance.fetch = async (pagination) => {
        let response = await Model.adapter.search(Model.index, builderInstance.build())
        return Model.responseToObject(response, pagination)
    }
    
    builderInstance.paginate = async (page, limit) => {
        builderInstance.size(limit)
        builderInstance.from(limit * (page-1))
        return await builderInstance.fetch({
            page,
            limit,
            perPage: limit
        })
    }
    
    builderInstance.first = async () => {
        let result = await builderInstance.fetch({isOne: true})
        return result.rows[0]
    }
    
    builderInstance.nativeResult = () => {
        return Model.adapter.search(Model.index, builderInstance.build())
    }
    
    builderInstance.update = (updateObject) => {
        return Model.adapter.updateByQuery(Model.index, builderInstance.build(), updateObject)
    }
    
    builderInstance.delete = () => {
        return Model.adapter.deleteByQuery(Model.index, builderInstance.build())
    }
    
    builderInstance.iterate = async (iteratee, timeout='10m') => {
        let startScrollRes = await Model.adapter.startScroll(Model.index, builderInstance.build(), timeout)
        let scrollId = startScrollRes._scroll_id
        
        let hits = startScrollRes.hits.hits
        while(hits.length) {
            for(let hit of hits) {
                let obj = new this(hit._source, hit._id)
                await iteratee(obj)
            }
            let scrolledResponse = await Model.adapter.nextScroll(scrollId, timeout)
            hits = scrolledResponse.hits.hits
        }
    }
    
    if(Model._queryMacro) {
        Object.assign(builderInstance, Model._queryMacro)
    }
    
    return builderInstance
}
