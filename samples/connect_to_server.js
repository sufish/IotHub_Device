var IotDevice = require("../sdk/iot_device")

var device = new IotDevice({productName: "IotApp", deviceName: "V5MyuncRK", secret: "GNxU20VYTZ"})
device.on("online", function () {
    console.log("device is online")
    device.disconnect()
})
device.on("offline", function () {
    console.log("device is offline")
})

device.on("error", function (err) {
    console.log(err)
})
device.connect()
