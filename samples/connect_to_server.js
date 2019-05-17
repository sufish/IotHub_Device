var IotDevice = require("../sdk/iot_device")

var device = new IotDevice()
device.on("online", function () {
    console.log("device is online")
    device.disconnect()
})
device.on("offline", function () {
    console.log("device is offline")
})
device.connect()
