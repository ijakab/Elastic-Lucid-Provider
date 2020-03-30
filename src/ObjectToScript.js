module.exports = function (object) {
    let start = 'ctx._source.'
    let script = ''
    for(let key of Object.keys(object)) {
        if(object[key] !== undefined) script += `${start}${key} = ${valueToString(object[key])};`
    }
    return script
}

function valueToString(value) {
    if(typeof value === 'number' || value === null) return value
    if(typeof value === 'object') {
        return toElasticStupidJson(value) // for some reason elastic accept this weird json
    }
    else return `'${value}'`
}

function toElasticStupidJson(data) {
    if(isPrimitive(data)) return primitiveDisplay(data)
    else if(typeof data === 'object') return objectDisplay(data)
}

function objectDisplay(data) {
    let inner = ''
    if(Array.isArray(data)) inner = data.filter(d => d !== undefined).map(toElasticStupidJson).join(', ')
    else inner = Object.entries(data)
        .filter(keyValue => keyValue[1] !== undefined)
        .map(keyValue => {
            return `"${keyValue[0]}": ` + toElasticStupidJson(keyValue[1])
        })
        .join(', ')
    return `[${inner}]`
}

function isPrimitive(value) {
    return typeof value === 'string'
        || typeof value === 'number'
        || typeof value === 'boolean'
        || value === null
}

function primitiveDisplay(value) {
    if(typeof value === 'string') return `"${value}"`
    if(typeof value === 'number') return `${value}`
    if(typeof value === 'boolean') return `${value}`
    if(value === null) return 'null'
}
