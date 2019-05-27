//iot_device.js
"use strict";
var levelStore = require('mqtt-level-store');
const ObjectId = require('bson').ObjectID;
var mqtt = require('mqtt')
const EventEmitter = require('events');

class IotDevice extends EventEmitter {
    constructor({serverAddress = "127.0.0.1:8883", productName, deviceName, secret, clientID, storePath} = {}) {
        super();
        this.serverAddress = `mqtts://${serverAddress}`
        this.productName = productName
        this.deviceName = deviceName
        this.secret = secret
        this.username = `${this.productName}/${this.deviceName}`
        if(clientID != null){
            this.clientIdentifier = `${this.username}/${clientID}`
        }else{
            this.clientIdentifier = this.username
        }
        if(storePath != null) {
            this.manager = levelStore(storePath);
        }
    }

    connect() {
        var opts = {
            rejectUnauthorized: false,
            username: this.username,
            password: this.secret,
            clientId: this.clientIdentifier,
            clean: false
        };
        if(this.manager != null){
            opts.incomingStore = this.manager.incoming
            opts.outgoingStore = this.manager.outgoing
        }
        this.client = mqtt.connect(this.serverAddress, opts)
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

    uploadData(data, type="default"){
        if(this.client != null){
            var topic = `upload_data/${this.productName}/${this.deviceName}/${type}/${new ObjectId().toHexString()}`
            this.client.publish(topic, data, {
                qos: 1
            })
        }
    }
}


module.exports = IotDevice;