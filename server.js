var app = require('express')();
var http = require('http').Server(app);
var path = require('path');
var io = require('socket.io')(http);

app.get('/', function(req, res){
  res.sendFile(__dirname + "/index.html");
});

app.get('/client.js', function(req, res){
  res.sendFile(__dirname + "/client.js");
});

http.listen(process.env.PORT || $PORT, function(){
  console.log('Started');
});




var mapSize = [2000,2000]
var gSize = 100;

function rand(max, min){
	var ran = ((Math.random() * (max - min)) + min)
	return ran;
}
function randPoint(){
    x = Math.floor(rand(20,0))
    y = Math.floor(rand(20,0)) 
    return [x,y]
}
function createMap(){
    var map = [];
    var startNum = 7
    var starts = []
    for(i = 0; i < startNum; i++){
        var point = randPoint()
        while(starts.includes(point)){
            point = randPoint()
        }
        starts.push(point)
    }
    console.log(starts)
    for(i = 0; i < mapSize[0]/gSize; i++){
        var row = []
        for(j = 0; j < mapSize[1]/gSize; j++){
            row.push(0)
        }
        map.push(row)
    }
    var walls = 18
    for(i = 0; i < mapSize[0]/gSize; i++){
        for(j = 0; j < mapSize[1]/gSize; j++){
            for(var k = 0; k < starts.length; k++){
               if(starts[k][0] == i && starts[k][1] == j){
                   var x = i
                   var y = j
                   for(var p = 0; p < walls; p++){
                       var dir = Math.floor(rand(0,4))
                       if(dir == 0 && y < map[0].length-1 ){
                           map[x][y+1] = 1
                           y += 1
                       }
                       else if(dir == 1 && y > 0){
                           map[x][y-1] = 1
                           y -= 1
                       }
                       else if(dir == 2 && x < map.length - 1){
                           map[x+1][y] = 1
                           x += 1
                       }
                       else if(dir == 3 && x > 0){
                           map[x-1][y] = 1
                           x -= 1
                       }
                   }
               }
            }
        }
    }
    map[map.length/2-1,map[0].length/2-1] = 1
    map[map.length/2-1,map[0].length/2] = 1
    map[map.length/2,map[0].length/2-1] = 1
    map[map.length/2,map[0].length/2] = 1
    return map;
}

var map = createMap();


///////////////////////////////////////////////////////////////
//////////////// NETWORKING ///////////////////////////////////
///////////////////////////////////////////////////////////////

var lastId = 0;
function nextId() {
    lastId++;
    return lastId;
}

var leaderboard = [];
function updateLeaderboard() {
    io.emit("l", leaderboard);
}

io.on('connection', function(socket){
    
    // on connection
    console.log('User connected.');
    socket.id = nextId();
    socket.kills = 0;
    socket.emit("id", socket.id);
    socket.emit("map", map);
    
    socket.on("name", function(data) {
        socket.pname = data;
        leaderboard.push([socket.id, 0, socket.pname])
    })
    
    // set up attributes
    socket.x = 0;
    socket.y = 0;
    
    socket.on('disconnect', function(){
        console.log('User disconnected');
        socket.broadcast.emit("d", socket.id);
        var index = -1;
        for (var i = 0; i < leaderboard.length; i++) {
            if (leaderboard[i][0] === socket.id) {
                index = i;
            }
        }
        if (index >= 0) {
            leaderboard.splice(index, 1);
        }
    });
  
    // when client moves
    socket.on("p", function(data) {
        var delta = Date.now() - data[2];
        socket.emit("ping", delta);
        
        socket.x = data[0];
        socket.y = data[1];
        data[2] = socket.pname;
        data.push(socket.id);
        socket.broadcast.emit("op", data);
        updateLeaderboard();
        
    });
    
    socket.on("h", function(data) {
        socket.broadcast.emit("h", [socket.id, data]); 
    });
    
    // when bullet is spawned
    socket.on("b", function(data) {
        socket.broadcast.emit("b", data)
    })
    
    socket.on("k", function(sid) {
        for (var i = 0; i < leaderboard.length; i++) {
            if (leaderboard[i][0] === sid) {
                leaderboard[i][1]++;
            }
        }
        updateLeaderboard();
    });
    
    // ammo spawn
    socket.on("a", function(data) {
        socket.broadcast.emit("a", data);
    })
    
    socket.on("ra", function(data) {
        socket.broadcast.emit("ra", data);
    })
  
});

var rl = require('readline');

function ask(question, callback) {
  var r = rl.createInterface({
    input: process.stdin,
    output: process.stdout});
  r.question(question + '\n', function(answer) {
    r.close();
    callback(answer, answer);
  });
}

ask('cmd>', function(cmd) {
    console.log("CMD: " + cmd)
  if (cmd == "stop") {
      console.log("stopping")
    io.emit("stop", 0)   
  }
});