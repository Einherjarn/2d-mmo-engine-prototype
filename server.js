const server = require("express")();
const http = require("http").createServer(server);
const io = require("socket.io")(http);

let players = [];
let newplayerid = 0;

// All game content
const gamecontentAll = {
	item: {
	  egg: [ 
		{ x: 240, y: 625 },
		{ x: 1056, y: 624 },
		{ x: 1056, y: 336 },
		{ x: 1056, y: 48 },
		{ x: 240, y: 48 },
		{ x: 240, y: 336 },
		{ x: 48, y: 1296 },
		{ x: 336, y: 1824 },
	  ],
	  apple: [
		{ x: 240, y: 625 },
		{ x: 1056, y: 624 },
		{ x: 1056, y: 336 },
		{ x: 1056, y: 48 },
		{ x: 240, y: 48 },
		{ x: 240, y: 336 },
		{ x: 48, y: 1296 },
		{ x: 336, y: 1824 },
		{ x: 816, y: 1536 },
		{ x: 48 , y: 2448 },
		{ x: 48 , y: 2736 },
		{ x: 96 , y: 4416 },
		{ x: 96 , y: 4704 },
		{ x: 1824 , y: 4656 },
		{ x: 2880 , y: 4656 },
		{ x: 1920 , y: 3552 },
		{ x: 1968 , y: 3168 },
		{ x: 2784 , y: 3216 },
		{ x: 3120 , y: 3264 },
		{ x: 3456 , y: 2976 },
		{ x: 3840 , y: 2976 },
		{ x: 4560 , y: 3168 },
		{ x: 4416 , y: 4320 },
		{ x: 3984 , y: 4560 },
		{ x: 2256 , y: 2544 },
		{ x: 1920 , y: 2064 },
		{ x: 1921 , y: 1585 },
		{ x: 2736 , y: 1584 },
		{ x: 3600 , y: 1728 },
		{ x: 3504 , y: 1344 },
		{ x: 4080 , y: 1776 },
		{ x: 4032 , y: 2112 },
		{ x: 4176 , y: 1440 },
		{ x: 4656 , y: 1536 },
		{ x: 4752 , y: 912 },
		{ x: 4416 , y: 672 },
		{ x: 4272 , y: 144 },
		{ x: 4128 , y: 144 },
		{ x: 2648 , y: 144 },
		{ x: 2352 , y: 624 },
		{ x: 2352 , y: 960 },
		{ x: 2352 , y: 1056 },
		{ x: 2352 , y: 1152 },
		{ x: 2880 , y: 48 },
		{ x: 1824 , y: 48 }
	  ],
	  // ...
	},
	// ...
  };
// Current gamecontent
const gamecontent = {
  item: {
    egg: [
    ],
    apple: [
	  { x: 240, y: 625 },
	  { x: 1056, y: 624 },
	  { x: 1056, y: 336 },
	  { x: 1056, y: 48 },
	  { x: 240, y: 48 },
	  { x: 240, y: 336 },
	  { x: 48, y: 1296 },
	  { x: 336, y: 1824 },
	  { x: 816, y: 1536 },
	  { x: 48 , y: 2448 },
	  { x: 48 , y: 2736 },
	  { x: 96 , y: 4416 },
	  { x: 96 , y: 4704 },
	  { x: 1824 , y: 4656 },
	  { x: 2880 , y: 4656 },
	  { x: 1920 , y: 3552 },
	  { x: 1968 , y: 3168 },
	  { x: 2784 , y: 3216 },
	  { x: 3120 , y: 3264 },
	  { x: 3456 , y: 2976 },
	  { x: 3840 , y: 2976 },
	  { x: 4560 , y: 3168 },
	  { x: 4416 , y: 4320 },
	  { x: 3984 , y: 4560 },
	  { x: 2256 , y: 2544 },
	  { x: 1920 , y: 2064 },
	  { x: 1921 , y: 1585 },
	  { x: 2736 , y: 1584 },
	  { x: 3600 , y: 1728 },
	  { x: 3504 , y: 1344 },
	  { x: 4080 , y: 1776 },
	  { x: 4032 , y: 2112 },
	  { x: 4176 , y: 1440 },
	  { x: 4656 , y: 1536 },
	  { x: 4752 , y: 912 },
	  { x: 4416 , y: 672 },
	  { x: 4272 , y: 144 },
	  { x: 4128 , y: 144 },
	  { x: 2648 , y: 144 },
	  { x: 2352 , y: 624 },
	  { x: 2352 , y: 960 },
	  { x: 2352 , y: 1056 },
	  { x: 2352 , y: 1152 },
	  { x: 2880 , y: 48 },
	  { x: 1824 , y: 48 }
	],
	// ...
  },
  // ...
};

const gamecontentRemove = {
	item: {
	  egg: [],
	  apple: [],
	},
  };

const gamecontentCreate = {
	item: {
	  egg: [],
	  apple: [],
	},
  };

const gcoperation = {
	REMOVE: "REMOVE",
	KEEP: "KEEP",
	//...
}

// Change these when testing new maps with various sizes
let mapSizeY = 4800;
let mapSizeX = 4800;
let playerStartY = 2400;
let playerStartX = 2400;

// check if the content exists
function checkContent(concern, thing, position, action = gcoperation.KEEP) {
  if (gamecontent[concern][thing]) {
    // find position
    let ind = gamecontent[concern][thing].findIndex(
      (pos) => pos.x == position.x && pos.y == position.y
    );
    if (ind > -1) {
      if (action == gcoperation.REMOVE) {
        gamecontent[concern][thing].splice(ind, 1);
	  }
	  // console.log("content found. operation:", action)
      return true;
    }
  }
  console.log("no content found");
  return false;
}

// how often serverticks are processed
// can be lowered for higher responsiveness, will cost server resources
const tickrate = 100;

io.on("connection", function (socket) {
    console.log("A user connected: "+ socket.id);
	// serverside representation of a player
	let player = {
		"socketid": socket.id,
		"id": newplayerid,
		"map": "cloud_city",
		"posx": playerStartX,
		"posy": playerStartY,
		"anim": "walk_down",
		"inventory": {eggs: 0, apples: 0}
	}
	// add into players
	players.push(player);
	
	socket.emit("login", player, gamecontent);
	newplayerid++;
	// on requested movement packet
	socket.on("move", function(packet) {
		// console.log("move, " +player.id+", " +packet.posx+", " +packet.posy);
		// Accepted. TODO: use player.map dimensions
		if ((packet.posx>=0 && packet.posy>=0) && (packet.posx<=mapSizeX && packet.posy<=mapSizeY)){
			player.posx = packet.posx;
			player.posy = packet.posy;
			player.anim = packet.anim;
			// Send reply of accepted new position
			//console.log("The new position was accepted: ", player.posx, ", ", player.posy)
			let newpos = {"posx": player.posx, "posy": player.posy};
			//let newpos = {"posx": 0, "posy": 0};
			socket.emit("move", newpos);
		}
		// Rejected
		else{
			// Send old position. Client must be synchronized. 
			console.log("The new position was not accepted. Send:", player.posx, ", ", player.posy)
			let oldpos = {"posx": player.posx, "posy": player.posy};
			socket.emit("move", oldpos);
		}

	});

	socket.on("pick", function(packet) {
		// console.log(packet.length);
		// 1. find items from gamecontent object if possible 2. remove items 3. change inventory quantities
		for(let i=0; i<packet.length; i++){
			if(packet[i].egg){
				if(checkContent("item", "egg", packet[i].egg, gcoperation.REMOVE)){
					player.inventory.eggs++; // content existed
					gamecontentRemove.item.egg.push(packet[i].egg);
				}
			}
			else if(packet[i].apple){
				if(checkContent("item", "apple", packet[i].apple, gcoperation.REMOVE)){
					player.inventory.apples++; // content existed
					gamecontentRemove.item.apple.push(packet[i].apple);
				}
			}
		}
		// send up-to-date inventory
		console.log("player's up-to-date inventory: ", player.inventory)
		socket.emit("pick", {"inventory": player.inventory});
	});
	
	// on disconnect
    socket.on("disconnect", function () {
        console.log("A user disconnected: " + socket.id);
		// remove player from players
		players = players.filter(player => player.socketid !== socket.id);
    });
	
	// on chat message received
	socket.on("message", function (packet) {
		console.log("message: " + packet);
		let msgpacket = { "msg": packet, "id": socket.id }
		io.emit("message", msgpacket);
	});
});

http.listen(8081, function () {
    console.log("Server started, listening on " + http.address().port);
});

// serverticks, run every x time, generic broadcasts go here, TODO: proper deltatime?
var loop = setInterval(function() {
	//console.log("servertick");
	let posupdate = [];
	// for every player, build a posupdate
	for(let i = 0; i < players.length; i++) {
		try {
			let newplayer = { "id": players[i].id, "posx": players[i].posx, "posy": players[i].posy, "map": players[i].map, "anim": players[i].anim };
			posupdate.push(newplayer);
		} catch(e) {
			console.log("undef error create posupdates");
		}
	}
	// and send the posupdates
	for(let i = 0; i < players.length; i++) {
		try {
			io.to(players[i].socketid).emit("posupdates", posupdate);
		} catch(e) {
			console.log("undef error send posupdates");
		}
	}	

	// gamecontent updates
	if (gamecontentRemove.item.egg.length>0 || gamecontentRemove.item.apple.length>0 ){
		// create new gamecontent. TODO: optimize values
		if ((gamecontent.item.egg.length + gamecontent.item.apple.length)<42) {
			console.log("Add new content!")
			for (let i=0; 20>i; i++) {
				gamecontentCreate.item.egg.push(gamecontentAll.item.egg[Math.floor(Math.random() * gamecontentAll.item.egg.length)])
				gamecontentCreate.item.apple.push(gamecontentAll.item.apple[Math.floor(Math.random() * gamecontentAll.item.apple.length)])
			}
		}
		// update server gamecontent before sending
		for(let i=0; gamecontentCreate.item.egg.length>i; i++){
			gamecontent.item.egg.push(gamecontentCreate.item.egg[i]);
		}
		for(let i=0; gamecontentCreate.item.apple.length>i; i++){
			gamecontent.item.apple.push(gamecontentCreate.item.apple[i]);
		}
		// send game content updates
		io.emit("modifycontent", gamecontentRemove, gamecontentCreate);
		// clear 
		gamecontentCreate.item.egg.splice(0, gamecontentCreate.item.egg.length);
		gamecontentCreate.item.apple.splice(0, gamecontentCreate.item.apple.length);
		gamecontentRemove.item.egg.splice(0, gamecontentRemove.item.egg.length);
		gamecontentRemove.item.apple.splice(0, gamecontentRemove.item.apple.length); 
	}

}, tickrate)
