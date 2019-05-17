//iot_device.js
"use strict";
var mqtt = require('mqtt')
const EventEmitter = require('events');

class IotDevice extends EventEmitter {
    constructor(server_address = "127.0.0.1:8883") {
        super();
        this.server_address = `mqtts://${server_address}`
    }

    connect() {
        this.client = mqtt.connect(this.server_address, {
            rejectUnauthorized: false
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