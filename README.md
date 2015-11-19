scriptserver-basics
===================

FYI: This package is an addon for ScriptServer and requires ScriptServer to be set up, please see [here](https://github.com/garrettjoecox/scriptserver) for more information.

## Installation
While in root directory of your server run:
```
npm install scriptserver-basics
```
And in your `server` file:
```javascript
server.use('scriptserver-basics');
```

## Usage
This module provides the following commands to be used in the ingame chat:

- `~head [username]`
  Gives command sender's or [username]'s playerhead to command sender.

- `~tpa <username>`
  Sends [username] a teleport request.

- `~tpahere <username>`
  Sends [username] a request to teleport here.

- `~tpaccept`
  Accept your current teleport request.

- `~tpdeny`
  Deny your current teleport request.

- `~sethome`
  Set your home at the current position.

- `~home`
  Teleport to your saved home position.

- `~spawn`
  Teleport to world spawn.

## This ScriptServer module uses:
  - [scriptserver-command](https://github.com/garrettjoecox/scriptserver-command)
  - [scriptserver-helpers](https://github.com/garrettjoecox/scriptserver-helpers)
  - [scriptserver-json](https://github.com/garrettjoecox/scriptserver-json)
