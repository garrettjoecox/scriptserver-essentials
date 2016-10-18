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

## Usage
This module provides the following commands to be used in the ingame chat:

- `~tpa <username>`
  Sends [username] a teleport request.

- `~tpahere <username>`
  Sends [username] a request to teleport here.

- `~tpaccept`
  Accept your current teleport request.

- `~tpdeny`
  Deny your current teleport request.

- `~sethome`
  Set your home at the current position for the current dimension, allowed one home per dimension.

- `~home`
  Teleport to your saved home position in current dimension.

- `~setspawn`
  Set current dimension's spawn. Allowed a spawn per dimension. (OP only)

- `~spawn`
  Teleport to current dimension's spawn.

- `~setwarp <warpname>`
  Set a warp point in current dimension.
  
- `~warp <warpname>`
  Warp to a warp point in current dimension.

## This ScriptServer module uses:
  - [scriptserver-command](https://github.com/garrettjoecox/scriptserver-command)
  - [scriptserver-util](https://github.com/garrettjoecox/scriptserver-util)
  - [scriptserver-event](https://github.com/garrettjoecox/scriptserver-event)
  - [scriptserver-json](https://github.com/garrettjoecox/scriptserver-json)
