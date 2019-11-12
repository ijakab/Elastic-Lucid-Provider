const cloneDeep = require('lodash/cloneDeep')

class BaseSerializer {
    constructor(rows, aggregations, pages) {
        this.pages = pages
        this.aggregations = aggregations
        this.rows = rows
    }
    
    toJSONSingle(modelInstance) {
        let clonedBody = cloneDeep(modelInstance.body)
        clonedBody._elasticId = modelInstance.id
        return clonedBody
    }
    
    toJSON() {
        if(!this.pages) return this.rows.map(row => this.toJSONSingle(row))
        if(this.pages.isOne) return this.toJSONSingle(this.rows[0])
        return {
            pagination: this.pages,
            records: this.rows.map(row => this.toJSONSingle(row))
        }
    }
}

module.exports = BaseSerializer
