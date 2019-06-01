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
})
device.on("command", function (command, data, respondCommand) {
    if (command == "ping") {
        console.log(`get ping with: ${data.readUInt32BE(0)}`)
        const buf = Buffer.alloc(4);
        buf.writeUInt32BE(Math.floor(Date.now())/1000, 0);
        respondCommand(buf)
    }
})
device.connect()
