var xmpp = require('simple-xmpp');
var restify = require('restify');
var config = require('./config');


var server = restify.createServer();
server.use(restify.bodyParser());
server.use(restify.queryParser());
server.use(restify.jsonp());
server.use(restify.CORS());
server.use(restify.fullResponse());

var activationdelaytimer;


//Initiate bot after it comes online
xmpp.on('online', function(data) {
    //console.log('Connected with JID: ' + data.jid.user);
    console.log('I\'m connected!');

    for (var i = config.xmpp.channels.length - 1; i >= 0; i--) {
        activationdelaytimer = Date.now();
        xmpp.join(config.xmpp.channels[i]);
    };

});

xmpp.on('close', function() {
    return new Error("Disconnected. Throwing an error to force restart.");
});

//Echo chat messages
xmpp.on('chat', function(from, message) {
    xmpp.send(from, 'echo: ' + message);
});

//Process errors
xmpp.on('error', function(err) {
    console.error(err);
});

xmpp.on('subscribe', function(from) {
    if (from === 'a.friend@gmail.com') {
        xmpp.acceptSubscription(from);
    }
});


//Process groupchat messages
xmpp.on('groupchat', function(conference, from, message, stamp) {
    if (activationdelaytimer > Date.now()-5000 ) {
        //ignore old messages in chat log
    } else {
        if (message === '!test') {
            xmpp.send(conference, 'Group chat operational', true);
        }
    }
});

//Connect to server
xmpp.connect({
    jid: config.xmpp.jid,
    password: config.xmpp.password,
    host: config.xmpp.host,
    port: config.xmpp.port
});


function webhookMessage(req, res, next) {
    console.log('got incoming message, sending it to ' + req.params.to);
    //req.params.hash
    var muc = false;
    if(req.params.type === 'group')
    {
        muc = true;
    }

    xmpp.send(req.params.to, req.params.msg, muc);
}

function main(req, res, next) {
    res.send(200, 'Operational');
}

function stats(req, res, next) {
    res.send(403, 'DENIED');
}


//Set up the webhook
server.get('/tachi/', main);
server.get('/tachi/stats', stats);
server.post('/tachi/message', webhookMessage);

server.listen(config.web.port, function() {
    console.log('%s listening at %s', server.name, server.url);
});