var IotCoapDevice = require("../sdk/iot_coap_device")
require('dotenv').config()
var path = require('path');
var device = new IotCoapDevice({
    productName: process.env.PRODUCT_NAME,
    deviceName: process.env.DEVICE_NAME,
    secret: process.env.SECRET,
    clientID: path.basename(__filename, ".js"),
})
device.updateStatus({coap: true})
device.uploadData("this is a sample data", "coapSample")