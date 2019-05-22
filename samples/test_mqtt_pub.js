var mqtt = require('mqtt')
require('dotenv').config()

var client = mqtt.connect('mqtt://127.0.0.1:1883', {
    username: `${process.env.DEVICE_NAME}@${process.env.PRODUCT_NAME}`,
    password: process.env.SECRET
})
client.on('connect', function (connack) {
    console.log(`return code: ${connack.returnCode}`)
    client.publish("/topic1", "test", console.log)
})