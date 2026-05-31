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

            if (data?.userId) {

                socket.join(
                    data.userId.toString()
                );

                console.log(
                    "Joined room:",
                    data.userId
                );

            }

        });

        socket.on("disconnect", () => {

            console.log(
                "User disconnected"
            );

        });

    });

}

function getIO() {

    if (!io) {
        throw new Error(
            "Socket not initialized"
        );
    }

    return io;

}

module.exports = {
    initSocket,
    getIO
};