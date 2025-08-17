const { attachAgenda } = require('./agenda');
const { attachTimer } = require('./timer');

function attachAllSockets(io, pool) {
  attachAgenda(io, pool);
  attachTimer(io);
}

module.exports = { attachAllSockets };
