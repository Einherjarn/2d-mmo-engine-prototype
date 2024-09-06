export default class Player {
	constructor(id, map, posx, posy) {
		this.id = id;
		this.map = map;
		this.posx = 164;
		this.posy = 700;
		this.sprite;
		this.inventory;
		// animation related crap
		this.anims = [];
		this.anim = "walk_down";
		this.lastframeindex = 0;
		this.lastdir = 1;
		this.updatetime = 0;
		
		// desired position to be confirmed by server
		this.desposx = this.posx;
		this.desposy = this.posy;
		
		/* current spritesheet is, per character:
		0, 1, 2
		3, 4, 5
		6, 7, 8
		9, 10, 11
		
		downwards
		left
		right
		upwards
		
		("still" frames in the middle (1,4,7,10))
		*/
		
		//this.anims["idle"] = [ 1 ]
		this.anims["walk_down"] = [ 0,1,2,1 ]
		this.anims["walk_left"] = [ 3,4,5,4 ]
		this.anims["walk_right"] = [ 6,7,8,7 ]
		this.anims["walk_up"] = [ 9,10,11,10 ]
		
		}
	
	update() {
		let self = this;
		this.sprite.setPosition(this.posx, this.posy);
		this.sprite.depth = 2+(this.posy/100000); // TODO: use map size..
		// ...
		if(Date.now() > (self.updatetime+100)) {
			let xdiff = this.posx - this.desposx;
			let ydiff = this.posy - this.desposy;
			this.lastdir = this.anims[this.anim][1];
			// if we havent moved, use idle frame for last moved direction
			if(xdiff == 0 && ydiff == 0) {
				this.sprite.setFrame(this.lastdir);
			} else {
				// 
				if(this.lastframeindex >= this.anims[this.anim].length) {
					this.lastframeindex = 0;
				}
				//console.log(xdiff, ydiff, this.anim);
				//console.log(this.anims[this.anim][this.lastframeindex+1]);
				this.sprite.setFrame(this.anims[this.anim][this.lastframeindex]);
				this.lastframeindex++;
			}
			self.updatetime = Date.now();
		}
	}
}