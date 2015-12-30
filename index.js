
var ScriptServer = require('scriptserver');

module.exports = function(server) {

  server.use([
    'scriptserver-command',
    'scriptserver-json',
    'scriptserver-helpers',
    'scriptserver-event'
  ]);

  server.on('login', e => {
    server.getJSON(e.player, 'joinDate')
      .then(hasJoined => {
        if (!hasJoined) return server.tellRaw(`Welcome to the server, ${e.player}!`, e.player, {color: 'yellow'})
          .then(() => server.send(`give ${e.player} minecraft:iron_pickaxe`))
          .then(() => server.send(`give ${e.player} minecraft:iron_shovel`))
          .then(() => server.send(`give ${e.player} minecraft:iron_axe`))
          .then(() => server.send(`give ${e.player} minecraft:iron_sword`))
          .then(() => server.send(`give ${e.player} minecraft:bed`))
          .then(() => server.send(`give ${e.player} minecraft:bread 32`))
          .then(() => server.setJSON(e.player, 'joinDate', Date.now()));
        else return server.tellRaw(`Welcome back, ${e.player}!`, e.player, {color: 'yellow'});
      })
      .catch(e => server.tellRaw(e.message, e.player, {color: 'red'}));
  });

  server.command('restart', cmd => {
    server.isOp(cmd.sender)
      .then(result => {
        if (!result) throw new Error('You don\'t have permission to do this!');
      })
      .then(() => server.stop())
      .then(() => server.wait(5000))
      .then(() => server.start())
      .catch(e => server.tellRaw(e.message, cmd.sender, {color: 'red'}));
  });

  server.command('tpa', cmd => {
    if (!cmd.args[0]) return server.tellRaw('Please specify a player', cmd.sender, {color: 'red'});
    var tpPlayer = cmd.args[0];

    server.isOnline(tpPlayer)
      .then(isOnline => {
        if (!isOnline) throw new Error(`${tpPlayer} is not online`);
      })
      .then(() => server.getDimension(tpPlayer))
      .then(tpPlayerDimension => {
        return server.getDimension(cmd.sender)
          .then(senderDimension => {
            if (tpPlayerDimension !== senderDimension) throw new Error(`You cannot request a teleport across dimensions, ${tpPlayer} is in the ${tpPlayerDimension}`);
          });
      })
      .then(() => server.setJSON(tpPlayer, 'tprequest', {
        type: 'tpa',
        player: cmd.sender,
        timestamp: Date.now()
      }))
      .then(() => server.tellRaw(`tpa sent to ${tpPlayer}, expires in 2 minutes`, cmd.sender, {color: 'gray'}))
      .then(() => server.tellRaw(`tpa received from ${cmd.sender}, use ~tpaccept or ~tpdeny, expires in 2 minutes`, tpPlayer, {color: 'gray'}))
      .catch(e => server.tellRaw(e.message, cmd.sender, {color: 'red'}));
  });

  server.command('tpahere', cmd => {
    if (!cmd.args[0]) return server.tellRaw('Please specify a player', cmd.sender, {color: 'red'});
    var tpPlayer = cmd.args[0];

    server.isOnline(tpPlayer)
      .then(isOnline => {
        if (!isOnline) throw new Error(`${tpPlayer} is not online`);
      })
      .then(() => server.getDimension(tpPlayer))
      .then(tpPlayerDimension => {
        return server.getDimension(cmd.sender)
          .then(senderDimension => {
            if (tpPlayerDimension !== senderDimension) throw new Error(`You cannot request a teleport across dimensions, ${tpPlayer} is in the ${tpPlayerDimension}`);
          });
      })
      .then(() => server.setJSON(tpPlayer, 'tprequest', {
        type: 'tpahere',
        player: cmd.sender,
        timestamp: Date.now()
      }))
      .then(() => server.tellRaw(`tpa sent to ${tpPlayer}, expires in 2 minutes`, cmd.sender, {color: 'gray'}))
      .then(() => server.tellRaw(`tpa received from ${cmd.sender}, use ~tpaccept or ~tpdeny, expires in 2 minutes`, tpPlayer, {color: 'gray'}))
      .catch(e => server.tellRaw(e.message, cmd.sender, {color: 'red'}));
  });

  server.command('tpdeny', cmd => {
    var sender, receiver = cmd.sender, type;

    server.getJSON(receiver, 'tprequest')
      .then(tprequest => {
        if (!tprequest || Date.now() - tprequest.timestamp > 120000) throw new Error('You don\'t have a valid teleport request');
        sender = tprequest.player;
        type = tprequest.type;
      })
      .then(() => server.tellRaw(`${type} to ${receiver} denied`, sender, {color: 'gray'}))
      .then(() => server.tellRaw(`${type} from ${sender} denied`, receiver, {color: 'gray'}))
      .then(() => server.setJSON(receiver, 'tprequest'), null)
      .catch(e => server.tellRaw(e.message, receiver, {color: 'red'}));
  });

  server.command('tpaccept', cmd => {
    var sender, receiver = cmd.sender, type, tpCommand, senderMessage, receiverMessage;

    server.getJSON(receiver, 'tprequest')
      .then(tprequest => {
        if (!tprequest || Date.now() - tprequest.timestamp > 120000) throw new Error('You don\'t have a valid teleport request.');
        sender = tprequest.player;
        type = tprequest.type;
      })
      .then(() => server.isOnline(sender))
      .then(isOnline => {
        if (!isOnline) throw new Error(`${sender} is not online`);
      })
      .then(() => server.getDimension(sender))
      .then(senderDimension => {
        return server.getDimension(receiver)
          .then(receiverDimension => {
            if (senderDimension !== receiverDimension) throw new Error(`You cannot accept a teleport across dimensions, ${sender} is in the ${senderDimension}`);
          });
      })
      .then(() => {
        if (type === 'tpa') {
          senderMessage = `tpa accepted, teleporting to ${receiver} in 3 seconds...`;
          receiverMessage = `tpa accepted, teleporting ${sender} here in 3 seconds...`;
          tpCommand = `tp ${sender} ${receiver}`;
          return server.getCoords(sender);
        } else {
          senderMessage = `tpahere accepted, teleporting ${receiver} here in 3 seconds...`;
          receiverMessage = `tpahere accepted, teleporting to ${sender} in 3 seconds...`;
          tpCommand = `tp ${receiver} ${sender}`;
          return server.getCoords(receiver);
        }
      })
      .then(coords => {
        if (type === 'tpa') {
          coords.dimension = senderDimension;
          return server.setJSON(sender, 'lastLoc', coords);
        } else {
          coords.dimension = receiverDimension;
          return server.setJSON(receiver, 'lastLoc', coords);
        }
      })
      .then(() => server.tellRaw(senderMessage, sender, {color: 'gray'}))
      .then(() => server.tellRaw(receiverMessage, receiver, {color: 'gray'}))
      .then(() => server.setJSON(receiver, 'tprequest'), null)
      .then(() => server.wait(4000))
      .then(() => server.send(tpCommand))
      .then(() => server.send(`execute ${receiver} ~ ~ ~ particle cloud ~ ~1 ~ 1 1 1 0.1 100 force`))
      .then(() => server.send(`playsound entity.item.pickup ${receiver} ~ ~ ~ 10 1 1`))
      .catch(e => server.tellRaw(e.message, receiver, {color: 'red'}));
  });

  server.command('back', cmd => {
    var currentPos, lastLoc, currentDim;

    server.getJSON(cmd.sender, 'lastLoc')
      .then(result => lastLoc = result)
      .then(result => {
        if (!result) throw new Error('No known last location');
        lastLoc = result;
        return server.getDimension(cmd.sender);
      })
      .then(dim => currentDim = dim)
      .then(() => {
        if (currentDim !== lastLoc.dimension) throw new Error(`You can't go back to the ${lastLoc.dimension}`);
        return server.getCoords(cmd.sender);
      })
      .then(coords => {
        currentPos = coords;
        currentPos.dimension = currentDim;
      });
      .then(() => server.setJSON(cmd.sender, 'lastLoc', currentPos))
      .then(d => server.send(`tp ${cmd.sender} ${currentPos.x} ${currentPos.y} ${currentPos.z}`))
      .then(d => server.send(`execute ${cmd.sender} ~ ~ ~ particle cloud ~ ~1 ~ 1 1 1 0.1 100 force`))
      .then(d => server.send(`playsound entity.item.pickup ${cmd.sender} ~ ~ ~ 10 1 1`))
      .catch(e => server.tellRaw(e.message, cmd.sender, {color: 'red'}));
  });

  server.command('sethome', cmd => {
    var currentPos, currentDim;

    server.getDimension(cmd.sender)
      .then(dim => currentDim = dim)
      .then(() => server.getCoords(cmd.sender))
      .then(pos => currentPos = pos)
      .then(() => server.setJSON(cmd.sender, currentDim + 'home', currentPos))
      .then(() => server.tellRaw(`Home set in ${currentDim}!`, cmd.sender, {color: 'gray'}))
      .catch(e => server.tellRaw(e.message, cmd.sender, {color: 'red'}));
  });

  server.command('home', cmd => {
    var home, currentDim;

    server.getDimension(cmd.sender)
      .then(dim => currentDim = dim)
      .then(() => server.getJSON(cmd.sender, currentDim + 'home'))
      .then(data => {
        if (!data) throw new Error(`You haven't set a home in the ${currentDim} yet!`);
        home = data;
        return server.getCoords(cmd.sender);
      })
      .then(coords => {
        coords.dimension = currentDim;
        return server.setJSON(cmd.sender, 'lastLoc', coords);
      })
      .then(d => server.send(`tp ${cmd.sender} ${home.x} ${home.y} ${home.z}`))
      .then(d => server.send(`execute ${cmd.sender} ~ ~ ~ particle cloud ~ ~1 ~ 1 1 1 0.1 100 force`))
      .then(d => server.send(`playsound entity.item.pickup ${cmd.sender} ~ ~ ~ 10 1 1`))
      .catch(e => server.tellRaw(e.message, cmd.sender, {color: 'red'}));
  });

  server.command('setspawn', cmd => {
    var currentPos, currentDim;

    server.isOp(cmd.sender)
      .then(result => {
        if (!result) throw new Error('You don\'t have permission to do this!');
      })
      .then(() => server.getDimension(cmd.sender))
      .then(dim => currentDim = dim)
      .then(() => server.getCoords(cmd.sender))
      .then(pos => currentPos = pos)
      .then(() => server.setJSON('world', currentDim + 'spawn', currentPos))
      .then(() => server.tellRaw(`${currentDim} spawn set!`, cmd.sender, {color: 'gray'}))
      .catch(e => server.tellRaw(e.message, cmd.sender, {color: 'red'}));
  });

  server.command('spawn', cmd => {
    var spawn, currentDim;

    server.getDimension(cmd.sender)
      .then(dim => {
        currentDim = dim;
        server.getJSON('world', dim + 'spawn')
      })
      .then(loc => {
        if (!loc) throw new Error('Spawn hasnt been set in this dimension yet');
        spawn = loc;
        return server.getCoords(cmd.sender);
      })
      .then(coords => {
        coords.dimension = currentDim;
        return server.setJSON(cmd.sender, 'lastLoc', coords);
      })
      .then(() => server.send(`tp ${cmd.sender} ${spawn.x} ${spawn.y} ${spawn.z}`))
      .then(() => server.send(`execute ${cmd.sender} ~ ~ ~ particle cloud ~ ~1 ~ 1 1 1 0.1 100 force`))
      .then(() => server.send(`playsound entity.item.pickup ${cmd.sender} ~ ~ ~ 10 1 1`))
      .catch(e => server.tellRaw(e.message, cmd.sender, {color: 'red'}));
  });
};
