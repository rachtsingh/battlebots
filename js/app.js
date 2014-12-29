
// random graphics functions that need to be global
RANGE = 200;
JITTER = 100;
HEALTH_BONUS = 10;
CANVAS_WIDTH = 900;
CANVAS_HEIGHT = 600;
PLAYER_SPEED = 1;
HEALTH_RADIUS = 30;

Number.prototype.clamp = function(min, max) {
  return Math.min(Math.max(this, min), max);
};

Number.prototype.inside = function(a, b) {
	return (this >= a && this <= b) || (this >= b && this <= a);
}

function dist(pos1, pos2){
	return Math.sqrt(Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y- pos2.y, 2));
}

function ready(){
	// setup editors
	editor1 = CodeMirror.fromTextArea(document.getElementById("player1"), {
		lineNumbers: true,
	    styleActiveLine: true,
	    matchBrackets: true
	});
	editor2 = CodeMirror.fromTextArea(document.getElementById("player2"), {
		lineNumbers: true,
	    styleActiveLine: true,
	    matchBrackets: true
	});

	editor1.setOption("theme", "monokai");
	editor2.setOption("theme", "monokai");

	go = true;

	// setup drawing
	canvas = document.getElementById("canvas");
	ctx = canvas.getContext("2d");

	Rectangle = function(position, dimensions){
		this.position = position; // upper left corner!!!
		this.dimensions = dimensions;
		this.style = "rgb(0.3, 0.3, 0.3)"
		this.render = function(){
			ctx.fillStyle = this.style;
			ctx.fillRect(this.position.x, this.position.y, this.dimensions.x, this.dimensions.y);
		}
		this.intersect = function(rect){
			if(go && rect.type != "Player"){
				console.log(this);
				console.log(rect);
				go = false;
			}
			// upperleft corner
			if (rect.position.x.inside(this.position.x, this.position.x + this.dimensions.x) && rect.position.y.inside(this.position.y, this.position.y + this.dimensions.y)){
				console.log("Found intersection!");
				console.log(this, rect);
				return true;
			}
			if (this.position.x.inside(rect.position.x, rect.position.x + rect.dimensions.x) && this.position.y.inside(rect.position.y, rect.position.y + rect.dimensions.y)){
				console.log("Found intersection!");
				console.log(this, rect);
				return true;
			}

			// upperright corner
			if ((rect.position.x + rect.dimensions.x).inside(this.position.x, this.position.x + this.dimensions.x) && (rect.position.y).inside(this.position.y, this.position.y + this.dimensions.y)){
				console.log("Found intersection!");
				console.log(this, rect);
				return true;
			}
			if ((this.position.x + this.dimensions.x).inside(rect.position.x, rect.position.x + rect.dimensions.x) && (this.position.y).inside(rect.position.y, rect.position.y + rect.dimensions.y)){
				console.log("Found intersection!");
				console.log(this, rect);
				return true;
			}

			// lowerleft corner
			if ((rect.position.x).inside(this.position.x, this.position.x + this.dimensions.x) && (rect.position.y + rect.dimensions.y).inside(this.position.y, this.position.y + this.dimensions.y)){
				console.log("Found intersection!");
				console.log(this, rect);
				return true;
			}
			if ((this.position.x).inside(rect.position.x, rect.position.x + rect.dimensions.x) && (this.position.y + this.dimensions.y).inside(rect.position.y, rect.position.y + rect.dimensions.y)){
				console.log("Found intersection!");
				console.log(this, rect);
				return true;
			}

			// lowerright corner
			if ((rect.position.x + rect.dimensions.x).inside(this.position.x, this.position.x + this.dimensions.x) && (rect.position.y + rect.dimensions.y).inside(this.position.y, this.position.y + this.dimensions.y)){
				console.log("Found intersection!");
				console.log(this, rect);
				return true;
			}
			if ((this.position.x + this.dimensions.x).inside(rect.position.x, rect.position.x + rect.dimensions.x) && (this.position.y + this.dimensions.y).inside(rect.position.y, rect.position.y + rect.dimensions.y)){
				console.log("Found intersection!");
				console.log(this, rect);
				return true;
			}


			return false;
		}
	}

	/* Bonus objects */
	Bonus = function(position){
		this.type = "Bonus"
		this.position = position;
		this.dimensions = {x: 15, y: 15};
		this.style = "rgb(61, 255, 71)";
	}
	Bonus.prototype = new Rectangle();

	Mine = function(position, owner){
		this.position = position;
		this.dimensions = {
			x: 10,
			y: 10
		}
		this.style = "rgb(255, 125, 125)";
		this.type = "Mine";
		this.owner = owner;
	}

	Line = function(start, end, style){
		this.start = start;
		this.end = end;
		this.style = style;
		this.width = width || 5;

		this.render = function(){
			ctx.beginPath();
			ctx.moveTo(this.start.x, this.start.y);
			ctx.lineTo(this.end.x, this.end.y);
			ctx.strokeStyle = this.style;
			ctx.lineWidth = this.width;
			ctx.stroke();
		}
	}

	Player = function(position){

		// random attrs
		this.position = position;
		this.dimensions = {
			x: 30,
			y: 30
		}
		this.style="rgb(0, 0, 0)";
		this.type = "Player"
		this.health = 100;
		this.speed = 0;
		this.direction = 0;
		this.laser = {
			angle: 0,
			power: 0,
			reset: 30,
			obj: false
		}


		// utility functions that the player can use!
		this.scope = function() {
			ScopeObject = function(position, type){
				this.position = position;
				this.type = type;
			}

			ret = [];
			for (var i = 0; i < objects.length; i++){
				dist = dist(objects[i].position, this.position);

				// if close enough it'll give a good description
				if (dist < RANGE/3.0 && objects[i] != this && !(objects[i].type == "Mine" && objects[i].owner != this)){
					ret.push(new ScopeObject(objects[i].position, objects[i].type));
				}
				else if (dist < RANGE && objects[i] != this){
					newx = objects[i].position.x + (JITTER)*(this.speed)*(Math.random() - 0.5);
					newy = objects[i].position.y + (JITTER)*(this.speed)*(Math.random() - 0.5);
				}
			}


			return ret;
		}

		this.getPos = function() {
			return {x: this.position.x, y: this.position.y, direction: this.direction};
		}

		this.pointLaser = function(angle) {
			this.laser.angle = angle % (2*Math.PI);
		}

		this.setPower = function(power){
			this.laser.power = (power == 1) ? 1.0 : power % 1;
		}

		this.setDirection = function(angle){
			this.direction = angle % (2*Math.PI);
		}

		this.setSpeed = function(speed){
			this.speed = (speed == 1) ? 1 : speed % 1;
		}

		// ----------------- internal functions for use
		this.render = function(){
			ctx.fillStyle = this.style;
			ctx.fillRect(this.position.x, this.position.y, 30, 30);
		}

		this.fire = function(){
			// drop a line render object and render each it frame

			
		}

		this.move = function(){
			this.position.x = (this.position.x + Math.cos(this.direction) * this.speed * PLAYER_SPEED).clamp(0, CANVAS_WIDTH - 30);
			this.position.y = (this.position.y + Math.sin(this.direction) * this.speed * PLAYER_SPEED).clamp(0, CANVAS_HEIGHT - 30);

			for (var i = 0; i < objects.length; i++){
				if (objects[i].type == "Bonus" && this.intersect(objects[i])){
					objects.splice(i, 1);
					i--;
					this.health += HEALTH_BONUS;
				}
			}
		}

		// the actual loop followed
		this.run = function(){
			try {
				this.turn();
			}
			catch(e) {
				//console.log(e);	
			}
			if (this.laser.reset == 0){
				if (this.laser.power > 0){
					this.laser.reset = 30;
					// now calculate the ending position;
					// basically let's use the fact that a pixel is the smallest unit shown
					currentpos = this.position;
					while (currentpos.x >= 0 && currentpos.x < CANVAS_WIDTH && currentpos.y >= 0 && currentpos.y < CANVAS_HEIGHT){
						currentpos.x += Math.cos(this.laser.angle);
						currentpos.y += Math.sin(this.laswer.angle)
					}
					this.laser.obj = new Line()
				}
			}
			else {
				this.laser.reset -= 1;
			}
			this.move();
		}
		// the way that the player works is on its turn,
		// it first calls turn(), then fires if the laser is on, then moves
	}
	Player.prototype = new Rectangle();
}

function parseCode(text){
	text = text.replace("this", ""); // remove access to parent
	special = ["scope", "getPos", "pointLaser", "setPower", "setDirection", "setSpeed"];
	for (var i = 0; i < special.length; i++){
		text = text.replace(special[i], "this." + special[i]);
	}

	return text;
}

function start(){
	breakflag = false;
	// ok steps
	// 1. initialize the player objects and get the turn code
	// 2. initialize the bonus objects
	// 3. randomly decide on which player gets the first turn
	// then loop!

	// game variables
	objects = []; // all of the renderable objects on the screen. each should have a render() method to work properly


	// STEP 1
	players = [];
	players.push(new Player({x: 100, y: 250})); // player 1
	players.push(new Player({x: 750, y: 250})); // player 2

	objects.push(players[0]);
	objects.push(players[1]);

	script_1 = parseCode(editor1.getValue());
	script_2 = parseCode(editor2.getValue());

	players[0].style="rgb(25, 121, 255)";
	players[1].style="rgb(255, 65, 25)";

	eval("players[0].turn = function(){" + script_1 + "}"); // risky business
	eval("players[1].turn = function(){" + script_2 + "}");

	// STEP 2
	for(var i = 0; i < 20; i++){
		objects.push(new Bonus({x: 100 + 700*Math.random(), y: 50 + 500*Math.random()}));
	}

	objects.push(new Bonus({x: 600, y:250 }));
	objects.push(new Bonus({x: 200, y:250 }));

	// STEP 3
	if (Math.random() > 0.5){
		// swap!
		temp = players[0];
		players[0] = players[1];
		players[1] = temp;
	}

	function animationLoop(){
		if (breakflag){
			return;
		}
		// take each of the players turns
		players[0].run();
		players[1].run();

		// draw things!
		ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
		for (var i = 0; i < objects.length; i++){
			objects[i].render();
		}

		// draw the health onto the screen
		ctx.font = "16px Arial";
		ctx.fillText(players[0].health.toString(), 25, 575);
		ctx.fillText(players[1].health.toString(), 825, 575);

		// grab the next frame!
		requestAnimationFrame(animationLoop);
	}

	animationLoop();
}

function stop() {
	breakflag = true;
}