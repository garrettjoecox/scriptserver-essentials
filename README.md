scriptserver-essentials
===================

[![](http://i.imgur.com/zhptNme.png)](https://github.com/garrettjoecox/scriptserver)

FYI: This package is an addon for ScriptServer and requires ScriptServer to be set up, please see [here](https://github.com/garrettjoecox/scriptserver) for more information.

## Installation
While in root directory of your server run:
```
npm install scriptserver-essentials
```
And in your `server` file:
```javascript
server.use(require('scriptserver-essentials'));
```

## Configuration
Each feature is configuration driven, pass in a configuration object as the third argument of your Scriptserver before requiring `scriptserver-esssentials`

The following is the default configuration:
```javascript
const server = new ScriptServer({
  essentials: {
    motd: {
      enabled: true,
      first: 'Welcome to the server, ${player}!',
      text: 'Welcome back ${player}!'
    },
    starterKit: {
      enabled: true,
      items: [
        'iron_pickaxe',
        'iron_shovel',
        'iron_axe',
        'iron_sword',
        'bed',
        'bread 32',
      ]
    },
    home: {
      enabled: true,
      amount: 3
    },
    spawn: true,
    warp: {
      enabled: true,
      opOnly: true
    },
    tpa: true,
    back: true,
    day: {
      enabled: true,
      percent: 50
    },
    night: {
      enabled: true,
      percent: 50
    },
    weather: {
      enabled: true,
      percent: 50
    }
  }
});
```

## Usage
This module provides the following commands to be used in the ingame chat:

- `~sethome [name]`
  Set a home (optionally with a name, if multiple homes are enabled) in your current dimension

- `~delhome [name]`
  Remove a home (optionally with a name, if multiple homes are enabled) in your current dimension (Useful for limited amount of homes)

- `~home [name]`
  Teleport to a home (optionally with a name, if multiple homes are enabled) in your current dimension

- `~setspawn`
  Set the spawn in your current dimension (requires OP)

- `~spawn`
  Teleport to spawn in your current dimension

- `~setwarp <name>`
  Set a warp point specified by `name` in current dimension (Optionally requires OP)

- `~delwarp <name>`
  Remove the specified warp in current dimension (Optionally requires OP)

- `~tpa <username>`
  Sends a teleport request to the specified user

- `~tpahere <username>`
  Sends a teleport here request to the specifed user

- `~tpaccept`
  Accept your current teleport request.

- `~tpdeny`
  Deny your current teleport request.

- `~back`
  Teleport back to a previous location (Remembers location from `spawn`, `tpa`, `warp`, and `home`)

- `~day`
  Start a vote for setting the time to day.

- `~night`
  Start a vote for setting the time to night.

- `~weather`
  Start a vote for toggling downfall.

## This ScriptServer module uses:
  - [scriptserver-command](https://github.com/garrettjoecox/scriptserver-command)
  - [scriptserver-util](https://github.com/garrettjoecox/scriptserver-util)
  - [scriptserver-event](https://github.com/garrettjoecox/scriptserver-event)
  - [scriptserver-json](https://github.com/garrettjoecox/scriptserver-json)
