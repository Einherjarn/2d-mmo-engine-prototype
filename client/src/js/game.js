import io from "socket.io-client";
import Phaser from "phaser";
import Player from "./player";
import { MAP_SCALE, SCALED_TILE_SIZE, SPRITE_HEIGHT, SPRITE_SCALE, SPRITE_WIDTH, TILE_SIZE, ITEM_HIT_AREA, DEBUGMODE } from "../helpers/gameConstants";

export default class Game extends Phaser.Scene {
	
    constructor(player, controls) {
        super({
            key: "Game"
        });
		
		this.player = new Player();
		this.updatetime = 0;
		this.otherplayers = [];
		this.currentmap;
		this.gamecontent;
		// controls
		this.keyA;
		this.keyS;
		this.keyD;
		this.keyW;
		this.keySPACE;
		this.keyEnter;
		this.ignoreEnter = false;
		
		this.chatMsg = "";
		this.chatOpen = false;
		this.chatTimer = Date.now();
		
		this.life;
		this.lifeText;
		console.log( MAP_SCALE, SCALED_TILE_SIZE, SPRITE_HEIGHT, SPRITE_SCALE, SPRITE_WIDTH, TILE_SIZE, ITEM_HIT_AREA, DEBUGMODE );
    }
	
    // load shit
    preload() {
		this.load.image("egg", "./src/assets/egg1.png");
		this.load.image("apple", "./src/assets/apple1.png");
		this.load.image("heart", "./src/assets/heart1.png");
        this.load.image("tiles", "./src/assets/cloud_tileset.png");
		this.load.tilemapTiledJSON("cloud_city", "./src/assets/map1.json"); // Map tile size: 16x16 and scaled tile size in game will be 48x48
		this.load.spritesheet("player", "./src/assets/character1.png", {
			frameWidth:SPRITE_WIDTH, 
			frameHeight:SPRITE_HEIGHT
		}); // character pixel are x2. To get the desired scaling (same as the map), use scale 1.5
	}
	
	addContent(newgamecontent){
		const eggs = this.add.group();
		for (let i = 0; newgamecontent.item.egg.length > i; i++) {
			eggs.add(this.add.image(newgamecontent.item.egg[i].x, newgamecontent.item.egg[i].y, "egg"));
		}
		const apples = this.add.group();
		for (let i = 0; newgamecontent.item.apple.length > i; i++) {
			apples.add(this.add.image(newgamecontent.item.apple[i].x, newgamecontent.item.apple[i].y, "apple"));
		}
		return { items: { eggs, apples } };
	}

    // called at start
    create() {
		this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
		this.keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
		this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
		this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
		this.keySPACE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
		this.keyEnter = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
		var chatTop = this.add.text(Phaser.scene,0,'',{ fontFamily: 'Georgia, "Goudy Bookletter 1911", Times, serif' }).setScrollFactor(0).setDepth(4);
		var chatMid = this.add.text(Phaser.scene,25,'',{ fontFamily: 'Georgia, "Goudy Bookletter 1911", Times, serif' }).setScrollFactor(0).setDepth(4);
		var chatBot = this.add.text(Phaser.scene,50,'',{ fontFamily: 'Georgia, "Goudy Bookletter 1911", Times, serif' }).setScrollFactor(0).setDepth(4);
		
        let self = this;

        this.socket = io("http://localhost:8081");
        this.socket.on("connect", function () {
            console.log("Connected");
        });

		this.socket.on("login", function(newplayer, newgamecontent) {
			// Get player data from the server
			self.player.id = newplayer.id;
			self.player.map = newplayer.map;
			self.player.posx = newplayer.posx;
			self.player.posy = newplayer.posy;
			self.player.inventory = newplayer.inventory;
			console.log("Logged in as player id: " + self.player.id);
			console.log("Loading map: " + self.player.map);
			console.log("Player inventory: ", self.player.inventory);
			self.currentmap = self.make.tilemap({ key: self.player.map });
			self.currentmap.addTilesetImage("Cloud City", "tiles");
			// ground
			const layer0 = self.currentmap.createDynamicLayer(0, "Cloud City", 0, 0).setDepth(0);
			layer0.scale=MAP_SCALE;
			// buildings
			const layer1 = self.currentmap.createDynamicLayer(1, "Cloud City", 0, 0).setDepth(1);
			layer1.scale=MAP_SCALE;
			// objects
			const layer2 = self.currentmap.createDynamicLayer(2, "Cloud City", 0, 0).setDepth(2);
			layer2.scale=MAP_SCALE;
			// top
			const layer3 = self.currentmap.createDynamicLayer(3, "Cloud City", 0, 0).setDepth(3);
			layer3.scale=MAP_SCALE;
			
			layer0.setCollisionByProperty({ collides: true }); 
			layer1.setCollisionByProperty({ collides: true }); 
			layer2.setCollisionByProperty({ collides: true });
			layer3.setCollision({ collides: false });

			if (DEBUGMODE) {
				layer0.renderDebug(self.add.graphics().setAlpha(0.75), {
					tileColor: null, // Non-colliding tiles
					collidingTileColor: new Phaser.Display.Color(255, 100, 50, 255), // colliding tiles
					faceColor: new Phaser.Display.Color(64, 64, 64, 255), // Colliding face edges
				});
				//console.log("layer0: ", layer0);
				layer1.renderDebug(self.add.graphics().setAlpha(0.75), {
					tileColor: null, 
					collidingTileColor: new Phaser.Display.Color(255, 255, 0, 255), 
					faceColor: new Phaser.Display.Color(64, 64, 64, 255),
				});
				layer2.renderDebug(self.add.graphics().setAlpha(0.75), {
					tileColor: null, 
					collidingTileColor: new Phaser.Display.Color(255, 155, 0, 255), 
					faceColor: new Phaser.Display.Color(64, 64, 64, 255), 
				});
				layer3.renderDebug(self.add.graphics().setAlpha(0.10), {
					tileColor: new Phaser.Display.Color(0, 255, 30, 255), 
				});
			}
			// Get game content data from the server 
			self.gamecontent = self.addContent(newgamecontent);
			console.log("gamecontent ", self.gamecontent);

			// Life data
			self.life=self.add.image(524, 30, "heart").setScrollFactor(0).setDepth(10); 
			self.lifeText=self.add.text(554,10,'').setScrollFactor(0).setDepth(10);
			self.lifeText.setStyle({
				fontSize: '16px',
				fontFamily: 'Arial',
				fontStyle: 'bold',
				color: '#ff0000',
				align: 'left',
				backgroundColor: '#ffffff'
			})
			self.life.setDataEnabled();
			self.life.data.set('egg', 0); 
			self.life.data.set('apple', 0); 
			self.life.on("changedata", function (gameObject, key, value) {
				self.lifeText.setText([
					'Eggs: ' + self.life.getData('egg'),
					'Apples: ' + self.life.getData('apple'),
				]);
			})
			// Display and set values;
			self.life.data.set('egg', self.player.inventory.eggs); 
			self.life.data.set('apple', self.player.inventory.eggs);
		});
		
		// packet accepting our movement
		this.socket.on("move", function(newpos) {
			// correct player to position approved by server
			self.player.posx = newpos.posx;
			self.player.posy = newpos.posy;
			
			self.player.desposx = self.player.posx
			self.player.desposy = self.player.posy
			//console.log("Position: ", newpos.posx, ", ", newpos.posy, ", ", self.player.map)
		});


		this.socket.on("pick", function(newpick) {
			// fix player's inventory. Approved by server
			self.player.inventory = newpick.inventory
			//console.log("Player inventory: ", self.player.inventory)
			self.life.data.set("egg", self.player.inventory.eggs); 	//self.life.data.values.egg = self.player.inventory.eggs;
			self.life.data.set("apple", self.player.inventory.apples);
		
		});
		
		// packet updating other players
		this.socket.on("posupdates", function(posupdate) {
			for(let i = 0; i < posupdate.length; i++) {
				// clean up players we have rendered that are not in this posupdate (disconnected or changed maps)
				for(let j = 0; j < self.otherplayers.length; j++) {
					let found = false;
					for(let k = 0; k < posupdate.length; k++) {
						if (self.otherplayers[j].id == posupdate[k].id) {
							found = true;
						}
					}
					if(found == false) {
						self.otherplayers[j].sprite.destroy();
						self.otherplayers.splice(j, 1);
					}
				}	
				// skip over update on self, or players in different maps
				if(posupdate[i].id == self.player.id || posupdate[i].map != self.player.map) {
					continue;
				}			
				// check for existing clientside representation of this player
				let exists = false;
				for(let j = 0; j < self.otherplayers.length; j++) {
					if(self.otherplayers[j].id == posupdate[i].id) {
						exists = true;
					}
				}
				// update existing sprite
				if(exists) {
					try {
						let curplayer = self.otherplayers.find(function(element) {
							return element.id == posupdate[i].id;
						});
						curplayer.posx = curplayer.desposx
						curplayer.posy = curplayer.desposy
						
						curplayer.desposx = posupdate[i].posx;
						curplayer.desposy = posupdate[i].posy

						curplayer.anim = posupdate[i].anim;
						curplayer.sprite.setPosition(curplayer.posx, curplayer.posy);
						
					} catch(e) {
						console.log("undef error updating other player sprite that should exist");
					}
				// otherwise create new sprite etc
				} else {
					let newsprite = self.add.sprite(0,0,"player",0);
					newsprite.setPosition(posupdate[i].posx, posupdate[i].posy);
					newsprite.setDepth(3);
					newsprite.scale=SPRITE_SCALE;
					
					let newplayer = new Player();
					newplayer.id = posupdate[i].id;
					newplayer.posx = posupdate[i].posx;
					newplayer.posy = posupdate[i].posy;
					newplayer.sprite = newsprite;
					newplayer.anim = posupdate[i].anim;
					//let player = { "id":posupdate[i].id, "posx":posupdate[i].posx,  "posy":posupdate[i].posy, "sprite":newsprite, "anim":posupdate[i].anim};
					self.otherplayers.push(newplayer);
				}
			}
			//console.log(self.otherplayers);
		});
		
		// on message received
		this.socket.on("message", function(msgpacket) {
			console.log(msgpacket);
			console.log("msg, id[" +msgpacket.id + "]: " +msgpacket.msg);
			//visible chat messages
			chatBot.setText(chatMid.text);
			chatMid.setText(chatTop.text);
			chatTop.setText("id[" +msgpacket.id + "]: " +msgpacket.msg);
			
		});
		
		// content updates
		this.socket.on("modifycontent", function(rcontent, ccontent) {
			if (rcontent.item.egg.length > 0){
				self.gamecontent.items.eggs.children.each((egg)=>{ 
					for(let i = 0; rcontent.item.egg.length > i; i++) {
						if(egg.x == rcontent.item.egg[i].x && egg.y == rcontent.item.egg[i].y) {
							self.gamecontent.items.eggs.remove(egg, true, false);	
						}
					}
				})
			}
			if (rcontent.item.apple.length > 0) { 
				self.gamecontent.items.apples.children.each((apple)=>{
					for(let i = 0; rcontent.item.apple.length > i; i++) {
						if(apple.x == rcontent.item.apple[i].x && apple.y == rcontent.item.apple[i].y) {
							self.gamecontent.items.apples.remove(apple, true, false); 	
						}
					}
				})
			}
			for (let i = 0; ccontent.item.egg.length >i; i++) { 
				self.gamecontent.items.eggs.add(self.add.image(ccontent.item.egg[i].x, ccontent.item.egg[i].y, "egg"));
			}
			for (let i = 0; ccontent.item.apple.length >i; i++) { 
				self.gamecontent.items.apples.add(self.add.image(ccontent.item.apple[i].x, ccontent.item.apple[i].y, "apple"));
			}
		});

		const playerSprite = this.add.sprite(0,0,"player",0);
		self.player.sprite = playerSprite;
		self.player.sprite.setDepth(3);
		self.player.sprite.scale=SPRITE_SCALE;
		self.cameras.main.startFollow(self.player.sprite);
    }
	
	checkmove() {
		let self = this;
		// find all nonzero tiles in layer 2 (objects)
		for(let i = 0; i < self.currentmap.layers[2].data.length; i++) {
			for(let j = 0; j < self.currentmap.layers[2].data[i].length; j++) {
				// check collision of desired movement against any found tiles
				if(self.currentmap.layers[2].data[i][j].index != -1) {
					//console.log(self.currentmap.layers[2].data[i][j]);
					let checkx = (self.currentmap.layers[2].data[i][j].x) * SCALED_TILE_SIZE;
					let checky = (self.currentmap.layers[2].data[i][j].y) * SCALED_TILE_SIZE - SCALED_TILE_SIZE;
					if(self.player.desposx >= checkx && self.player.desposx < checkx+SCALED_TILE_SIZE
					&& self.player.desposy >= checky && self.player.desposy < checky+SCALED_TILE_SIZE) {
						self.player.desposx = self.player.posx;
						self.player.desposy = self.player.posy;
					}
				}
			}
		}
		// find all nonzero tiles in layer 1 (buildings)
		for(let i = 0; i < self.currentmap.layers[1].data.length; i++) {
			for(let j = 0; j < self.currentmap.layers[1].data[i].length; j++) {
				// check collision of desired movement against any found tiles
				if(self.currentmap.layers[1].data[i][j].index != -1) {
					//console.log(self.currentmap.layers[1].data[i][j]);
					let checkx = (self.currentmap.layers[1].data[i][j].x) * SCALED_TILE_SIZE;
					let checky = (self.currentmap.layers[1].data[i][j].y) * SCALED_TILE_SIZE - SCALED_TILE_SIZE;
					if(self.player.desposx >= checkx && self.player.desposx < checkx+SCALED_TILE_SIZE
					&& self.player.desposy >= checky && self.player.desposy < checky+SCALED_TILE_SIZE) {
						self.player.desposx = self.player.posx;
						self.player.desposy = self.player.posy;
					}
				}
			}
		}
		//find all colliding tiles in layer 0 (ground)
		for(let i = 0; i < self.currentmap.layers[0].data.length; i++) {
			for(let j = 0; j < self.currentmap.layers[0].data[i].length; j++) {
				// check collision of desired movement against any found tiles
				if(self.currentmap.layers[0].data[i][j].collides != false) {
					//console.log(self.currentmap.layers[1].data[i][j]);
					let checkx = (self.currentmap.layers[0].data[i][j].x) * SCALED_TILE_SIZE;
					let checky = (self.currentmap.layers[0].data[i][j].y) * SCALED_TILE_SIZE - SCALED_TILE_SIZE;
					if(self.player.desposx >= checkx && self.player.desposx < checkx+SCALED_TILE_SIZE
					&& self.player.desposy >= checky && self.player.desposy < checky+SCALED_TILE_SIZE) {
						self.player.desposx = self.player.posx;
						self.player.desposy = self.player.posy;
					}
				}
			}
		}
	}
	
	// check for collision against items and change inventory quantities
	checkPick() {
		let pickeditems=[]; 
		this.gamecontent.items.eggs.children.each((egg)=>{
			//if(egg.x == this.player.posx && egg.y==this.player.posy){
			if(this.player.posx >= egg.x-ITEM_HIT_AREA && this.player.posx < egg.x+ITEM_HIT_AREA
				&& this.player.posy >= egg.y-ITEM_HIT_AREA && this.player.posy < egg.y+ITEM_HIT_AREA){
				this.gamecontent.items.eggs.remove(egg, true, false); // Approved by client
				this.player.inventory.eggs++; // inventory ++. Approved by client
				// console.log("Pick egg: ", egg);
				pickeditems.push({[egg.texture.key]: {["x"]: egg.x, ["y"]: egg.y}});
			}
		})
		this.gamecontent.items.apples.children.each((apple)=>{
			if(this.player.posx >= apple.x-ITEM_HIT_AREA && this.player.posx < apple.x+ITEM_HIT_AREA
				&& this.player.posy >= apple.y-ITEM_HIT_AREA && this.player.posy < apple.y+ITEM_HIT_AREA){
				this.gamecontent.items.apples.remove(apple, true, false); // Approved by client
				this.player.inventory.apples++; // inventory ++. Approved by client
				// console.log("Pick apple: ", apple);
				pickeditems.push({[apple.texture.key]: {["x"]: apple.x, ["y"]: apple.y}});
			}
		})
		return pickeditems; 
  }

    // runs every tick
    update() {
		let self = this;
		
		// add up keyboard input into a desired new position, pre-emptively place player there
		// TODO: deltatime..
		let moved = false;
		let picked = false;
		let pickeditems = [];
		
		// super fancy toggle code
		if (this.keyEnter.isDown && !self.ignoreEnter) {
			self.chatOpen = !self.chatOpen;
			self.ignoreEnter = true;
			self.chatTimer = Date.now();
			// send message if anything is typed and reset chatmsg
			if(!self.chatOpen && self.chatMsg != "") {
				console.log("sent msg: ", self.chatMsg );
				this.socket.emit("message", self.chatMsg);
				self.chatMsg = "";
			}
		}
		if(this.keyEnter.isUp) { self.ignoreEnter = false; }
		
		if(self.chatOpen) {
			this.input.keyboard.on('keydown', function(input) {
				if(self.chatTimer+25 < Date.now()) {
					if(input.key != "Enter" && input.key != "Meta" && input.key != "Backspace" && input.key != "Shift" && input.key != "Alt" && input.key != "Control" && input.key != "CapsLock" && input.key != "Tab" && input.key != "NumLock") {
						self.chatMsg = self.chatMsg+input.key;
					}
					if(input.key == "Backspace") {
						self.chatMsg = self.chatMsg.substring(0, self.chatMsg.length-1);
					}
					self.chatTimer = Date.now();
				}
			}, this)
		}
		
		if(self.chatOpen == false) {
			if (this.keyW.isDown) { this.player.desposy -= 4; this.player.anim = "walk_up"; moved = true; }
			if (this.keyS.isDown) { this.player.desposy += 4; this.player.anim = "walk_down"; moved = true; }
			if (this.keyA.isDown) { this.player.desposx -= 4; this.player.anim = "walk_left"; moved = true; }
			if (this.keyD.isDown) { this.player.desposx += 4; this.player.anim = "walk_right"; moved = true; }
			if (this.keySPACE.isDown) { this.player.anim = "walk_down"; picked = true; }
		}
		
		
		if(moved) {
			self.checkmove();
		}
		if(picked) {
			pickeditems=self.checkPick();
			console.log("inventory: ", this.player.inventory);
			// console.log("pickeditems: ", pickeditems);
			if (pickeditems.length>0){
				console.log("Send to server. pickeditems: ", pickeditems);
				this.socket.emit("pick", pickeditems); // send pickup for approval
			}
		}
		
		this.player.update();
		for(let i = 0; i < self.otherplayers.length; i++) {
			self.otherplayers[i].update();
		}
		
		self.player.posx = this.player.desposx;
		self.player.posy = this.player.desposy;
		
		// 100ms ticks for occasional update, so we dont spam the server, TODO: proper deltatime?
		if(Date.now() > (self.updatetime+100)) {
			// build a movement packet out of desired position, send it for approval
			let packet = { "playerid":this.player.id, "posx":this.player.desposx, "posy":this.player.desposy, "anim":this.player.anim };
			//console.log("Send packet: ", this.player.id, ", ", this.player.desposx, ", ", this.player.desposy );
			this.socket.emit("move", packet);
			self.updatetime = Date.now();
		}
    }
}
