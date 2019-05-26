var IotDevice = require("../sdk/iot_device")
require('dotenv').config()

var device = new IotDevice({
    productName: process.env.PRODUCT_NAME,
    deviceName: process.env.DEVICE_NAME,
    secret: process.env.SECRET,
    clientID: "upload_data.js"
})
device.on("online", function () {
    console.log("device is online")
})
device.connect()
device.uploadData("this is a sample data", "sample")