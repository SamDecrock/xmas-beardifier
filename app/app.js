var express 	= require('express');
var Step 		= require('step');
var socketio	= require('socket.io');
var async		= require('async');
var settings    = require('./settings');
var people      = require('./people');


var peopleSlug = [];
preparePeopleList();


/**
 * Webserver stuff:
 */
 var webserver = module.exports = express.createServer();
 webserver.configure(function(){
	webserver.set('views', __dirname + '/views');
	webserver.set('view engine', 'jade');
	webserver.use(express.bodyParser());
	webserver.use(express.methodOverride());
	webserver.use(require('stylus').middleware({ src: __dirname + '/public' }));
	var oneYear = 31536000000; //1 year in ms
	webserver.use(express.static(__dirname + '/public', { maxAge : oneYear}));
	webserver.use(express.cookieParser());
	webserver.use(express.session({cookie: { path: '/', httpOnly: false, maxAge: null }, secret:'imindsmoustache'}));
	webserver.use(webserver.router);
});
webserver.configure('development', function(){
	webserver.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});
webserver.configure('production', function(){
	webserver.use(express.errorHandler());
});
if (!module.parent) {
	webserver.listen(3000);
}




/**
 * Socket.IO
 */
var io = socketio.listen(webserver);
io.set('log level', 0);


io.sockets.on('connection', function (socket) {

	// Rooms are:
	// * 'camera'
	// * 'controller'
	// * 'wall'
	socket.on('room', function(room) {
		console.log("Adding client to room: " + room);
        socket.join(room);
    });


	socket.on('camera.originalpicture', function (data) {
		// save it
		Step(
			function () {
				var picname = "pic_" + data.id + ".png";
				var buffer = new Buffer(data.picture.replace(/^data:image\/png;base64,/,""), 'base64');
				require("fs").writeFile(__dirname + "/public/data/original/" + picname, buffer, this);
			},

			function (err) {
				if(err) throw err;

				io.sockets.in('controller').emit('controller.originalpicture', data);
			}
		);
	});

	socket.on('camera.newpicture', function (data) {
		//doorgeven aan de wall:
		io.sockets.in('wall').emit('wall.newpicture', data);

		// send scaled picture to controller:
		io.sockets.in('controller').emit('controller.newpicture', {
			picture: data.scaledpicture,
			id: data.id
		});

		// save it, just for fun
		Step(
			function () {
				var picname = "pic_" + data.id + ".png";
				var buffer = new Buffer(data.picture.replace(/^data:image\/png;base64,/,""), 'base64');
				require("fs").writeFile(__dirname + "/public/data/beardify/" + picname, buffer, this);
			},

			function (err) {
				if(err) throw err;
			}
		);
	});

	socket.on('controller.publishtowall', function (data) {
		io.sockets.in('camera').emit('camera.clearcamera', {});
		io.sockets.in('wall').emit('wall.publish', data);
	});

});


/**
 * Webserver routes
 */
webserver.get('/', function(req, res){
	res.render('camera', {
		title: "Happy Hour Beardifier",
		layout: null
	});
});

//duplicate:
webserver.get('/camera', function(req, res){
	res.render('camera', {
		title: "Happy Hour Beardifier",
		layout: null
	});
});


webserver.get('/controller', function (req, res){
	res.render('controller', {
		title: "Happy Hour Beardifier Controller",
		layout: null,
		people: people.people,
		peopleSlug: peopleSlug
	});
});

webserver.get('/wall', function (req, res){
	res.render('wall', {
		title: "The Daily Santa",
		layout: null
	});
});


function preparePeopleList(){
	for(var i in people.people){
		var personName = people.people[i];
		peopleSlug.push(stripVowelAccent(personName.toLowerCase().replace(/\s/g, '_')));
	}
}

function stripVowelAccent(str)
{
	var s=str;

	var rExps=[ /[\xC0-\xC2]/g, /[\xE0-\xE2]/g,
	/[\xC8-\xCA]/g, /[\xE8-\xEB]/g,
	/[\xCC-\xCE]/g, /[\xEC-\xEE]/g,
	/[\xD2-\xD4]/g, /[\xF2-\xF4]/g,
	/[\xD9-\xDB]/g, /[\xF9-\xFB]/g ];

	var repChar=['A','a','E','e','I','i','O','o','U','u'];

	for(var i=0; i<rExps.length; i++)
		s=s.replace(rExps[i],repChar[i]);

	return s;
}







