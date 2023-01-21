const ChatPageSocket = (socket) => {
  socket.on("join room", ({ chatId }) => {
    console.log(chatId);
    socket.join(chatId);
  });
  socket.on("send-message", (message) => {
    console.log(message);
    console.log(socket.rooms)
    socket.broadcast.in(message.chatId).emit("updated-messages", [message]);
  });
};
export default ChatPageSocket;