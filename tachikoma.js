var xmpp = require('simple-xmpp');
var manual = require('node-xmpp');
var config = require('./config');

xmpp.on('online', function(data) {
    //console.log('Connected with JID: ' + data.jid.user);
    console.log('Yes, I\'m connected!');
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
    if (message === '!test') {
        xmpp.send(conference, 'AI satellite is operational.', true);
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

//xmpp.join(config.xmpp.channel);
var stanza = new manual.Element('presence', 
    { 
        "to": to
    }).c('x', 
    {
        xmlns: 'http://jabber.org/protocol/muc'
    }).c('history', 
    {
        maxstanzas: 0,
        seconds: 1
    });
manual.conn.send(stanza);

xmpp.send(config.xmpp.channel, 'AI satellite is operational.', true);