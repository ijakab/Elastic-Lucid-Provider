const get = require('lodash/get')

module.exports = async (promise, verbose) => {
    const e = new Error();
    try {
        return await promise
    } catch (err) {
        if(get(err, 'meta.meta.request.params.body._outBuffer')) delete err.meta.meta.request
    
        e.data = err.data
        e.message = err.message
        e.meta = err.meta
        e.name = err.name
        if(verbose) console.error(JSON.stringify(e))
    
        throw e
    }
}
