const ObjectId = require('bson').ObjectID;
class OTAProgress {
    constructor({productName, deviceName, mqttClient, version, type}) {
        this.productName = productName
        this.deviceName = deviceName
        this.mqttClient = mqttClient
        this.version = version
        this.type = type
    }

    sendProgress(progress) {
        var meta = {
            version: this.version,
            type: this.type
        }
        var topic = `update_ota_status/${this.productName}/${this.deviceName}/${new ObjectId().toHexString()}`
        this.mqttClient.publish(topic, JSON.stringify({...meta, ...progress}), {qos: 1})
    }

    download(percent, desc = "download") {
        this.sendProgress({progress: percent, desc: desc})
    }

    downloadError(desc = "download error"){
        this.download(-1, desc)
    }

    checkMD5Error(desc = "check md5 error"){
        this.sendProgress({progress: -2, desc: desc})
    }

    installError(desc = "install error"){
        this.sendProgress({progress: -3, desc: desc})
    }

    error(desc = "error"){
        this.sendProgress({progress: -4, desc: desc})
    }
}

module.exports = OTAProgress;