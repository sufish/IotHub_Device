var mqtt = require('mqtt')
var jwt = require('jsonwebtoken')
require('dotenv').config()
var password = jwt.sign({
    username: "jwt_user",
    exp: Math.floor(Date.now() / 1000) + 10
}, process.env.JWT_SECRET)
var client = mqtt.connect('mqtt://127.0.0.1:1883', {
    username: "jwt_user",
    password: password
})
client.on('connect', function () {
    console.log("connected")
    client.subscribe("$SYS/brokers/+/clients/+/connected")
    client.subscribe("$SYS/brokers/+/clients/+/disconnected")
})

client.on("message", function (_, message) {
    console.log(message.toString())
})