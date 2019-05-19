//iot_device.js
"use strict";
var mqtt = require('mqtt')
const EventEmitter = require('events');

class IotDevice extends EventEmitter {
    constructor({serverAddress = "127.0.0.1:8883", productName, deviceName, secret} = {}) {
        super();
        this.serverAddress = `mqtts://${serverAddress}`
        this.productName = productName
        this.deviceName = deviceName
        this.secret = secret
        this.username = `${this.deviceName}@${this.productName}`
    }

    connect() {
        this.client = mqtt.connect(this.serverAddress, {
            rejectUnauthorized: false,
            username: this.username,
            password: this.secret
        })
        var self = this
        this.client.on("connect", function () {
            self.emit("online")
        })
        this.client.on("offline", function () {
            self.emit("offline")
        })
        this.client.on("error", function (err) {
            self.emit("error", err)
        })
    }

    disconnect() {
        if (this.client != null) {
            this.client.end()
        }
    }
}


module.exports = IotDevice;