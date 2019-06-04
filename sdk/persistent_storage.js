var level = require('level')

class PersistentStore {
    constructor(dbPath) {
        this.db = level(`${dbPath}/device_db/`)
    }

    getTags(callback) {
        this.db.get("tags", function (error, value) {
            if (error != null) {
                callback({tags: [], tags_version: 0})
            } else {
                callback(JSON.parse(value))
            }

        })
    }

    saveTags(tags) {
        this.db.put("tags", Buffer.from(JSON.stringify(tags)))
    }

    close() {
        this.db.close()
    }
}

module.exports = PersistentStore;