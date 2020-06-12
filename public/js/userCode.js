//Get the socket
const socket = io();

var i;

/*// Warning before leaving the page (back button, or outgoinglink)
window.onbeforeunload = function() {
   return "Do you really want to leave our brilliant application?";
   //if we return nothing here (just calling return;) then there will be no pop-up question at all
   //return;
};*/

//Function to centre horizontally (width) a element in its parent://
function widthCenter(childName, parentName){
    $(childName).css("position", "absolute"); //Set the child's position to absolute
    var parentWidth = $(parentName).width(); //Get the parent's width
    var childWidth = $(childName).outerWidth(); //Get the child's outerWidth
    //Get what amount of the parent (split between two sides) should surround the child:
    var leftForChild = (parentWidth - childWidth)/2;
    //Set this split amount as the left position where the child starts:
    $(childName).css("left", leftForChild + "px");
}

widthCenter("#readyButton", "#wordTeller");

$("#timer").text("Timer");
$("#timer").css("color", "black");

//Get username, roomid, and pwd from url:
const {username, roomId} = Qs.parse(location.search, {
    ignoreQueryPrefix: true
});
socket.emit('joinRoom', {username, roomId})

$("#p-roomId").text("Room ID: " + roomId);

socket.on('message', function(message){
    console.log(message);
});


function languageChange(e){
    socket.emit('Language Changed', e.value);
}

socket.on('updateLanguage', function(language){
    var languageDropdown = document.getElementById("languageDropdown");
    languageDropdown.value = language;
});



socket.on('updatePlayerList', function(roomUsers){
    updatePlayerList(roomUsers);
});
function updatePlayerList(roomUsers){
    var roomUsersKeys = Object.keys(roomUsers);

    var playerNames = [];

    var tmpUser;
    for (const key of roomUsersKeys) {
        tmpUser = roomUsers[key];
        tmpUsername = tmpUser.username;
        if(tmpUser.tellerStatus){tmpUsername += "*"}
        playerNames.push(tmpUsername);
    }


    var playerList = document.getElementById("playerList");
    var playerListHTML = "PlayerList:";
    for (i = 0; i < playerNames.length; i++) {
        playerListHTML += "<br>" + playerNames[i];
    }
    playerList.innerHTML = playerListHTML;
}

/*
socket.on('give me html status', function(){
    console.log("new user is here");
    var html = escape($("html").html());
    socket.emit('return html status', html);

});*/


//Canvas:
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

function clearCanvas(){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

//Initial text
ctx.font = "28px Arial";
ctx.lineWidth = 1;
ctx.fillStyle = "black";
ctx.textAlign = "center";
ctx.fillText("Click 'New Game' to start (unless you see a countdown)", canvas.width/2, canvas.height/2);

//Painting the cards:
const gapBtCards = (canvas.width - 5*75)/6;
var cardCounter;
var cardX, cardName;
var textX, textY;
function paintCards(cards){
    clearCanvas();
    cardCounter= -1;
    cards.forEach(card => {
        cardCounter++;

        cardName = card.name;

        cardX = cardCounter*card.w + cardCounter*gapBtCards + gapBtCards;
        card.x = cardX;
        socket.emit('update card.x', {cardName, cardX});

        ctx.beginPath();
        ctx.rect(card.x, card.y, card.w, card.h);

        if(card.name === "deck"){
            ctx.fillStyle = card.color;
            ctx.fill();
        }else{
            ctx.lineWidth = 3;
            ctx.strokeStyle = card.color;
            ctx.stroke();
        }

        ctx.font = "30px Arial";
        ctx.lineWidth = 1;
        ctx.fillStyle = card.textColor;
        ctx.textAlign = "center";
        textX = (card.x+card.w/2);
        textY = (card.y+card.h/2)+7.5;
        ctx.fillText(card.text, textX, textY);
    });
}

socket.on('paintCards', function(cards){
    paintCards(cards);
});

/*
https://lavrton.com/hit-region-detection-for-html5-canvas-and-how-to-listen-to-click-events-on-canvas-shapes-815034d7e9f8/

https://stackoverflow.com/questions/3173448/html5-canvas-find-out-if-click-co-ordinates-are-inside-a-given-rectangle/5481005
*/
canvas.addEventListener('click', function(e) {
    const clickPos = {
        x: e.pageX - canvas.offsetLeft,
        y: e.pageY - canvas.offsetTop
    };

    socket.emit('cardClicked', clickPos);
});

function newGame(){
    var languageDropdown = document.getElementById("languageDropdown");
    socket.emit('newGame', languageDropdown.value);
}

socket.on('need more players', function(){
    alert("You need mat least three players to start");
});

socket.on('show ready button to tellers', function(){
    $("#readyButton").show();
});

function tellerReady(){
    socket.emit('teller clicked ready');
}

socket.on('hide tellers UI', function(){
    $("#readyButton").hide();
    $("#tellerUI").hide();
});

socket.on('show UI to tellers', function(){
    $("#readyButton").hide();
    $("#tellerUI").show();
});

socket.on('update roleStatus', function(msg){
    $("#roleStatus").text(msg);
});

socket.on('paintMessage', function(msg){
    clearCanvas();
    //Initial text
    ctx.font = "20px Arial";
    ctx.lineWidth = 1;
    ctx.fillStyle = "black";
    ctx.textAlign = "center";
    ctx.fillText(msg, canvas.width/2, canvas.height/2);
});

socket.on('updateTimer', function(timeInfo){
    $("#timer").text(timeInfo.time);
    $("#timer").css("color", timeInfo.color);
})

var wordText;
socket.on('show words', function(words){
    wordText = "";
    //$("#wordList").html(wordText);
    for (i = 0; i < words.length; i++) {
        wordText += (i + 1) + ". " + words[i] + "<br><br>";
    }
    $("#wordList").html(wordText);
});

function correct(){
    socket.emit('correct is clicked');
}

function pass(){
    socket.emit('pass is clicked');
}

socket.on('updateScore', function(score){
    $("#scoreNb").text(score);
});


// --- CANVAS TRAINING --- //
//canvas.width = window.innerWidth;

/*
//fillRect()
ctx.fillStyle = 'red';
ctx.fillRect(20, 20, 150, 100);
ctx.fillStyle = 'blue';
ctx.fillRect(200, 20, 150, 100);

//strokeRect()
ctx.lineWidth = 5;
ctx.strokeStyle = 'green';
ctx.strokeRect(100, 200, 150, 100);

//clearRect()
//Clears out an area
ctx.clearRect(25, 25, 140, 90);

//fillText()
ctx.font = '30px Arial';
ctx.fillStyle = 'purple';
ctx.fillText('Hello World', 400, 50);

//strokeText()
ctx.lineWidth = 1;
ctx.strokeStyle = 'orange';
ctx.strokeText('Hello World', 400, 100);
*/

// --- Paths ---

/*
//triangles
ctx.beginPath();
ctx.moveTo(50, 50);
ctx.lineTo(150, 50);
ctx.lineTo(100, 200);
//ctx.closePath();
ctx.lineTo(50, 50);
//ctx.stroke();
ctx.fillStyle = 'coral';
ctx.fill();

ctx.beginPath();
ctx.moveTo(200, 50);
ctx.lineTo(150, 200);
ctx.lineTo(250, 200);
ctx.closePath();
ctx.stroke();

//rectangle
ctx.beginPath();
ctx.rect(300, 50, 150, 100);
ctx.fillStyle = 'teal';
ctx.fill();*/

/*
// arc - circles
ctx.beginPath();
//ctx.arc(300, 100, 40, 0, Math.PI * 2);
const centerX = canvas.width/2;
const centerY = canvas.height/2;

//head
ctx.arc(centerX, centerY, 200, 0, Math.PI * 2);
//mouth
ctx.moveTo(centerX + 100, centerY);
ctx.arc(centerX, centerY, 100, 0, Math.PI, false);
//eyes
ctx.moveTo(centerX - 60, centerY - 80);
ctx.arc(centerX - 80, centerY - 80, 20, 0, Math.PI * 2);
ctx.moveTo(centerX + 100, centerY - 80);
ctx.arc(centerX + 80, centerY - 80, 20, 0, Math.PI * 2);
//draw
ctx.stroke();*/

/*
//Animation 1
const circle = {
    x: 200,
    y: 200,
    size: 30,
    dx: 5,
    dy: 4,
}

function drawCircle(){
    ctx.beginPath();
    ctx.arc(circle.x, circle.y, circle.size, 0, Math.PI * 2);
    ctx.fillStyle = 'purple';
    ctx.fill();
}

function canvasUpdate(){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawCircle();

    //change position
    circle.x += circle.dx;
    circle.y += circle.dy;

    //Collision detection side walls
    if(circle.x + circle.size > canvas.width || circle.x - circle.size < 0){
        circle.dx *= -1;
    }

    //Collision detection side walls
    if(circle.y + circle.size > canvas.height || circle.y - circle.size < 0){
        circle.dy *= -1;
    }

    requestAnimationFrame(canvasUpdate);
}

canvasUpdate();

//Animation 2
const player = {
    w: 50,
    h: 70,
    x: 20,
    y: 200,
    speed: 5,
    dx: 0,
    dy: 0
}*/
