module.exports = (builderInstance, Model) => {
    builderInstance.fetch = async (pagination) => {
        let response = await Model.adapter.search(Model.index, builderInstance.build())
        return Model.responseToObject(response, pagination)
    }
    
    builderInstance.paginate = async (page, limit) => {
        builderInstance.size(limit)
        builderInstance.from(limit * (page-1))
        let data = await builderInstance.fetch({
            page,
            limit,
            perPage: limit
        })
        data.pagination.page = page
        data.pagination.limit = limit
        data.pagination.perPage = limit
        return data
    }
    
    builderInstance.first = async () => {
        let data = await builderInstance.fetch()
        return data.rows[0]
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
}
