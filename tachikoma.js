var xmpp = require('simple-xmpp');
var config = require('./config');

var activationdelaytimer;

xmpp.on('online', function(data) {
    //console.log('Connected with JID: ' + data.jid.user);
    console.log('I\'m connected!');

    for (var i = config.xmpp.channels.length - 1; i >= 0; i--) {
        activationdelaytimer = Date.now()    
        xmpp.join(config.xmpp.channels[i]);
    };

});

xmpp.on('chat', function(from, message) {
    xmpp.send(from, 'echo: ' + message);
});

xmpp.on('error', function(err) {
    console.error(err);
});

xmpp.on('subscribe', function(from) {
    if (from === 'a.friend@gmail.com') {
        xmpp.acceptSubscription(from);
    }
});

xmpp.on('groupchat', function(conference, from, message, stamp) {
    if (activationdelaytimer > Date.now()-5000 ) {
        //ignore old messages in chat log
    } else {
        if (message === '!test') {
            xmpp.send(conference, 'Group chat operational', true);
        }
    }
    //console.log('%s says %s on %s on %s at %s', from, message, conference, stamp.substr(0,9), stamp.substr(10));
});

xmpp.connect({
    jid: config.xmpp.jid,
    password: config.xmpp.password,
    host: config.xmpp.host,
    port: config.xmpp.port
});

//xmpp.subscribe('your.friend@gmail.com');
// check for incoming subscription requests
//xmpp.getRoster();