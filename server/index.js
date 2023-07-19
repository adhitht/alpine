const express = require('express');
const app = express();
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors')
require('dotenv').config()
const server = http.createServer(app);
const io = new Server(server, { cors: {} });


app.use(cors())

app.get('/', (req, res) => {
    res.send('<p>This is the server for alpine chat</p>');
});

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);
    socket.on('setup', (room) => {
        console.log(`${socket.id} joined ${room}`);
        socket.join(room)
        socket.emit("connected");
    })

    socket.on('new_message', (message) => {
        console.log(message)
        console.log(`Message:${socket.id} ${message.message} ${message.room}`);
        socket.to(message.room).emit('recieve_message', message)
    })

    socket.on('request_new_chat', (chat) => {
        console.log(chat)
        console.log(chat.newchatphone)
        socket.to(chat.newchatphone).emit('requested_chat', chat)
    })


    // socket.on("newchat", (newMessageRecieved, userId) => {
    //     // socket.in(userId.userId).emit("new_notification", "Hello");
    //     // socket.in('unibic').emit("Hi", "asdasd");
    //     // console.log(newMessageRecieved, userId)
    //     // console.log(userId.userId)
    //     console.log('new message')
    //     newMessageRecieved.forEach((user) => {                                              
    //         if (user.user) {
    //             if (user.user._id == userId) return;
    //             console.log(user.user)
    //             socket.in(user.user._id).emit("new_notification", user.user.latestNotif);
    //         }
    //     });
    // });

});

server.listen(process.env.PORT || 8080, () => {
    console.log(`listening on *: http://localhost:${process.env.PORT || 8080}`);
});