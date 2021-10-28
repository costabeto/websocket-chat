console.log('> Script started');
const express = require('express');
const webApp = express();
const webServer = require('http').createServer(webApp);
const io = require('socket.io')(webServer);

const state = createState();

webApp.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function (socket) {
  console.log(`User connected: ${socket.id}`);

  state.addUser(socket.id);
  socket.emit('bootstrap', state);

  socket.broadcast.emit('user-update', {
    socketId: socket.id,
    newMessages: state,
  });

  socket.on('user-message', ({ date, text }) => {
    const message = { user: socket.id, date, text };

    state.addMessage(message);

    socket.broadcast.emit('user-update', {
      socketId: socket.id,
      newMessages: [message],
    });
  });

  socket.on('disconnect', () => {
    state.removeUser(socket.id);
    socket.broadcast.emit('user-remove', socket.id);
  });
});

webServer.listen(3000, function () {
  console.log('> Server listening on port:', 3000);
});

function createState() {
  console.log('> Starting new state');

  const state = {
    messages: [],
    users: {},
    addUser,
    addMessage,
    removeUser,
  };

  function addUser(socketId) {
    return state.users[socketId];
  }

  function addMessage({ user, date, text }) {
    return state.messages.push({
      user,
      text,
      date,
    });
  }

  function removeUser(socketId) {
    delete state.users[socketId];
  }

  return state;
}
