var IotDevice = require("../sdk/iot_device")
require('dotenv').config()
var path = require('path');

var device = new IotDevice({
    productName: process.env.PRODUCT_NAME,
    deviceName: process.env.DEVICE_NAME2,
    secret: process.env.SECRET2,
    clientID: path.basename(__filename, ".js"),
    storePath: `../tmp/${path.basename(__filename, ".js")}`

})
device.on("online", function () {
    console.log("device is online")
})
device.on("device_message", function (sender, payload) {
    console.log(`received ${payload.toString()} from: ${sender}`)
    setTimeout(function () {
        device.sendToDevice(sender, "pong")
    }, 1000)
})
device.connect()
