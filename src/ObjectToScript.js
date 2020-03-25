module.exports = function (object) {
    let start = 'ctx._source.'
    let script = ''
    for(let key of Object.keys(object)) {
        script += `${start}${key} = ${valueToString(object[key])};`
    }
    return script
}

function valueToString(value) {
    if(typeof value === 'number' || value === null) return value
    if(typeof value === 'object') {
        const stringified = JSON.stringify(value)
        return stringified.replace('{', '[').replace('}', ']') // for some reason elastic accept this weird json
    }
    else return `'${value}'`
}
