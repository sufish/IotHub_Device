//
var mqtt = require('mqtt')
var client = mqtt.connect('mqtt://127.0.0.1:1883')
client.on('connect', function (connack) {
    console.log(`return code: ${connack.returnCode}`)
    client.end()
})