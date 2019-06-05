//iot_device.js
"use strict";
var levelStore = require('mqtt-level-store');
const ObjectId = require('bson').ObjectID;
var mqtt = require('mqtt')
const EventEmitter = require('events');
const storage = require('node-persist');
const pathToRegexp = require('path-to-regexp')
const PersistentStore = require("./persistent_storage")


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
        this.persistent_store = new PersistentStore(storePath)
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
            self.sendTagsRequest()
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
        this.persistent_store.close()
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

    checkRequestDuplication(requestID, callback) {
        var key = `requests/${requestID}`
        storage.getItem(key, function (err, value) {
            if (value == null) {
                storage.setItem(key, 1, {ttl: 1000 * 3600 * 6})
                callback(false)
            } else {
                callback(false)
            }
        })
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
            if (commandName.startsWith("$")) {
                payload = JSON.parse(data.toString())
                if (commandName == "$set_ntp") {
                    this.handleNTP(payload)
                } else if (commandName == "$set_tags") {
                    this.setTags(payload)
                }
            } else {
                this.emit("command", commandName, data, respondCommand)
            }
        }
    }

    handleNTP(payload) {
        var time = Math.floor((payload.iothub_recv + payload.iothub_send + Date.now() - payload.device_time) / 2)
        this.emit("ntp_set", time)
    }

    setTags(serverTags) {
        var self = this
        var subscribe = []
        var unsubscribe = []
        this.persistent_store.getTags(function (localTags) {
            if (localTags.tags_version < serverTags.tags_version) {
                serverTags.tags.forEach(function (tag) {
                    if (localTags.tags.indexOf(tag) == -1) {
                        subscribe.push(`tags/${self.productName}/${tag}/cmd/+/+/+/#`)
                    }
                })
                localTags.tags.forEach(function (tag) {
                    if (serverTags.tags.indexOf(tag) == -1) {
                        unsubscribe.push(`tags/${self.productName}/${tag}/cmd/+/+/+/#`)
                    }
                })
                if (subscribe.length > 0) {
                    self.client.subscribe(subscribe, {qos: 1})
                }
                if (unsubscribe.length > 0) {
                    self.client.unsubscribe(unsubscribe)
                }
                self.persistent_store.saveTags(serverTags)
            }
        })

    }

    dispatchMessage(topic, payload) {
        var cmdTopicRule = "(cmd|rpc)/:productName/:deviceName/:commandName/:encoding/:requestID/:expiresAt?"
        var tagTopicRule = "tags/:productName/:tag/cmd/:commandName/:encoding/:requestID/:expiresAt?"
        var m2mTopicRule = "m2m/:productName/:deviceName/:senderDeviceName/:MessageID"
        var result
        var self = this
        if ((result = pathToRegexp(cmdTopicRule).exec(topic)) != null) {
            this.checkRequestDuplication(result[6], function (isDup) {
                if (!isDup) {
                    self.handleCommand({
                        commandName: result[4],
                        encoding: result[5],
                        requestID: result[6],
                        expiresAt: result[7] != null ? parseInt(result[7]) : null,
                        payload: payload,
                        commandType: result[1]
                    })
                }

            })
        } else if ((result = pathToRegexp(tagTopicRule).exec(topic)) != null) {
            this.checkRequestDuplication(result[5], function (isDup) {
                if (!isDup) {
                    self.handleCommand({
                        commandName: result[3],
                        encoding: result[4],
                        requestID: result[5],
                        expiresAt: result[6] != null ? parseInt(result[6]) : null,
                        payload: payload,
                    })
                }
            })
        } else if ((result = pathToRegexp(m2mTopicRule).exec(topic)) != null) {
            this.checkRequestDuplication(result[4], function (isDup) {
                if (!isDup) {
                    self.emit("device_message", result[3], payload)
                }
            })
        }

    }


    sendDataRequest(resource, payload = "") {
        if (this.client != null) {
            var topic = `get/${this.productName}/${this.deviceName}/${resource}/${new ObjectId().toHexString()}`
            this.client.publish(topic, payload, {
                qos: 1
            })
        }
    }

    sendNTPRequest() {
        this.sendDataRequest("$ntp", JSON.stringify({device_time: Date.now()}))
    }

    sendTagsRequest() {
        var self = this
        this.persistent_store.getTags(function (tags) {
            self.sendDataRequest("$tags", JSON.stringify(tags))
        })
    }

    sendToDevice(deviceName, payload) {
        if (this.client != null) {
            var topic = `m2m/${this.productName}/${deviceName}/${this.deviceName}/${new ObjectId().toHexString()}`
            this.client.publish(topic, payload, {
                qos: 1
            })
        }
    }
}


module.exports = IotDevice;