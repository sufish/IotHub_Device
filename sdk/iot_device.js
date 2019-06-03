//iot_device.js
"use strict";
var levelStore = require('mqtt-level-store');
const ObjectId = require('bson').ObjectID;
var mqtt = require('mqtt')
const EventEmitter = require('events');
const storage = require('node-persist');
const pathToRegexp = require('path-to-regexp')


class IotDevice extends EventEmitter {
    constructor({serverAddress = "127.0.0.1:8883", productName, deviceName, secret, clientID, storePath} = {}) {
        super();
        this.serverAddress = `mqtts://${serverAddress}`
        this.productName = productName
        this.deviceName = deviceName
        this.secret = secret
        this.username = `${this.productName}/${this.deviceName}`
        if (clientID != null) {
            this.clientIdentifier = `${this.username}/${clientID}`
        } else {
            this.clientIdentifier = this.username
        }
        if (storePath != null) {
            this.manager = levelStore(storePath);
        }
        storage.init({dir: `${storePath}/message_cache`})
    }

    connect() {
        var opts = {
            rejectUnauthorized: false,
            username: this.username,
            password: this.secret,
            clientId: this.clientIdentifier,
            clean: false
        };
        if (this.manager != null) {
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
        this.client.on("message", function (topic, message) {
            self.dispatchMessage(topic, message)
        })
    }

    disconnect() {
        if (this.client != null) {
            this.client.end()
        }
    }

    uploadData(data, type = "default") {
        if (this.client != null) {
            var topic = `upload_data/${this.productName}/${this.deviceName}/${type}/${new ObjectId().toHexString()}`
            this.client.publish(topic, data, {
                qos: 1
            })
        }
    }

    updateStatus(status) {
        if (this.client != null) {
            var topic = `update_status/${this.productName}/${this.deviceName}/${new ObjectId().toHexString()}`
            this.client.publish(topic, JSON.stringify(status), {
                qos: 1
            })
        }
    }

    async checkRequestDuplication(requestID) {
        var key = `requests/${requestID}`
        var value = await storage.getItem(key)
        if (value == null) {
            await storage.setItem(key, 1, {ttl: 1000 * 3600 * 6})
            return false
        } else {
            return true
        }
    }

    handleCommand({commandName, requestID, encoding, payload, expiresAt, commandType = "cmd"}) {
        if (expiresAt == null || expiresAt > Math.floor(Date.now() / 1000)) {
            var data = payload;
            if (encoding == "base64") {
                data = Buffer.from(payload.toString(), "base64")
            }
            var self = this
            var respondCommand = function (respData) {
                var topic = `${commandType}_resp/${self.productName}/${self.deviceName}/${commandName}/${requestID}/${new ObjectId().toHexString()}`
                self.client.publish(topic, respData, {
                    qos: 1
                })
            }
            this.emit("command", commandName, data, respondCommand)
        }
    }

    dispatchMessage(topic, payload) {
        var cmdTopicRule = "(cmd|rpc)/:productName/:deviceName/:commandName/:encoding/:requestID/:expiresAt?"
        var result
        if ((result = pathToRegexp(cmdTopicRule).exec(topic)) != null) {
            if (this.checkRequestDuplication(result[6])) {
                this.handleCommand({
                    commandName: result[4],
                    encoding: result[5],
                    requestID: result[6],
                    expiresAt: result[7] != null ? parseInt(result[7]) : null,
                    payload: payload,
                    commandType: result[1]
                })
            }
        }
    }
}


module.exports = IotDevice;