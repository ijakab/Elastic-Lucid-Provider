const cloneDeep = require('lodash/cloneDeep')

class BaseSerializer {
    constructor(rows, aggregations, pages) {
        this.pages = pages
        this.aggregations = aggregations
        this.rows = rows
    }
    
    toJSONSingle(modelInstance, args) {
        let clonedBody = cloneDeep(modelInstance.body)
        clonedBody._elasticId = modelInstance.id
        return clonedBody
    }
    
    toJSON(...args) {
        if(!this.pages) return this.rows.map(row => this.toJSONSingle(row, ...args))
        if(this.pages.isOne) return this.toJSONSingle(this.rows[0], ...args)
        return {
            pagination: this.pages,
            records: this.rows.map(row => this.toJSONSingle(row),...args)
        }
    }
}

module.exports = BaseSerializer
