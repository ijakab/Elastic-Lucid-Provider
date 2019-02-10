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
    else return `'${value}'`
}