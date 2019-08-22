# ELASTIC LUCID PROVIDER

Gives nice [lucid](https://github.com/adonisjs/adonis-lucid)-like way for handling elasticsearch queries in [adonis framework](https://adonisjs.com/). 

It is built upon official [elastic npm client](https://www.npmjs.com/package/elasticsearch) and uses [bodybuilder](https://github.com/danpaz/bodybuilder) for query building.

While elasticsearch is awesome, when dealing with it you will realise that API it provides is sometimes weird and requires a lot of work.

This provider aims to provider better and easier API for dealing with elasticsearch API

## INSTALLATION

1. Install package

`npm i --save elastic-lucid-provider`

2. Register provider

```javascript
const providers = [
    'elastic-lucid-provider/Providers/ElasticLucidProvider',
]
```

```javascript
const aceProviders = [
    'elastic-lucid-provider/Providers/CommandsProvider',
]
```

3. Add `config/elasticLucid.js`

```javascript
const Env = use('Env')

module.exports = {
    connection: {
        host: Env.get('ELASTIC_HOST'),
        log: Env.get('ELASTIC_LOG', null),
        vpcActive: Env.get('ELASTIC_VPC_ACTIVE', false),
        username: Env.get('ELASTIC_USER', null),
        password: Env.get('ELASTIC_PASS', null)
    }
}
```

*Note*: You don't need to provide all this info. If you have elastic running on local machine accessible from specific ip, no need to supply username or password.

## MIGRATIONS

The provider stores information about run migrations in separate index called `app_schema`

In order to use migrations, make `app/Elastic/0000_Schema.jsz file with following code:

```javascript
module.exports = {
    index: 'app_schema',
    mappings: {
        dynamic: false,
        properties: {
            name: 'text',
            createdAt: 'date',
        }
    }
}
```

Migrations need to be stored in `app/Elastic/Schemas` (will be configurable in the future). If you registered commands provider, make new schema by running command:

`adonis make:elastic_migration {name: migration name} { --model: create a model also }`

Migrations look like this:
```javascript
module.exports = {
    index: 'users',
    mappings: {
        dynamic: false,
        properties: {
            username: 'text',
            posts: {
                dynamic: true,
                properties: {}
            }
        }
    },
    settings: {}
}
```

Read more about what can be put in settings and mappings on elasticsearch documentation. 

However, notice that provider gives you a little shortcut, you can simply set field type as string. It will be converted to object `{type: 'string'}`. If you need anything custom, you need to pass object as specified by elasticsearch documentation.

## MODELS

Unlike migrations, there is no required folder for models. They are just classes that extend BaseModel class.

They are built to have as similar API to lucid as possible.

### Defining models

Model files look like this:

```javascript
const ElasticModel = use('ElasticLucid/Model')

class User extends ElasticModel{
    static get index() {
        return 'users'
    }
    
    static get createdAtField() {
        return 'created_at'
    }

}

module.exports = Step
```

They need to have index getter on them and extend BaseModel which is bound to `ElasticLucid/Model`

Use it as any other adonis entity.

### Model instances

Get new instance simply by `new Model(body, id)`. If id is provided, it is automatically assumed that record with that database exists in elastic.

Much like with lucid, you can `Model.create({...body})`, `Model.find(id)`, `Model.findOrFail(id)`

When you have instance, you can edit its attributes and run `instance.save()`. It will create new record or update existing (depending if it has id or not).

**Main difference between lucid and elastic lucid api comes here**: Attributes are nested inside body object.

So unlike lucid, where you would do something like `user.name = 'joe'`, here you would do it like

```javascript
 user.body.name = 'Joe'
 console.log(user.body.lastname)
 user.id //id attribute is special as it is not nested in body
```

This change needed to be made, because unlike most sql databases, elastic does not treat id same as other attributes

### Model instance holders

Like in lucid, you can use `Model.all()` and various query builder methods to get multiple instances

Those methods will return object like this:

```javascript
{
    pages: {total: 40},
    aggregations: {}, //aggregation results, if any
    rows: [] //array of models
}
```

On any model instance or holder you can apply .toJSON method to get serialized data. Unlike lucid, this provider does not yet support custom serializers, hidden fields etc.

### Query builder

Access query builder simply by `Model.query()` method. It will return instance of bodybuilder.

Learn more about bodybuilder methods [here](https://github.com/danpaz/bodybuilder). Everything used by bodybuilder can be used here

So query would look something like:

```javascript
User.query().query('match', 'name', 'Joe')
```

**Note** Notice this weird query().query? First one is model method to get bodybuilder instance. Second one comes from bodybuilder.

Even thou it is confusing, nomenclature is like this to be as similar to lucid as possible.

#### Terminating methods

On query builder instance you can use many terminating functions that will apply some action to records that match query.

Those are:

1. fetch
1. paginate
1. first
1. nativeResult
1. update
1. iterate

`fetch`, `paginate` and `first` work much the same way as they do in lucid - they return model instance or holder with rows property that is array of model instances.

`update` also works much the same way as in lucid.

`delete` is not implemented in this version. we never needed it :( Coming soon

`nativeResult` will return result as returned by npm elastic adapter without any modification.

So, the code would look much like in lucid:

```javascript
let users = await User.query().query('match', 'name', 'Joe').paginate(1, 10)

for(let user of users.rows) {
    user.body.name = 'Pete'
    await user.save() //this is just for showcase, updating inside loop is bad idea
}

return users.toJSON()
```

```javascript
await User.query().query('match', 'name', 'Joe').update({
    surname: 'Doe',
    "something.nested": "anotherValue"
})
```

### `iterate` method

Iterating over many documents in elasticsearch can be a lot of trouble.

On small number of documents, you can simply `.fetch()` query and iterate over result.rows

However, elasticsearch will never return to you more than 10 000 results, and if you need to get that many documents, you would need to use elastic's scroll api. That is where this method comes in.

.iterate will do everything about scroll api for you and run provided iteratee for **every** record matching the query, even if there are more than 10 000

```javascript
await User.query().query('match', 'name', 'joe').iterate(async modelInstance => {
    modelInstance.body.name = _.upperFirst(modelInstance.body.name)
    await modelInstance.save()
})
```

**Note** This operations are usually memory and processor heavy and require a lot of time. If you can avoid this approach you should.

### Model.raw

If you get into situation that bodybuilder cannot build body you need, you can supply raw body. It will still return model the usual model holder from matching results

```javascript
let models = Model.raw({
    query: {
        match_all:{}
    }
})

return models.toJSON()
```

## MULTI SEARCH

`Model.rawMany()` runs elastic's msearch for provided query bodies - runs multiple search queries in one elastic call. Returns arrays of model holders for each of those search.

No need to build weird object that elastic accepts for msearch - just pass actual search body objects, and provider will handle the rest.

Accepts raw search bodies - if you want to use bodybuilder you still can, just `.build()` on bodybuilder.

```javascript
const differentSearchesOnSameIndex = await User.rawMany([
    {
        query: {match_all: {}}
    },
    {
        query: {
            term: {
                type: {
                    value: 'admin'
                }
            }
        }
    },
    User.query().query('match', 'name', 'joe').build()
    //or build this by bodybuilder
])

const admins = differentSearchesOnSameIndex[1]
for(let admin of admins.rows) {
    sendEmail(admin.body.email)
}
```

## BULK ACTION

Runs elastic's bulkAction, but with cleaner api and help of elastic models.

`Model.bulkAction(body, ...pluckFields)` accepts body of bulk action. It is different from elastic bulkAction body, will be shown in example

If action is update, and you want to update only some params, passing those params as second argument will speed up the process (but it is optional).

```javascript

const john = new User({name: 'Jon'}) // this one will be created
const jane = await User.find('ejkjdsks')
jane.body.name = 'Jane' //this one deleted
const paul = await User.query('match', 'name', 'paul').first()//this one will be deleted

await User.rawMany([
    {action: 'create', modelInstance: john},
    {action: 'update', modelInstance: jane},
    {action: 'delete', modelInstance: paul},
])

```


## Thanks

Special thanks to creators of all the frameworks and libraries used in this library
