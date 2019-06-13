const coap = require("coap")
const ObjectId = require('bson').ObjectID;

class IotCoAPDevice {
    constructor({serverAddress = "127.0.0.1", serverPort = 5683, productName, deviceName, secret, clientID} = {}) {
        this.serverAddress = serverAddress
        this.serverPort = serverPort
        this.productName = productName
        this.deviceName = deviceName
        this.secret = secret
        this.username = `${this.productName}/${this.deviceName}`
        if (clientID != null) {
            this.clientIdentifier = `${this.username}/${clientID}`
        } else {
            this.clientIdentifier = this.username
        }
    }

    publish(topic, payload) {
        var req = coap.request({
            hostname: this.serverAddress,
            port: this.serverPort,
            method: "put",
            pathname: `mqtt/${topic}`,
            query: `c=${this.clientIdentifier}&u=${this.username}&p=${this.secret}`
        })

        req.end(Buffer.from(payload))
    }

    uploadData(data, type){
        var topic = `upload_data/${this.productName}/${this.deviceName}/${type}/${new ObjectId().toHexString()}`
        this.publish(topic, data)
    }

    updateStatus(status){
        var topic = `update_status/${this.productName}/${this.deviceName}/${new ObjectId().toHexString()}`
        this.publish(topic, JSON.stringify(status))
    }
}

module.exports = IotCoAPDevice