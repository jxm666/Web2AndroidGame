var nodeCmd = require('node-cmd');
var cmdBash ="adb -s 172.16.188.22 shell input ";
module.exports = function(io, streams) {

  io.on('connection', function(client) {
    console.log('-- ' + client.id + ' joined --');
    client.emit('id', client.id);

    client.on('message', function (details) {
      var otherClient = io.sockets.connected[details.to];

      if (!otherClient) {
        return;
      }
        delete details.to;
        details.from = client.id;
        otherClient.emit('message', details);
    });

    client.on('input', function (details) {
      var inputType = details.type;
      var otherClient = io.sockets.connected[details.to];

      if (!otherClient) {
        return;
      }
      var cmdShell;
      switch(inputType){
        case "tap":
            cmdShell = cmdBash+"tap "+details.input;
          break;
        case "swipe":
            cmdShell = cmdBash+"swipe "+details.input;
          break;
      }

      nodeCmd.run(cmdShell);
      // nodeCmd.run("adb -s 172.16.188.22 shell input tap "+details.input);
        // delete details.to;
        // details.from = client.id;
        // otherClient.emit('input', details);
    });

      
    client.on('readyToStream', function(options) {
      console.log('-- ' + client.id + ' is ready to stream --');
      
      streams.addStream(client.id, options.name); 
    });
    
    client.on('update', function(options) {
      streams.update(client.id, options.name);
    });

    function leave() {
      console.log('-- ' + client.id + ' left --');
      streams.removeStream(client.id);
    }

    client.on('disconnect', leave);
    client.on('leave', leave);
  });
};