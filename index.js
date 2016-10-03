'use strict';

module.exports = function() {

  // Setup

  const server = this;
  const lastLocations = {};
  const tpRequests = {};

  server.use(require('scriptserver-event'));
  server.use(require('scriptserver-command'));
  server.use(require('scriptserver-json'));
  server.use(require('scriptserver-util'));

  server.config.essentials = Object.assign({}, {
    starterKit: [
      'iron_pickaxe',
      'iron_shovel',
      'iron_axe',
      'iron_sword',
      'bed',
      'bread 32'
    ]
  }, server.config.essentials);

  // Starting Kit & Login Messages

  server.on('login', event => {
    server.JSON.get(event.player, 'joined')
      .then(hasJoined => {
        if (!hasJoined) {
          return server.util.tellRaw(`Welcome to the server, ${event.player}!`, event.player, { color: 'yellow' })
            .then(() => Promise.all(server.config.essentials.starterKit.map(item => server.send(`give ${event.player} minecraft:${item}`))))
            .then(() => server.JSON.set(event.player, 'joined', Date.now()));
        } else {
          return server.util.tellRaw(`Welcome back, ${event.player}!`, event.player, { color: 'yellow' });
        }
      })
      .catch(e => server.util.tellRaw(e.message, event.player, { color: 'red' }));
  });

  // Home & Setting Home

  server.command('sethome', event => {
    let currentLoc;

    server.util.getLocation(event.player)
      .then(loc => currentLoc = loc)
      .then(() => server.JSON.get(event.player, 'home'))
      .then((homes = {}) => {
        homes[currentLoc.dimension] = currentLoc;
        return server.JSON.set(event.player, 'home', homes);
      })
      .then(() => server.util.tellRaw(`Home set in ${currentLoc.dimension}!`, event.player, { color: 'gray' }))
      .catch(e => server.util.tellRaw(e.message, event.player, { color: 'red' }));
  });

  server.command('home', event => {
    let currentLoc;

    server.util.getLocation(event.player)
      .then(loc => currentLoc = loc)
      .then(() => server.JSON.get(event.player, 'home'))
      .then((homes = {}) => {
        if (!homes.hasOwnProperty(currentLoc.dimension)) return Promise.reject(new Error(`You haven't set a home in the ${currentLoc.dimension} yet!`));
        else {
          lastLocations[event.player] = currentLoc;
          return server.send(`tp ${event.player} ${homes[currentLoc.dimension].x} ${homes[currentLoc.dimension].y} ${homes[currentLoc.dimension].z}`);
        }
      })
      .then(() => server.send(`execute ${event.player} ~ ~ ~ particle cloud ~ ~1 ~ 1 1 1 0.1 100 force`))
      .then(() => server.send(`playsound entity.item.pickup master ${event.player} ~ ~ ~ 10 1 1`))
      .catch(e => server.util.tellRaw(e.message, event.player, { color: 'red' }));
  });

  // Spawn & Setting Spawn

  server.command('setspawn', event => {
    let currentLoc;

    server.util.isOp(event.player)
      .then(result => result ? null : Promise.reject(new Error('You need to be op to set the spawn')))
      .then(() => server.util.getLocation(event.player))
      .then(loc => currentLoc = loc)
      .then(() => server.JSON.get('world', 'spawn'))
      .then((spawns = {}) => {
        spawns[currentLoc.dimension] = currentLoc;
        return server.JSON.set('world', 'spawn', spawns);
      })
      .then(() => server.util.tellRaw(`${currentLoc.dimension} spawn set!`, event.player, { color: 'gray' }))
      .catch(e => server.util.tellRaw(e.message, event.player, { color: 'red' }));
  });

  server.command('spawn', event => {
    let currentLoc;

    server.util.getLocation(event.player)
      .then(loc => currentLoc = loc)
      .then(() => server.JSON.get('world', 'spawn'))
      .then((spawns = {}) => {
        if (!spawns.hasOwnProperty(currentLoc.dimension)) return Promise.reject(new Error(`Spawn hasn't been set in the ${currentLoc.dimension} yet!`));
        else {
          lastLocations[event.player] = currentLoc;
          return server.send(`tp ${event.player} ${spawns[currentLoc.dimension].x} ${spawns[currentLoc.dimension].y} ${spawns[currentLoc.dimension].z}`);
        }
      })
      .then(() => server.send(`execute ${event.player} ~ ~ ~ particle cloud ~ ~1 ~ 1 1 1 0.1 100 force`))
      .then(() => server.send(`playsound entity.item.pickup master ${event.player} ~ ~ ~ 10 1 1`))
      .catch(e => server.util.tellRaw(e.message, event.player, { color: 'red' }));
  });

  // Teleport Requests

  server.command('tpa', event => {
    const toPlayer = event.args[0];
    const fromPlayer = event.player;

    Promise.resolve()
      .then(() => {
        if (!toPlayer) return Promise.reject(new Error('Please specify a player'));
        return server.util.isOnline(toPlayer);
      })
      .then(isOnline => isOnline ? null : Promise.reject(new Error(`${toPlayer} is not online`)))
      .then(() => server.util.getLocation(fromPlayer))
      .then(fromLoc => {
        return server.util.getLocation(toPlayer)
          .then(toLoc => {
            if (fromLoc.dimension !== toLoc.dimension) return Promise.reject(new Error(`Cannot teleport across dimensions, ${toPlayer} is in the ${toLoc.dimension}`));
          });
      })
      .then(() => {
        tpRequests[toPlayer] = {
          type: 'tpa',
          player: fromPlayer,
          timestamp: Date.now()
        }
      })
      .then(() => server.util.tellRaw(`tpa sent to ${toPlayer}, expires in 2 minutes`, fromPlayer, { color: 'gray' }))
      .then(() => server.util.tellRaw(`tpa received from ${fromPlayer}, use ~tpaccept or ~tpdeny, expires in 2 minutes`, toPlayer, { color: 'gray' }))
      .catch(e => server.util.tellRaw(e.message, event.player, { color: 'red' }));
  });

  server.command('tpahere', event => {
    const toPlayer = event.args[0];
    const fromPlayer = event.player;

    Promise.resolve()
      .then(() => {
        if (!toPlayer) return Promise.reject(new Error('Please specify a player'));
        return server.util.isOnline(toPlayer);
      })
      .then(isOnline => isOnline ? null : Promise.reject(new Error(`${toPlayer} is not online`)))
      .then(() => server.util.getLocation(fromPlayer))
      .then(fromLoc => {
        return server.util.getLocation(toPlayer)
          .then(toLoc => {
            if (fromLoc.dimension !== toLoc.dimension) return Promise.reject(new Error(`Cannot teleport across dimensions, ${toPlayer} is in the ${toLoc.dimension}`));
          });
      })
      .then(() => {
        tpRequests[toPlayer] = {
          type: 'tpahere',
          player: fromPlayer,
          timestamp: Date.now()
        }
      })
      .then(() => server.util.tellRaw(`tpahere sent to ${toPlayer}, expires in 2 minutes`, fromPlayer, { color: 'gray' }))
      .then(() => server.util.tellRaw(`tpahere received from ${fromPlayer}, use ~tpaccept or ~tpdeny, expires in 2 minutes`, toPlayer, { color: 'gray' }))
      .catch(e => server.util.tellRaw(e.message, event.player, { color: 'red' }));
  });

  server.command('tpdeny', event => {
    const req = tpRequests[event.player];

    Promise.resolve()
      .then(() => (!req || Date.now() - req.timestamp > 120000) ? Promise.reject(new Error('You don\'t have a valid tp request')) : null)
      .then(() => {
        delete tpRequests[event.player];
      })
      .then(() => server.util.tellRaw(`${req.type} to ${event.player} denied`, req.player, { color: 'gray' }))
      .then(() => server.util.tellRaw(`${req.type} from ${req.player} denied`, event.player, { color: 'gray' }))
      .catch(e => server.util.tellRaw(e.message, event.player, { color: 'red' }));
  });

  server.command('tpaccept', event => {
    const req = tpRequests[event.player];
    const t = { player: event.player };
    const f = { player: req.player };

    Promise.resolve()
      .then(() => (!req || Date.now() - req.timestamp > 120000) ? Promise.reject(new Error('You don\'t have a valid tp request')) : null)
      .then(() => server.util.getLocation(t.player))
      .then(loc => t.loc = loc)
      .then(() => server.util.getLocation(f.player))
      .then(loc => f.loc = loc)
      .then(() => {
        if (t.loc.dimension !== f.loc.dimension) return Promise.reject(new Error(`Cannot teleport across dimensions, ${f.player} is in the ${f.loc.dimension}`));
        else {
          if (req.type === 'tpa') {
            t.message = `tpa accepted, teleporting ${f.player} here in 3 seconds...`;
            f.message = `tpa accepted, teleporting to ${t.player} in 3 seconds...`;
            req.command = `tp ${f.player} ${t.player}`;
            lastLocations[f.player] = f.loc;
          } else {
            t.message = `tpahere accepted, teleporting to ${f.player} in 3 seconds...`;
            f.message = `tpahere accepted, teleporting ${t.player} here in 3 seconds...`;
            req.command = `tp ${t.player} ${f.player}`;
            lastLocations[t.player] = t.loc;
          }
        }
      })
      .then(() => server.util.tellRaw(t.message, t.player, { color: 'gray' }))
      .then(() => server.util.tellRaw(f.message, f.player, { color: 'gray' }))
      .then(() => server.util.wait(4000))
      .then(() => server.send(req.command))
      .then(() => server.send(`execute ${req.type === 'tpa' ? f.player : t.player} ~ ~ ~ particle cloud ~ ~1 ~ 1 1 1 0.1 100 force`))
      .then(() => server.send(`playsound entity.item.pickup master ${req.type === 'tpa' ? f.player : t.player} ~ ~ ~ 10 1 1`))
      .catch(e => server.util.tellRaw(e.message, event.player, { color: 'red' }));
  });

  server.command('setwarp', event => {
    let currentLoc;
    let warpName = event.args[0];

    server.util.isOp(event.player)
      .then(result => result ? null : Promise.reject(new Error('You need to be op to create a warp')))
      .then(() => server.util.getLocation(event.player))
      .then(loc => currentLoc = loc)
      .then(() => server.JSON.get('world', 'warps'))
      .then((warps = {}) => {
        warps[currentLoc.dimension] = warps[currentLoc.dimension] || {};
        warps[currentLoc.dimension][warpName] = currentLoc;
        return server.JSON.set('world', 'warps', warps);
      })
      .then(() => server.util.tellRaw(`${warpName} warp set!`, event.player, { color: 'gray' }))
      .catch(e => server.util.tellRaw(e.message, event.player, { color: 'red' }));
  });

  server.command('warp', event => {
    let currentLoc;
    let warpName = event.args[0];

    server.util.getLocation(event.player)
      .then(loc => currentLoc = loc)
      .then(() => server.JSON.get('world', 'warps'))
      .then((warps = {}) => {
        if (!warps.hasOwnProperty(currentLoc.dimension)) return Promise.reject(new Error(`A warp hasn't been set in the ${currentLoc.dimension} yet!`));
        if (!warpName) {
          let warpList = Object.keys(warps[currentLoc.dimension]).join(', ');
          return server.util.tellRaw(`Warps available in the ${currentLoc.dimension}: ` + warpList, event.player, { color: 'gray' });
        } else if (!warps[currentLoc.dimension].hasOwnProperty(warpName))return Promise.reject(new Error(`A warp named ${warpName} doesn't exist in the ${currentLoc.dimension}`));
        else {
          lastLocations[event.player] = currentLoc;
          return server.send(`tp ${event.player} ${warps[currentLoc.dimension][warpName].x} ${warps[currentLoc.dimension][warpName].y} ${warps[currentLoc.dimension][warpName].z}`)
            .then(() => server.send(`execute ${event.player} ~ ~ ~ particle cloud ~ ~1 ~ 1 1 1 0.1 100 force`))
            .then(() => server.send(`playsound entity.item.pickup master ${event.player} ~ ~ ~ 10 1 1`))
        }
      })
      .catch(e => server.util.tellRaw(e.message, event.player, { color: 'red' }));
  });

  // Back

  server.command('back', event => {
    let currentLoc, lastLoc;

    Promise.resolve()
      .then(() => {
        if (!lastLocations.hasOwnProperty(event.player)) return Promise.reject(new Error('No known last location'));
        else {
          lastLoc = lastLocations[event.player];
          return server.util.getLocation(event.player)
        }
      })
      .then(loc => currentLoc = loc)
      .then(() => {
        if (lastLoc.dimension !== currentLoc.dimension) return Promise.reject(new Error(`Last known location in ${lastLoc.dimension}, can't do that.`));
        else {
          lastLocations[event.player] = currentLoc;
          return server.send(`tp ${event.player} ${lastLoc.x} ${lastLoc.y} ${lastLoc.z}`);
        }
      })
      .then(d => server.send(`execute ${event.player} ~ ~ ~ particle cloud ~ ~1 ~ 1 1 1 0.1 100 force`))
      .then(d => server.send(`playsound entity.item.pickup master ${event.player} ~ ~ ~ 10 1 1`))
      .catch(e => server.util.tellRaw(e.message, event.player, { color: 'red' }));
  });

}