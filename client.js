var socket = io();

var id;

socket.on("id", function(data) {
   id = data; 
});
console.log("hello");

function getPlayerIndex(otherId) {
    if (!players) { return -1; }
    for (var i = 0; i < players.length; i++) {
        if (players[i].id == otherId) {
            return i;
        }
    }
    return -1;
}

// update other players' positions
socket.on("op", function(data) {
    if (data[3] == id) {
        return;
    }
    var index = getPlayerIndex(data[3]);
    if (index == -1) {
        players.push(new player(data[2], 100, data[3], data[0], data[1], 0));
    } else {
        players[index].x = data[0];
        players[index].y = data[1];
    }
});

socket.on("d", function(data) {
    var index = getPlayerIndex(data);
    players.splice(index, 1);
});

socket.on("b", function(data) {
    if (data[6] == id) {
        return;
    }
    var b = new bullet(data[0], data[1], data[2], data[3], data[4], data[5]);
    b.origin = data[6];
    enemy_bullets.push(b);
    console.log("bullet")
});

socket.on("a", function(data) {
    console.log(data)
    var newAmmo = [data[0], data[1]]
    ammo.push(newAmmo)
    console.log(ammo);
})

socket.on("ra", function(data) {
    var index = -1;
    for (var i = 0; i < ammo.length; i++) {
        if (ammo[i][0] == data[0] && ammo[i][1] == data[1]) {
            index = i;
            break;
        }
    }
    if (index >= 0) {
        ammo.splice(index, 1)
    }
})

socket.on("map", function(data) {
    map = data;
})

socket.on("ping", function(data) {
    ping = data;
});

socket.on("h", function(data) {
    if (id == data[0]) {
        return;
    }
    
    var index = getPlayerIndex(data[0]);
    players[index].health = data[1];
})

function sortFunction(a, b) {
    if (a[1] === b[1]) {
        return 0;
    }
    else {
        return (a[1] > b[1]) ? -1 : 1;
    }
}

socket.on("l", function(data) {
    data.sort(sortFunction);
    leaderboard = data.slice(0, 5);
})

socket.on("stop", function(data) {
    console.log("stopping");
    location.href="https://google.com"
})

function updatePosition(pos) {
    pos[2] = Date.now();
    socket.emit("p", pos)
}

function updateHealth(health) {
    socket.emit("h", health)
}