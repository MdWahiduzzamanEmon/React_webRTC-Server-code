const express = require("express");
const http = require("http");
const app = express();
const server = http.createServer(app);
const socket = require("socket.io");
const io = socket(server);

require("dotenv").config();
const path = require("path");
const port = 8080;
const users = {};

const socketToRoom = {};

io.on('connection', socket => {
    // handling Group Video Call
    socket.on("join_room", (data) => {
        console.log(data.userName)
        // getting the room with the room ID and adding the user to the room
        if (users[data?.roomID]) {
            const length = users[data?.roomID].length;

            // if 4 people have joined already, alert that room is full
            // if (length === 4) {
            //     socket.emit("room full");
            //     return;
            // }
            users[data?.roomID].push({
                socketId: socket.id,
                userName: data?.userName
            });

        } else {
            users[data?.roomID] = [{
                socketId: socket.id,
                userName: data?.userName
            }];
        }

        // returning new room with all the attendees after new attendee joined
        socketToRoom[socket.id] = data?.roomID;
        const usersInThisRoom = users[data?.roomID].filter(id => id?.socketId !== socket.id);

        //check duplicate user
        socket.emit("all users", usersInThisRoom);
        // console.log(users);
    });

    // sending signal to existing members when user join
    socket.on("sending signal", payload => {
        io.to(payload.userToSignal).emit('user joined', { signal: payload.signal, callerID: payload.callerID, userName: payload.userName });
    });

    // signal recieved by the user who joined
    socket.on("returning signal", payload => {
        io.to(payload.callerID).emit('receiving returned signal', { signal: payload.signal, id: socket.id, userName: payload.userName });
    });

    // handling user disconnect in group call
    socket.on('disconnect', () => {

        // getting the room array with all the participants

        const roomID = socketToRoom[socket.id];
        let room = users[roomID];
        console.log(users[roomID]);

        if (room) {
            // finding the person who left the room
            // creating a new array with the remaining people
            room = room.filter(id => id?.socketId !== socket.id);
            users[roomID] = room;
            //also remove the person to the socketToRoom object
            console.log(room);
            delete socketToRoom[socket.id];
        }
        // sending the new room array to all the participants
        // socket.emit("all users", room);


        // emiting a signal and sending it to everyone that a user left
        socket.broadcast.emit('user left', socket.id);
        console.log(room?.length + " users in room " + roomID);
    });
});


// const PORT = process.env.PORT || 8000
// if(process.env.PROD){
//     app.use( express.static(__dirname + '/client/build'));
//     app.get('*', (request, response) => {
// 	    response.sendFile(path.join(__dirname, 'client/build/index.html'));
//     });
// }

app.get('/', (req, res) => {
    res.send('server is running');
});

server.listen(process.env.PORT || port, () => console.log(`server is running.. on port- ${port}`));


