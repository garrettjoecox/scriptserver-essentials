
var ScriptServer = require('scriptserver');

module.exports = function(server) {

    server.use([
        'scriptserver-command',
        'scriptserver-json',
        'scriptserver-helpers',
        'scriptserver-event'
    ]);

    server.on('login', e => {
      server.getJSON(e.player, 'hasJoined')
        .then(flag => {
          if (flag) return;
          return server.send(`give ${e.player} minecraft:iron_pickaxe`)
            .then(() => server.send(`give ${e.player} minecraft:iron_shovel`))
            .then(() => server.send(`give ${e.player} minecraft:iron_axe`))
            .then(() => server.send(`give ${e.player} minecraft:iron_sword`))
            .then(() => server.send(`give ${e.player} minecraft:bed`))
            .then(() => server.send(`give ${e.player} minecraft:bread 32`))
            .then(() => server.setJSON(e.player, 'hasJoined', true));
        });
    });

    server.command('restart', cmd => {
        server.isOp(cmd.sender)
            .then(result => {
                if (result){
                    if (cmd.args[0] === 'snapshot' || cmd.args[0] === 'release') server.jar = cmd.args[0];
                    return server.stop()
                        .then(() => server.wait(5000))
                        .then(() => server.start());
                }
            })
            .catch(e => server.tellRaw(e.message, cmd.sender, {color: 'red'}));
    });

    server.command('tpa', cmd => {
        var tpPlayer;

        server.isOnline(cmd.args[0])
            .then(d => {
                if (!d) throw new Error(`${cmd.args[0]} is not online.`);
                tpPlayer = cmd.args[0];
            })
            .then(d => server.setJSON(tpPlayer, 'tprequest', {
                type: 'tpa',
                player: cmd.sender,
                timestamp: Date.now()
            }))
            .then(d => server.tellRaw(`tpa sent to ${tpPlayer}, expires in 2 minutes.`, cmd.sender, {color: 'gray'}))
            .then(d => server.tellRaw(`tpa received from ${cmd.sender}, use ~tpaccept or ~tpdeny, expires in 2 minutes.`, tpPlayer, {color: 'gray'}))
            .catch(e => server.tellRaw(e.message, cmd.sender, {color: 'red'}));
    });

    server.command('tpahere', cmd => {
        var tpPlayer;

        server.isOnline(cmd.args[0])
            .then(d => {
                if (!d) throw new Error(`${cmd.args[0]} is not online.`);
                tpPlayer = cmd.args[0];
            })
            .then(d => server.setJSON(tpPlayer, 'tprequest', {
                type: 'tpahere',
                player: cmd.sender,
                timestamp: Date.now()
            }))
            .then(d => server.tellRaw(`tpahere sent to ${tpPlayer}, expires in 2 minutes.`, cmd.sender, {color: 'gray'}))
            .then(d => server.tellRaw(`tpahere received from ${cmd.sender}, use ~tpaccept or ~tpdeny, expires in 2 minutes.`, tpPlayer, {color: 'gray'}))
            .catch(e => server.tellRaw(e.message, cmd.sender, {color: 'red'}));
    });

    server.command('tpdeny', cmd => {
        var sender, receiver = cmd.sender, type;

        server.getJSON(receiver, 'tprequest')
            .then(d => {
                if (!d || Date.now() - d.timestamp > 120000) throw new Error('You don\'t have a valid teleport request.');
                sender = d.player;
                type = d.type;
            })
            .then(d => server.tellRaw(`${type} to ${receiver} denied.`, sender, {color: 'gray'}))
            .then(d => server.tellRaw(`${type} from ${sender} denied.`, receiver, {color: 'gray'}))
            .then(d => server.setJSON(receiver, 'tprequest'), null)
            .catch(e => server.tellRaw(e.message, receiver, {color: 'red'}));
    });

    server.command('tpaccept', cmd => {
        var sender, receiver = cmd.sender, type, tpCommand, senderMessage, receiverMessage;

        server.getJSON(receiver, 'tprequest')
            .then(d => {
                if (!d || Date.now() - d.timestamp > 120000) throw new Error('You don\'t have a valid teleport request.');
                sender = d.player;
                type = d.type;
            })
            .then(d => {
                if (type === 'tpa') {
                    senderMessage = `tpa accepted, teleporting to ${receiver} in 3 seconds...`;
                    receiverMessage = `tpa accepted, teleporting ${sender} here in 3 seconds...`;
                    tpCommand = `tp ${sender} ${receiver}`;
                } else {
                    senderMessage = `tpahere accepted, teleporting ${receiver} here in 3 seconds...`;
                    receiverMessage = `tpahere accepted, teleporting to ${sender} in 3 seconds...`;
                    tpCommand = `tp ${receiver} ${sender}`;
                }
            })
            .then(d => server.tellRaw(senderMessage, sender, {color: 'gray'}))
            .then(d => server.tellRaw(receiverMessage, receiver, {color: 'gray'}))
            .then(d => server.setJSON(receiver, 'tprequest'), null)
            .then(d => server.wait(3000))
            .then(d => server.send(tpCommand))
            .then(d => server.send(`execute ${receiver} ~ ~ ~ particle cloud ~ ~1 ~ 1 1 1 0.1 100 force`))
            .then(d => server.send(`playsound entity.item.pickup ${receiver} ~ ~ ~ 10 1 1`))
            .catch(e => server.tellRaw(e.message, receiver, {color: 'red'}));
    });

    server.command('sethome', cmd => {
        var currentPos;

        server.getCoords(cmd.sender)
            .then(d => currentPos = d)
            .then(d => server.setJSON(cmd.sender, 'home', currentPos))
            .then(d => server.send(`spawnpoint ${cmd.sender} ${currentPos.x} ${currentPos.y} ${currentPos.z}`))
            .then(d => server.tellRaw('Home Set!', cmd.sender, {color: 'gray'}))
            .catch(e => server.tellRaw(e.message, cmd.sender, {color: 'red'}));
    });

    server.command('home', cmd => {
        var home;

        server.getJSON(cmd.sender, 'home')
            .then(d => {
              if (!d) throw new Error('You haven\'t set a home yet!');
              home = d;
            })
            .then(d => server.send(`tp ${cmd.sender} ${home.x} ${home.y} ${home.z}`))
            .then(d => server.send(`execute ${cmd.sender} ~ ~ ~ particle cloud ~ ~1 ~ 1 1 1 0.1 100 force`))
            .then(d => server.send(`playsound entity.item.pickup ${cmd.sender} ~ ~ ~ 10 1 1`))
            .catch(e => server.tellRaw(e.message, cmd.sender, {color: 'red'}));
    });

    server.command('spawn', cmd => {
        var spawn;

        server.getJSON('world', 'spawn')
            .then(d => {
              if (!d) throw new Error('World spawn hasn\'t been saved yet.');
              spawn = d;
            })
            .then(d => server.send(`tp ${cmd.sender} ${spawn.x} ${spawn.y} ${spawn.z}`))
            .then(d => server.send(`execute ${cmd.sender} ~ ~ ~ particle cloud ~ ~1 ~ 1 1 1 0.1 100 force`))
            .then(d => server.send(`playsound entity.item.pickup ${cmd.sender} ~ ~ ~ 10 1 1`))
            .catch(e => server.tellRaw(e.message, cmd.sender, {color: 'red'}));
    });

};
