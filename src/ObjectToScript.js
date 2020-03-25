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
        return toElasticStupidJson(value) // for some reason elastic accept this weird json
    }
    else return `'${value}'`
}

const toElasticStupidJson = (data) => `[` +
    Object.entries(data)
        .map(v =>
            `"${v[0]}": ` + (
                typeof v[1] === `string`
                    ? `"${v[1]}"`
                    : (
                        Array.isArray(v[1]) ?
                            v[1].map(toElasticStupidJson)
                            : typeof v[1] === "object"
                            ? toElasticStupidJson(v[1])
                            : v[1]
                    )
            )
        )
        .join(`, `) +
    `]`;

