"use strict";
require('url');
var xmpp = require('simple-xmpp');
var restify = require('restify');
var stringjs = require('string');
var config = require('./config');


var server = restify.createServer();
server.use(restify.bodyParser());
server.use(restify.queryParser());
server.use(restify.jsonp());
server.use(restify.CORS());
server.use(restify.fullResponse());

var activationdelaytimer;

//save in database to keep alive through restarts
var callbackKeywords = {};


function registerChatCallback(req, res, next) {
    var keyword = req.params.keyword;

    console.log('got incoming callback request for keyword ' + keyword);

    if(keyword.length < 3) {
        res.send(403, 'Keyword must be at least 3 chars');
    }

    if (callbackKeywords[keyword]) {
        res.send(403, 'Already Exists');
    } else {
        callbackKeywords[keyword] = req.params.hookUrl;
        res.send(200, 'Created');
    }
}

function removeChatCallback(req, res, next) {
    var keyword = req.params.keyword;

    console.log('got incoming callback removal request for keyword ' + keyword);

    if (callbackKeywords[keyword]) {
        res.send(403, 'Already Exists');
    } else {
        callbackKeywords[keyword] = null;
        res.send(200, 'Created');
    }
}

function callExternalWebhook(url, keyword, caller, data) {

    var post_data = querystring.stringify({
        'data': data,
        'caller': caller,
        'keyword': keyword
    });

    var u = url.parse(url);
    var options = {
        hostname: u.hostname,
        port: u.port,
        path: u.pathname,
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': post_data.length,
            'Host': 'deny.io'
        }
    };

    var req = http.request(options, function (res) {

    });

    req.on('error', function (e) {
        console.log('problem with performing callback : ' + e.message);
    });


    req.write(post_data);
    req.end();
}

function callbackKeywordEvent(message, sender) {
    //TODO: check if sender is allowed to send commands

    var key;
    for (key in callbackKeywords) {
        if (stringjs(message).startsWith(key)) {
            callExternalWebhook(callbackKeywords[key], key, sender, stringjs(message).right(message.length - key.length).s);
        }
    }
}


//Initiate bot after it comes online
xmpp.on('online', function (data) {
    //console.log('Connected with JID: ' + data.jid.user);
    console.log('I\'m connected!');

    var i;
    for (i = config.xmpp.channels.length - 1; i >= 0; i--) {
        activationdelaytimer = Date.now();
        xmpp.join(config.xmpp.channels[i]);
    };

});

xmpp.on('close', function () {
    return new Error("Disconnected. Throwing an error to force restart.");
});

//Echo chat messages
xmpp.on('chat', function (from, message) {
    xmpp.send(from, 'echo: ' + message);
});

//Process errors
xmpp.on('error', function (err) {
    console.error(err);
});

xmpp.on('subscribe', function (from) {
    if (from === 'a.friend@gmail.com') {
        xmpp.acceptSubscription(from);
    }
});


//Process groupchat messages
xmpp.on('groupchat', function (conference, from, message, stamp) {
    if (activationdelaytimer > Date.now() - 5000) {
        //ignore old messages in chat log
    } else {
        if (message === '!test') {
            xmpp.send(conference, 'Group chat operational', true);
        }
        callbackKeywordEvent(message, sender);
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
    if (req.params.type === 'group') {
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
server.post('/tachi/callback', registerChatCallback);
server.del('/tachi/callback', removeChatCallback);

server.listen(config.web.port, function () {
    console.log('%s listening at %s', server.name, server.url);
});