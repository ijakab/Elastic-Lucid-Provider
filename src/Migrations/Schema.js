module.exports = {
    index: 'cms_posts',
    settings: Config.get('elastic.settingsV1'),
    mappings: {
        dynamic: false,
        properties: {
            name: {
                type: 'text'
            },
            createdAt: {
                type: 'date'
            }
        }
    }
}
