let io;

function initSocket(server) {

    const socketIO = require("socket.io");

    io = socketIO(server, {

        cors: {
            origin: "*"
        }

    });

    io.on("connection", (socket) => {

        console.log("User connected", socket.id);


        socket.on("registerUser", (data) => {

            socket.join(data.userId);

        });


        socket.on("disconnect", () => {

            console.log("User disconnected");

        });

    });

}

function getIO() {
    return io;
}

module.exports = { initSocket, getIO };