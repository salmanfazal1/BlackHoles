// Global Variables
var WIDTH = 1000;                                     // Horizontal boundary of the game
var HEIGHT = 640;                                     // Vertical boundary of the game
var canvas = document.getElementById('main');         // Set-up canvas
var context = canvas.getContext('2d');                // Set-up context
var level = 1;                                        // Start game at level 1
var starting_score = 200;                             // Start game at 200 pts
var current_score = starting_score;                   // Set current score to starting score

var highscores_list = [];                             // List of Highscores

var starting_num_objects = 10;                         // Start the game at 10 objects
var remaining_objects = starting_num_objects;          // Remaining number of objects
var remaining_inactive_blackholes;
var blackhole_interval = 0;
var interval = 0 ;

// Lists of objects that includes Blackholes and Celestial Bodies
var object_array = [];              // Array of celestial bodies
var blackholes = [];                // Array of blackholes

// Colors that celestial bodies can randomly take on
var object_colors = ['#0066ff', '#cccccc', '#ff6699','#99ffcc','#ffff66','#cc99ff','#ff3333'];

var game_status = 0;                // Game status (0 = off, 1 = on); by default game is off
var time_left = 60;                 // Level starts at 60secs
var t;                              // Display timer t
var timer_is_on = 0;                // Timer Switch (0 = off, 1 = on); by default it is off

// Mouse Click Listerner on canvas
function doMouseDown(event) {
  var offset = canvas.getBoundingClientRect();         // Adjust for the padding on the page
  canvas_x = Math.round(event.pageX - offset.left);    // x-position of canvas on mouse-click
  canvas_y = Math.round(event.pageY - offset.top);     // y-position of canvas on mouse-click

  
  if (timer_is_on == 1) {                              // Only if the game is not paused
    for (var h = 0; h < blackholes.length; h++) {
      if (blackholes[h].status == 'active') {          // If the blackhole clicked is active
        if (blackholes[h].x_coordinate >= (canvas_x-100) && blackholes[h].x_coordinate <= (canvas_x+100)) {
          if (blackholes[h].y_coordinate >= (canvas_y-100) && blackholes[h].y_coordinate <= (canvas_y+100)) {
            
            // black blackholes 
            if (blackholes[h].type == 0) {        
              blackholes[h].status = 'destroyed';
              current_score += 20;
            // purple blackholes
            } else if (blackholes[h].type == 1) { 
              blackholes[h].status = 'destroyed';
              current_score += 10;
            // blue blackholes
            } else if (blackholes[h].type == 2) {        
              blackholes[h].status = 'destroyed';
              current_score += 5
            } 
          }
          document.getElementById("info_bar_score").innerHTML = 'Score: ' + current_score; 
        }
      }
    }
  }
}

// Start timer switch
function startCount() {
//    if (!timer_is_on) {
        timer_is_on = 1;
        timedCount();
//    }
}
// Stop timer switch
function stopCount() {
    clearTimeout(t);
    timer_is_on = 0;
}


// Play & Pause Button OnClick Actions--------------------------------------------------------------
document.getElementById("play").onclick = function() {
  startCount();
  document.getElementById('pause_overlay').style.display = 'none';
}

// Pause Button OnClick Actions
document.getElementById("pause").onclick = function() {
  stopCount();
  document.getElementById('pause_overlay').style.display = 'inline';
} //----------------------------------------------------------------------------------------------


/* Function checks if an object is within a blackhole's gravitational range/pull
   If there is, it adjusts its movement vector of object to move toward the blackhole */
function trap_objects() {

  for (var j = 0; j < blackholes.length; j++) {
    //for all blackholes
    if (blackholes[j].status == 'active') {
      //if blackhole is active
      for (var i = 0; i < object_array.length; i++) {
        //for all objects
        var distance_x = blackholes[j].x_coordinate - object_array[i].x_coordinate;
        var distance_y = blackholes[j].y_coordinate - object_array[i].y_coordinate;
        var magnitude = Math.sqrt(Math.pow(distance_x, 2) + Math.pow(distance_y,2));

        if (object_array[i].status == 'exists' && object_array[i].trapped_in == -1 && Math.abs(distance_x) <= 75 && Math.abs(distance_y) <= 75) {
            //make sure the objects exists and is within the range of blackholes gravity
            object_array[i].movement_vector = [distance_x/magnitude , distance_y/magnitude];
            object_array[i].set_offset((distance_x/magnitude)*(blackholes[j].pull), (distance_y/magnitude)*(blackholes[j].pull));
            object_array[i].trapped_in = j;
        }
      }
    }
  }  
}

/* For every existing object in the object_array, this function will check if an object is close enough to a blackhole */
/* Object will be destroyed if it is */
function checkcollisions(){
  
 
  for (var i = 0; i < object_array.length; i++) {
     if (object_array[i].status == 'exists' && object_array[i].trapped_in >= 0) {


      var x = blackholes[object_array[i].trapped_in].x_coordinate - object_array[i].x_coordinate;
      var y = blackholes[object_array[i].trapped_in].y_coordinate - object_array[i].y_coordinate;
      var distance = Math.sqrt(Math.pow(x,2) + Math.pow(y,2));

       if (Math.abs(x) <= 20 && Math.abs(y) <= 20 && blackholes[object_array[i].trapped_in].status == 'active') {
        // check for active blackholes only
        object_array[i].destroy_celestial_object();
        blackholes[object_array[i].trapped_in].objects_eaten += 1;

        if (blackholes[object_array[i].trapped_in].objects_eaten == blackholes[object_array[i].trapped_in].appetite) {
          blackholes[object_array[i].trapped_in].status = 'destroyed';
        }
      }
    }
  }
}


/* Create a Random Celestial Object */
function createobjects(){
    for(var object_index = 0; object_index < 10; object_index++){
      // Create a random object
      //0 = Normal planet, 1 = Planet with a ring, 3 = Cresent Moon
      var type_of_object = Math.floor(Math.random() * (3)) + 0;
      // Compute initial position
      var x_coordinate = Math.floor(Math.random() * (961)) + 25;
      var y_coordinate = Math.floor(Math.random() * (591)) + 25;
      //Create initial movement vectors
      var movement_vector = [Math.floor(Math.random()*10) - 5, Math.floor(Math.random() * 10) - 5];
      // Assign colors to objects
      var color = object_colors[Math.floor(Math.random() * (7 - 0)) + 0];
      // Create the Object and provide movement vectors & x- and y- coordinates
      object_array[object_index] = new Celestial_Object(type_of_object, movement_vector, x_coordinate, y_coordinate, color);
     }    
}

/* Create Blackhole Objects */
function create_blackholes(){

    var number_of_blackholes;
    // Level 1, creates 15 blackholes
    if (level == 1){
      number_of_blackholes = 15
    // Level 2, creates 30 blackholes      
    } else if (level == 2) {
      number_of_blackholes = 30;
    }
    remaining_inactive_blackholes = number_of_blackholes;

    for (var i = 0; i <number_of_blackholes; i++){
      //initialize blackhole objects and get coordinates
      var coordinates = find_coordinates(i);
      blackholes[i] = new blackhole(i, number_of_blackholes, coordinates);
    }
}


/* Generates coordinates for blackhole objects and ensures the event
   horizons of two blackholes don't cross over */
function find_coordinates(i){
  var coordinates = [];
  coordinates[0] = Math.floor(Math.random() * (951 - 50)) + 50;
  coordinates[1] = Math.floor(Math.random() * (591 - 50)) + 50;

  for (var j = 0; j<i; j++) {
    if (Math.abs(coordinates[0]-blackholes[j].x_coordinate)<100 && Math.abs(coordinates[1]-blackholes[j].y_coordinate)<100) {
      find_coordinates(i);
    }
  }
  return coordinates;
}

/* Constructor for blackhole Objects */
function blackhole(i, number_of_blackholes, coordinates){
    
    if (number_of_blackholes == 15){

      if(i < 2){
        //black blackholes
        this.type = 0; 
        this.appetite = 1;
        // this.points = 20;
        this.pull = 8;

      }else if(i > 1 && i < 6){
        //purple blackholes
        this.type = 1; 
        this.appetite = 3;
        // this.points = 10;
        this.pull = 4;
      }else{
        //blue blackholes
        this.type = 2; 
        this.appetite = 3;
        // this.points = 5;
        this.pull = 2;
      }

    }else{

      if(i < 4){
        //black blackholes
        this.type = 0; 
        this.appetite = 1;
        // this.points = 20;
        this.pull = 8;

      }else if(i > 3 && i < 13){
        //purple blackholes
        this.type = 1;
        this.appetite = 3;
        // this.points = 10;
        this.pull = 4;
      }else{
        //blue blackholes
        this.type = 2; 
        this.appetite = 3;
        // this.points = 5;
        this.pull = 2;
      }

    }
    this.objects_eaten = 0;
    this.status = 'inactive';
    // can be 'active' or 'destroyed'
    this.x_coordinate = coordinates[0];
    this.y_coordinate = coordinates[1];
   
    this.draw_blackhole = draw_blackhole/*(this.type, this.x_coordinate, this.y_coordinate)*/;
}


/* Draws the blackhole on the canvas */
function draw_blackhole(x, y, type) {
    
    blackhole_image = new Image();
    // Type 0 - Black Blackholes
    if (type == 0) {
      blackhole_image.src = 'assets/images/black_blackhole.svg';
    // Type 1 - Purple Blackholes
    } else if (type == 1) {
      blackhole_image.src = 'assets/images/purple_blackhole.svg';
    // Type 2 - Blue Blackholes
    } else if (type == 2) {
      blackhole_image.src = 'assets/images/blue_blackhole.svg';
    }

    blackhole_image.onload = function(){
      context.drawImage(this, x - 25, y - 25);
    }
}


/* Constructor for a celestial object */
function Celestial_Object(type_of_object, movement_vector, x_coordinate, y_coordinate, color){
  
  if (type_of_object == 0) {
    // Regular planet
    this.type = 0;
  }else if(type_of_object == 1){
    // Planet with a ring
    this.type = 1;
  }else{
    // Cresent Moon
    this.type = 2;
  }

  var magnitude = Math.sqrt(Math.pow(movement_vector[0],2) + Math.pow(movement_vector[1],2));
  this.x_offset = movement_vector[0]/magnitude; 
  this.y_offset = movement_vector[1]/magnitude;
  // Get x- and y- coordinates

  this.x_coordinate = x_coordinate; 
  this.y_coordinate = y_coordinate;
  this.trapped_in = -1; // Store the index of the blackhole in the blackholes array the object is trapped in, -1 if not trapped


  // Getting object colour
  this.color = color;

  this.status = 'exists';   // Status can 'exist' or be 'destroyed'


  // Celesital Body Methods
  // Call the draw function
  this.draw_object = function(){
    if (type_of_object == 0) {
        draw_planet(this.x_coordinate, this.y_coordinate, this.color);
    }else if (type_of_object == 1) {
        draw_planet_rimmed(this.x_coordinate, this.y_coordinate, this.color);
    } else {
      draw_moon(this.x_coordinate, this.y_coordinate, this.color);
    }
  }

  // Set the coordinates of the Celestial Object
  this.set_coordinates = function(){
    if (this.x_coordinate + this.x_offset <25 || this.x_coordinate + this.x_offset > 975) {
      this.set_offset(-this.x_offset,this.y_offset);
    }

    if (this.y_coordinate + this.y_offset <25 || this.y_coordinate + this.y_offset > 615) {
      this.set_offset(this.x_offset,-this.y_offset);
    }
    this.x_coordinate = this.x_coordinate + this.x_offset;
    this.y_coordinate = this.y_coordinate + this.y_offset;
  }

  this.set_offset = function(x_offset,y_offset){
    this.x_offset = x_offset;
    this.y_offset = y_offset;

  }

  this.destroy_celestial_object = function(){
    // Called when the object's center equals that of a blackhole
    this.status = 'destroyed';
    remaining_objects -= 1;
    current_score -= 50;
  }
}


// Draw functions for the celestial objects
// Cresent Moon
function draw_moon(x, y, color) {    
      context.beginPath();
      context.arc(x,y,25,2.1*Math.PI,1.4*Math.PI);
      context.stroke();
      context.fillStyle = color;
      context.fill();
      context.beginPath();
      context.arc(x+10, y-10, 20, 2.2*Math.PI, 1.3*Math.PI);
      context.fillStyle = "black";
      context.fill();
      context.stroke();
}

// Planet with a ring
function draw_planet_rimmed (x, y, color) {
      context.beginPath();
      context.arc(x, y, 25, 0, 2*Math.PI, false);
      context.stroke();
      context.moveTo(x-30, y+30);
      context.lineTo(x+30, y-30);
      context.strokeStyle = '#FEFCD7';
      context.stroke();
      context.fillStyle = color;
      context.fill();
}

// Regular, spherical planet
function draw_planet(x, y, color) {

      context.beginPath();
      context.arc(x, y, 25, 0, 2 * Math.PI, false);
      context.fillStyle = color;
      context.fill();
      context.strokeStyle = 'green';
      context.stroke();
}



/* Game Progression & Transition functions */

/* 1) Onload calls Start page. */
window.onload = function() {
  // Loads the Start Page
  startpage();
}

/* 2) The Start Page */
function startpage() {
    // Game Title 'Blackholes'
    clear();
    context.font = '30pt Courier New';
    context.fillStyle = '#1BEF18';
    context.fillText('Blackholes', 400, 200);
    
    // High Score Title
    context.font = '15pt Courier New';
    context.fillStyle = 'white';    
    context.fillText('High Scores:', 440, 280);

    // time_left = 60;
    // Display Top 3 scores and space them out by i*30px
    // if there aren't 3 top scores available display a blank space
    // Sort highscores in descending order, showing top 3 scores
    var sorted_list = highscores_list.sort(function(a, b){return b-a});
    for (var i = 0; i < 3; i++) {
      if (sorted_list[i] == undefined) {
        context.fillText(" ", 490, 320+i*30);
      } else {
        context.fillText(i+1 + ". " + sorted_list[i], 490, 320+i*30);
      }
    }
}

/* 3a) Start Game Button Onclick */ 
document.getElementById("startgame").onclick = function() {
  
  // Hides the 'START' game button after it is clicked
  document.getElementById('startgame').style.visibility = 'hidden';
  // Update Score in info-bar with 200 points
  document.getElementById("info_bar_score").innerHTML = 'Score: ' + current_score; 
  // Update Level in info-bar at level 1
  document.getElementById("info_bar_level").innerHTML = 'Level: ' + level;
  // Display the play/pause buttons
  document.getElementById('play').style.display = 'inline';
  document.getElementById('pause').style.display = 'inline';
  // Loads a new game
  gamepage();
}


/* 3b) Proceed to level 2 after OnClick of Next button */ 
document.getElementById("nextbutton_id").onclick = function() {
  // Reset the time for level 2
  time_left = 60;
  // Hides the 'NEXT' button after it is clicked
  document.getElementById('nextbutton_id').style.visibility = 'hidden';
  // Display the play/pause buttons
  document.getElementById('play').style.display = 'inline';
  document.getElementById('pause').style.display = 'inline';
  // Activate click event listener, animate, and counter
  init();
}

/* 4) Finish screen, restart the game */
document.getElementById("finishbutton_id").onclick = function() {
  // Reset the time
  time_left = 60;
  // Update info-bar
  document.getElementById("info_bar_timer").innerHTML = 'Time Left: ' + time_left;
  // Turn off the timer
  timer_is_on = 0;
  // Reset to level 1
  level = 1;
  document.getElementById("info_bar_level").innerHTML = 'Level: ' + level;
  // Reset score to default
  current_score = starting_score;
  // Hide the 'FINISH' button after it is clicked
  document.getElementById('finishbutton_id').style.visibility = 'hidden';
  // Restart the game
  startpage();
  // Re-display the 'START' game button
  document.getElementById('startgame').style.visibility = 'visible';

  // Destroy all objects for recreation later
  for (var i = 0; i < blackholes.length; i++) {
    blackholes[i].status = 'destroyed';
  }
  for (var j = 0; j < object_array; j++) {
    object_array[j].destroy_celestial_object();
  }
  // Reset all game values
  remaining_objects = 10;
  blackhole_interval = 0;
  interval= 0 ;
  remaining_inactive_blackholes = 0;
}


/* 4) Clear the canvas, create the in game objects and initiate a game */
function gamepage() {
  clear();                                            
  createobjects();
  create_blackholes();  
  init(); 
}


/* 5) Call the mouse click listerner, start the timer, and start the game animation */
function init() {

  canvas.addEventListener("mousedown", doMouseDown, false);       
  startCount();
  return setInterval(draw, 10); 
}


/* ANIMATE GAME FUNCTIONS */

// Clears the canvas
function clear() {
  window.context.clearRect(0, 0, WIDTH, HEIGHT);    
}

// Randomly inactivate blackhole
function assign_random(){
  var i = Math.floor(Math.random() * (blackholes.length));
  if (blackholes[i].status == 'inactive') {
    return i;
  }else{
    assign_random();
  }
}

// Animate the movements of the celestial objects
function draw() {
  
  blackhole_interval += 1;
  interval += 1;

  checkcollisions();
  trap_objects();

  if (timer_is_on && time_left > 0 && remaining_objects>0) {

    clear();      // refresh canvas each time

    for (var i = 0; i < object_array.length; i++) {
      if (object_array[i].status == 'exists') {
        object_array[i].draw_object();
        object_array[i].set_coordinates();
      }
    }

    for (var j = 0; j < blackholes.length; j++) {
      if (blackholes[j].status == 'active') {
        blackholes[j].draw_blackhole(blackholes[j].x_coordinate,blackholes[j].y_coordinate,blackholes[j].type);
     }
     if(blackholes[j].objects_eaten >= blackholes[j].appetite){
        blackholes[j].status = 'destroyed';
     }
    }
  }

  if (time_left > 0 && blackhole_interval%(600/level) == 0 && remaining_inactive_blackholes > 0) {
    var blackhole_index = assign_random();
    blackholes[blackhole_index].status = 'active';
    remaining_inactive_blackholes -= 1;
  }



  if (time_left == 0 && level == 1 && remaining_objects > 0 && interval%(6000)) {
    create_blackholes();      // Reset the blackholes
  }

/*
  if ((time_left == 0 && level == 2) || remaining_objects ==0){
  }
*/

  document.getElementById("info_bar_score").innerHTML = 'Score: ' + current_score; 
}


// Timer function and Transition between levels
function timedCount() {
    // Display time in the info-bar
    document.getElementById("info_bar_timer").innerHTML = 'Time Left: ' + time_left;  
    // If time reaches 0, stop the counter
    if (time_left > 0 && remaining_objects > 0) {
      time_left = time_left - 1;
      t = setTimeout(function(){ timedCount() }, 1000);

    // If player advances to level 2
    } else if (time_left == 0 && level == 1 && remaining_objects > 0) {
      // Update game to level 2
      level += 1;
      document.getElementById("info_bar_level").innerHTML = 'Level: ' + level;
      clear();

      // Display level and score on canvas in addition to info-bar
      context.font = '25pt Courier New';
      context.fillStyle = 'white';    
      context.fillText('Level: ' + level, 440, 250);
      context.fillText('Score: ' + current_score, 440, 320);

      // Change 'Start' button label to 'Next' button
      //document.getElementById('startgame').innerHTML = 'Next';
      document.getElementById('nextbutton_id').style.visibility = 'visible';
      document.getElementById('play').style.display = 'none';
      document.getElementById('pause').style.display = 'none';
    } else if (time_left == 0 && level == 2 || remaining_objects == 0) {
   
      // add current score to the highscore list
      highscores_list.push(current_score);
      clear();

      context.font = '25pt Courier New';
      context.fillStyle = 'white';    
      context.fillText('Final Score: ' + current_score, 420, 320);

      document.getElementById('play').style.display = 'none';
      document.getElementById('pause').style.display = 'none';
      document.getElementById('finishbutton_id').style.visibility = 'visible';

    }
}



