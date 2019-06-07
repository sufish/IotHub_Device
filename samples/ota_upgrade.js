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
const currentVersion = "1.0"
device.on("online", function () {
    console.log("device is online")
})
device.on("ota_upgrade", function (ota, progress) {
    console.log(`going to upgrade ${ota.type}: ${ota.url}, version=${ota.version}`)
    var percent = 0
    var performUpgrade = function () {
        console.log(`download:${percent}`)
        progress.download(percent)
        if(percent < 100){
            percent += 20
            setTimeout(performUpgrade, 2000)
        }else{
            setTimeout(function () {
                console.log("upgrade completed")
                device.updateStatus({firmware_ver: ota.version})
            }, 3000)
        }
    }
    performUpgrade()
})

device.connect()
device.updateStatus({firmware_ver: currentVersion})