//Get the socket
const socket = io();

//Declare important variables:
var i;

//Get username, and roomId from url:
const {username, roomId} = Qs.parse(location.search, {
    ignoreQueryPrefix: true //This makes sure there won't the query symbols
});
//Emit to join room:
socket.emit('joinRoom', {username, roomId});

/* ---Page Setup--- */

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

//Center some element of the UI
widthCenter("#roleStatus", "#wordTeller");
widthCenter("#readyButton", "#wordTeller");
//Reset the timer
$("#timer").text("Timer");
$("#timer").css("color", "black");
//Set the room ID:
$("#p-roomId").text("Room ID: " + roomId);

/* ---Update player list--- */
//When this message is received from server...
socket.on('updatePlayerList', function(roomUsers){
    //...call this function:
    updatePlayerList(roomUsers);
});
function updatePlayerList(roomUsers){
    //Go through each user in the room...
    var playerNames = [];
    var tmpUser;
    for (i = 0; i < roomUsers.length; i++) {
        tmpUser = roomUsers[i]; //get the user
        tmpUsername = tmpUser.username; //get the username
        if(tmpUser.tellerStatus){tmpUsername += "*"} //add an * if they are a teller
        playerNames.push(tmpUsername); //add to the array of player names
    }

    //Prepare what will be sent to the player list on the page:
    var playerListHTML = "PlayerList:"; //initial part
    //Go through each user name and add them with a line break before each:
    for (i = 0; i < playerNames.length; i++) {
        playerListHTML += "<br>" + playerNames[i];
    }

    //Update the innerHTML of the playerList:
    var playerList = document.getElementById("playerList");
    playerList.innerHTML = playerListHTML;
}

/* ---Language Change--- */
//If the selected language in the dropdown is changed by the user...
function languageChange(e){
    //...send the new language to the server
    socket.emit('Language Changed', e.value);
}
//The server will send a message to everyone to update the language of the dropdown:
socket.on('updateLanguage', function(language){
    var languageDropdown = document.getElementById("languageDropdown");
    languageDropdown.value = language;
});

/* ---Canvas and painting the cards--- */
//Create the canvas:
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

//Function to clear the whole canvas:
function clearCanvas(){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

//Painting the initial text at the start:
ctx.font = "28px Arial";
ctx.lineWidth = 1;
ctx.fillStyle = "black";
ctx.textAlign = "center";
ctx.fillText("Click 'New Game' to start (unless you see a countdown)", canvas.width/2, canvas.height/2);

//Preparation for paiting the cards:
var cardCounter;
var cardX, cardName;
var textX, textY;
const gapBtCards = (canvas.width - 5*75)/6;
//Based on: width of cards, canvas width, number of cards (and consequently number of gaps there should be)

//Painting the cards:
function paintCards(cards){
    clearCanvas();
    cardCounter= -1; //keep track of the index of the cards
    //go through each card...
    cards.forEach(card => {
        cardCounter++; //keep track of the index of the cards

        //get the card name:
        cardName = card.name;
        //calculate the card's x based on it's index and the gap between the cards:
        //if index 0: 0*75 + 0*gapBtCards + gapBtCards
        //if index 1: 1*75 + 1*gapBtCards + gapBtCards
        //etc.
        cardX = cardCounter*card.w + cardCounter*gapBtCards + gapBtCards;
        //Send this information to the server so that it updates the x of the card:
        socket.emit('update card.x', {cardName, cardX});
        //update the card's x here:
        card.x = cardX;

        //Declare that you will paint a rectangle with these characteristics of the card:
        ctx.beginPath();
        ctx.rect(card.x, card.y, card.w, card.h);
        if(card.name === "deck"){
            //Set the deck's fill color and paint it as a filled card:
            ctx.fillStyle = card.color;
            ctx.fill();
        }else{
            //Set the lineWidth and stroke colour of other cards and paint them as bordered cards:
            ctx.lineWidth = 3;
            ctx.strokeStyle = card.color;
            ctx.stroke();
        }

        //Set the information for the text of the card and paint it:
        ctx.font = "30px Arial";
        ctx.lineWidth = 1;
        ctx.fillStyle = card.textColor;
        ctx.textAlign = "center";
        textX = (card.x+card.w/2);
        textY = (card.y+card.h/2)+7.5;
        ctx.fillText(card.text, textX, textY);
    });
}

//When the server tells the user to paint cards, call the paint cards function:
socket.on('paintCards', function(cards){
    paintCards(cards);
});

//When the server tells the user to paint a message paint a text of this message:
socket.on('paintMessage', function(msg){
    clearCanvas();
    ctx.font = "20px Arial";
    ctx.lineWidth = 1;
    ctx.fillStyle = "black";
    ctx.textAlign = "center";
    ctx.fillText(msg, canvas.width/2, canvas.height/2);
});

/*
--- Documentation for finding if a click on the page touched an element on a canvas ---
https://lavrton.com/hit-region-detection-for-html5-canvas-and-how-to-listen-to-click-events-on-canvas-shapes-815034d7e9f8/
https://stackoverflow.com/questions/3173448/html5-canvas-find-out-if-click-co-ordinates-are-inside-a-given-rectangle/5481005
*/
//Add an event listener to the canvas for clicks on the canvas:
canvas.addEventListener('click', function(e) {
    //Get the x and y of the click on the page and adjust them to make them relative to the canvas:
    const clickPos = {
        x: e.pageX - canvas.offsetLeft,
        y: e.pageY - canvas.offsetTop
    };

    //Tell the server a card was clicked:
    socket.emit('cardClicked', clickPos);
});


/* ---Starting a game--- */
//When the 'new game' button is clicked...
function newGame(){
    //...tell the server and send the current selected language as well
    var languageDropdown = document.getElementById("languageDropdown");
    socket.emit('newGame', languageDropdown.value);
}

//If the server says more players are need, send an alert:
socket.on('need more players', function(){
    alert("You need at least three players to start");
});

//Tellers will receive a message to show the ready button:
socket.on('show ready button to tellers', function(){
    $("#readyButton").show();
});

//When the 'ready' button is pressed...
function tellerReady(){
    //...tell the server it was pressed
    socket.emit('teller clicked ready');
}

//Everyone will receive a message to hide the teller UI between rounds
socket.on('hide tellers UI', function(){
    $("#readyButton").hide();
    $("#tellerUI").hide();
});

//Tellers will receive a message to show the teller UI at the start of a round
socket.on('show UI to tellers', function(){
    $("#readyButton").hide();
    $("#tellerUI").show();
});

//When this message is received, update the roleStatus with the message received: (teller or guesser)
socket.on('update roleStatus', function(msg){
    $("#roleStatus").text(msg);
});

//When this message is received update the timer's text and colour with the respective information in the timeInfo object:
socket.on('updateTimer', function(timeInfo){
    $("#timer").text(timeInfo.time);
    $("#timer").css("color", timeInfo.color);
})

//When this message is received...
var wordText;
socket.on('show words', function(words){
    //...update the wordList with the format: "1. word <br><br>"
    //where the words are sent by the server
    wordText = "";
    for (i = 0; i < words.length; i++) {
        wordText += (i + 1) + ". " + words[i] + "<br><br>";
    }
    $("#wordList").html(wordText);
});

//When the 'correct' button is pressed...
function correct(){
    //...tell the server it was pressed
    socket.emit('correct is clicked');
}

//When the 'pass' button is pressed...
function pass(){
    //...tell the server it was pressed
    socket.emit('pass is clicked');
}

//When this message is received update the score text with the score sent by the server
socket.on('updateScore', function(score){
    $("#scoreNb").text(score);
});
