var IotDevice = require("../sdk/iot_device")
require('dotenv').config()
var path = require('path');

var device = new IotDevice({
    productName: process.env.PRODUCT_NAME,
    deviceName: process.env.DEVICE_NAME,
    secret: process.env.SECRET,
    clientID: path.basename(__filename, ".js"),
    storePath: `../tmp/${path.basename(__filename, ".js")}`

})
device.on("online", function () {
    console.log("device is online")
    setTimeout(function () {
        console.log("turned the lights off")
        device.reportShadow({lights: "off"})
    }, 3000)
})
device.on("shadow", function (desired, respondToShadowUpdate) {
    setTimeout(function () {
        console.log(`turned the lights ${desired.lights}`)
        respondToShadowUpdate()
    }, 1000)
})
device.connect()
