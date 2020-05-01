const _ = require('lodash');

module.exports = function () {
  // Setup
  const server = this;
  const lastLocations = {};
  const tpRequests = {};
  const votes = {
    day: 0,
    night: 0,
    weather: 0,
  };
  const voted = {
    day: {},
    night: {},
    weather: {},
  };

  server
    .use(require('scriptserver-event'))
    .use(require('scriptserver-command'))
    .use(require('scriptserver-json'))
    .use(require('scriptserver-util'));

  const config = server.config.essentials = _.defaultsDeep({}, server.config.essentials, {
    motd: {
      enabled: true,
      first: 'Welcome to the server, ${player}!',
      text: 'Welcome back ${player}!',
    },
    starterKit: {
      enabled: true,
      items: [
        'iron_pickaxe',
        'iron_shovel',
        'iron_axe',
        'iron_sword',
        'red_bed',
        'bread 32',
      ],
    },
    home: {
      enabled: true,
      amount: 3,
    },
    spawn: true,
    warp: {
      enabled: true,
      opOnly: true,
    },
    tpa: true,
    back: true,
    day: {
      enabled: true,
      percent: 50,
    },
    night: {
      enabled: true,
      percent: 50,
    },
    weather: {
      enabled: true,
      percent: 50,
    },
  });

  // Starter Kit & MOTD
  server.on('login', async (event) => {
    try {
      const hasJoined = await server.JSON.get(event.player, 'joined');

      if (hasJoined) {
        if (config.motd.enabled) await server.util.tellRaw(_.template(config.motd.text)(event), event.player, { color: 'yellow' });
      } else {
        await server.JSON.set(event.player, 'joined', Date.now());

        if (config.starterKit.enabled) await Promise.all(config.starterKit.items.map(i => server.send(`give ${event.player} minecraft:${i}`)));
        if (config.motd.enabled) await server.util.tellRaw(_.template(config.motd.first)(event), event.player, { color: 'yellow' });
      }
    } catch (e) { handler(e, event.player); }
  });

  // Home
  server.command('sethome', async (event) => {
    try {
      if (!config.home.enabled) throw new PlayerError('Homes are not enabled on this server');
      const home = config.home.amount > 1 ? event.args[0] || 'default' : 'default';
      const location = await server.util.getLocation(event.player);
      let homes = await server.JSON.get(event.player, 'home');
      homes = homes || {};

      if (homes.hasOwnProperty(home)) {
        homes[home] = location;
      } else {
        if (Object.keys(homes).length >= config.home.amount) { // eslint-disable-line
          throw new PlayerError('Home limit reached, try deleting another home first');
        } else {
          homes[home] = location;
        }
      }

      await server.JSON.set(event.player, 'home', homes);
      await server.util.tellRaw(`Home${home === 'default' ? '' : ' ' + home} set`, event.player, { color: 'gray' });
    } catch (e) { handler(e, event.player); }
  });

  server.command('delhome', async (event) => {
    try {
      if (!config.home.enabled) throw new PlayerError('Homes are not enabled on this server');
      const home = config.home.amount > 1 ? event.args[0] || 'default' : 'default';
      const homes = await server.JSON.get(event.player, 'home');

      if (!homes) throw new PlayerError('You haven\'t set a home yet');
      if (!homes.hasOwnProperty(home)) throw new PlayerError(`You haven't set a home ${home}`);

      delete homes[home];

      await server.JSON.set(event.player, 'home', homes);
      await server.util.tellRaw(`Home${home === 'default' ? '' : ' ' + home} removed`, event.player, { color: 'gray' });
    } catch (e) { handler(e, event.player); }
  });

  server.command('home', async (event) => {
    try {
      if (!config.home.enabled) throw new PlayerError('Homes are not enabled on this server');
      const home = config.home.amount > 1 ? event.args[0] || 'default' : 'default';
      const location = await server.util.getLocation(event.player);
      const homes = await server.JSON.get(event.player, 'home');

      if (!homes) throw new PlayerError('You haven\'t set a home yet');
      if (!homes.hasOwnProperty(home)) throw new PlayerError(`You haven't set a home ${home}`);

      lastLocations[event.player] = location;
      await server.util.teleport(event.player, homes[home]);
    } catch (e) { handler(e, event.player); }
  });

  // Spawn
  server.command('setspawn', async (event) => {
    try {
      if (!config.spawn) throw new PlayerError('Spawn is not enabled on this server');
      if (!await server.util.isOp(event.player)) throw new PlayerError('You need to be OP to set the spawn');
      const location = await server.util.getLocation(event.player);
      const spawns = await server.JSON.get('world', 'spawn') || {};

      spawns[location.dimension] = location;

      await server.JSON.set('world', 'spawn', spawns);
      await server.util.tellRaw(`${location.dimension} spawn set`, event.player, { color: 'gray' });
    } catch (e) { handler(e, event.player); }
  });

  server.command('spawn', async (event) => {
    try {
      if (!config.spawn) throw new PlayerError('Spawn is not enabled on this server');
      const location = await server.util.getLocation(event.player);
      const spawns = await server.JSON.get('world', 'spawn') || {};

      if (!spawns.hasOwnProperty(location.dimension)) throw new PlayerError(`Spawn has not been set in the ${location.dimension} yet`);

      lastLocations[event.player] = location;
      await server.util.teleport(event.player, spawns[location.dimension]);
    } catch (e) { handler(e, event.player); }
  });

  // Warp
  server.command('setwarp', async (event) => {
    try {
      if (!config.warp.enabled) throw new PlayerError('Warps are not enabled on this server');
      if (config.warp.opOnly && !await server.util.isOp(event.player)) throw new PlayerError('You need to be OP to set a warp');
      if (!event.args[0]) throw new PlayerError('Please provide a name for the warp');
      const warp = event.args[0];
      const location = await server.util.getLocation(event.player);
      const warps = await server.JSON.get('world', 'warp') || {};

      warps[warp] = location;

      await server.JSON.set('world', 'warp', warps);
      await server.util.tellRaw(`Warp ${warp} set`, event.player, { color: 'gray' });
    } catch (e) { handler(e, event.player); }
  });

  server.command('delwarp', async (event) => {
    try {
      if (!config.warp.enabled) throw new PlayerError('Warps are not enabled on this server');
      if (config.warp.opOnly && !await server.util.isOp(event.player)) throw new PlayerError('You need to be OP to remove a warp');
      if (!event.args[0]) throw new PlayerError('Please provide the name of the warp to delete');
      const warp = event.args[0];

      const warps = await server.JSON.get('world', 'warp');

      if (!warps) throw new PlayerError('You haven\'t set a warp yet');
      if (!warps.hasOwnProperty(warp)) throw new PlayerError(`You haven't set a warp ${warp}`);

      delete warps[warp];

      await server.JSON.set('world', 'warp', warps);
      await server.util.tellRaw(`Warp ${warp} removed`, event.player, { color: 'gray' });
    } catch (e) { handler(e, event.player); }
  });

  server.command('warp', async (event) => {
    try {
      if (!config.warp.enabled) throw new PlayerError('Warps are not enabled on this server');
      const location = await server.util.getLocation(event.player);
      const warps = await server.JSON.get('world', 'warp');

      if (!warps) throw new PlayerError('No warps have been created yet');
      if (!event.args[0]) {
        const warpList = Object.keys(warps).join(', ');

        await server.util.tellRaw('Warps available: ' + warpList, event.player, { color: 'gray' });
      } else {
        const warp = event.args[0];
        if (!warps.hasOwnProperty(warp)) throw new PlayerError(`The warp ${warp} does not exist`);

        lastLocations[event.player] = location;
        await server.util.teleport(event.player, warps[warp]);
      }
    } catch (e) { handler(e, event.player); }
  });

  // TPA
  server.command('tpa', async (event) => {
    try {
      if (!config.tpa) throw new PlayerError('Teleport requests are not enabled on this server');
      const fromPlayer = event.player;
      const toPlayer = event.args[0];
      if (!toPlayer) throw new PlayerError('Please specify a player to send the request to');
      if (!await server.util.isOnline(toPlayer)) throw new PlayerError(`${toPlayer} is not online`);

      tpRequests[toPlayer.toLowerCase()] = {
        type: 'tpa',
        player: fromPlayer,
        timestamp: Date.now(),
      };

      await server.util.tellRaw(`tpa sent to ${toPlayer}, expires in 2 minutes`, fromPlayer, { color: 'gray' });
      await server.util.tellRaw(`tpa received from ${fromPlayer}, use ~tpaccept or ~tpdeny, expires in 2 minutes`, toPlayer, { color: 'gray' });
    } catch (e) { handler(e, event.player); }
  });

  server.command('tpahere', async (event) => {
    try {
      if (!config.tpa) throw new PlayerError('Teleport requests are not enabled on this server');
      const fromPlayer = event.player;
      const toPlayer = event.args[0];
      if (!toPlayer) throw new PlayerError('Please specify a player to send the request to');
      if (!await server.util.isOnline(toPlayer)) throw new PlayerError(`${toPlayer} is not online`);

      tpRequests[toPlayer.toLowerCase()] = {
        type: 'tpahere',
        player: fromPlayer,
        timestamp: Date.now(),
      };

      await server.util.tellRaw(`tpahere sent to ${toPlayer}, expires in 2 minutes`, fromPlayer, { color: 'gray' });
      await server.util.tellRaw(`tpahere received from ${fromPlayer}, use ~tpaccept or ~tpdeny, expires in 2 minutes`, toPlayer, { color: 'gray' });
    } catch (e) { handler(e, event.player); }
  });

  server.command('tpdeny', async (event) => {
    try {
      if (!config.tpa) throw new PlayerError('Teleport requests are not enabled on this server');
      const req = tpRequests[event.player.toLowerCase()];
      if (!req || Date.now() - req.timestamp > 120000) throw new PlayerError('No valid tp requests');
      delete tpRequests[event.player.toLowerCase()];

      await server.util.tellRaw(`${req.type} to ${event.player} denied`, req.player, { color: 'gray' });
      await server.util.tellRaw(`${req.type} from ${req.player} denied`, event.player, { color: 'gray' });
    } catch (e) { handler(e, event.player); }
  });

  server.command('tpaccept', async (event) => {
    try {
      if (!config.tpa) throw new PlayerError('Teleport requests are not enabled on this server');
      const req = tpRequests[event.player.toLowerCase()];
      if (!req || Date.now() - req.timestamp > 120000) throw new PlayerError('No valid tp requests');
      const to = {
        player: event.player,
        location: await server.util.getLocation(event.player),
      };
      const from = {
        player: req.player,
        location: await server.util.getLocation(req.player),
      };

      if (req.type === 'tpa') {
        await server.util.tellRaw(`tpa accepted, teleporting ${from.player} here in 3 seconds...`, to.player, { color: 'gray' });
        await server.util.tellRaw(`tpa accepted, teleporting to ${to.player} in 3 seconds...`, from.player, { color: 'gray' });
        req.command = `tp ${from.player} ${to.player}`;
        lastLocations[from.player] = from.locaction;
      } else {
        await server.util.tellRaw(`tpa accepted, teleporting to ${from.player} in 3 seconds...`, to.player, { color: 'gray' });
        await server.util.tellRaw(`tpa accepted, teleporting ${to.player} here in 3 seconds...`, from.player, { color: 'gray' });
        req.command = `tp ${to.player} ${from.player}`;
        lastLocations[to.player] = to.location;
      }

      delete tpRequests[event.player.toLowerCase()];

      await server.util.wait(4000);
      await server.send(req.command);
      await server.send(`execute at ${req.type === 'tpa' ? from.player : to.player} run particle cloud ~ ~1 ~ 1 1 1 0.1 100 force`);
      await server.send('playsound entity.item.pickup master @a ~ ~ ~ 10 1 1');
    } catch (e) { handler(e, event.player); }
  });

  // Back
  server.command('back', async (event) => {
    try {
      if (!config.back) throw new PlayerError('Back is not enabled on this server');
      if (!lastLocations.hasOwnProperty(event.player)) throw new PlayerError('No known last location');
      const location = await server.util.getLocation(event.player);
      const lastLoc = lastLocations[event.player];

      lastLocations[event.player] = location;

      await server.util.teleport(event.player, lastLoc);
    } catch (e) { handler(e, event.player); }
  });

  // Votes
  server.command('day', async (event) => {
    try {
      if (!config.day.enabled) throw new PlayerError('Day votes are not enabled on this server');
      const online = await server.util.getOnline();

      if (!voted.day.hasOwnProperty(event.player)) {
        voted.day[event.player] = true;
        votes.day += 1;
      }
      if (votes.day >= (online.online * (config.day.percent / 100))) {
        votes.day = 0;
        voted.day = {};
        await server.send('time set 1000');
        await server.util.tellRaw(`Voters exceed or equal ${config.day.percent}% of players, setting time to day`, '@a', { color: 'gray' });
      } else if (votes.day === 1) {
        await server.util.tellRaw('Day vote started, use ~day to vote!', '@a', { color: 'gray' });
      }
    } catch (e) { handler(e, event.player); }
  });

  server.command('night', async (event) => {
    try {
      if (!config.night.enabled) throw new PlayerError('Night votes are not enabled on this server');
      const online = await server.util.getOnline();

      if (!voted.night.hasOwnProperty(event.player)) {
        voted.night[event.player] = true;
        votes.night += 1;
      }

      if (votes.night >= (online.online * (config.night.percent / 100))) {
        votes.night = 0;
        voted.night = {};
        await server.send('time set 14000');
        await server.util.tellRaw(`Voters exceed or equal ${config.night.percent}% of players, setting time to night`, '@a', { color: 'gray' });
      } else if (votes.night === 1) {
        await server.util.tellRaw('Night vote started, use ~night to vote!', '@a', { color: 'gray' });
      }
    } catch (e) { handler(e, event.player); }
  });

  server.command('weather', async (event) => {
    try {
      if (!config.weather.enabled) throw new PlayerError('Weather votes are not enabled on this server');
      const online = await server.util.getOnline();

      if (!voted.weather.hasOwnProperty(event.player)) {
        voted.weather[event.player] = true;
        votes.weather += 1;
      }

      if (votes.weather >= (online.online * (config.weather.percent / 100))) {
        votes.weather = 0;
        voted.weather = {};
        await server.send('weather clear');
        await server.util.tellRaw(`Voters exceed or equal ${config.weather.percent}% of players, clearing weather`, '@a', { color: 'gray' });
      } else if (votes.weather === 1) {
        await server.util.tellRaw('Weather vote started, use ~weather to vote!', '@a', { color: 'gray' });
      }
    } catch (e) { handler(e, event.player); }
  });

  function handler(e, player) {
    if (e.playerError) {
      server.util.tellRaw(e.message, player, { color: 'red' });
    } else {
      server.util.tellRaw('Something went wrong, please let the server admin know of the following error:', player, { color: 'red' })
        .then(() => server.util.tellRaw(e.message, player, { color: 'gray' }));
    }
  }

  class PlayerError extends Error {
    constructor(...args) {
      super(...args);
      this.playerError = true;
    }
  }
};
