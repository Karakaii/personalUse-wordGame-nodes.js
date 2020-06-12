/* ---------Preparation--------- */
// Creating the express app and the socket.io server:
const http = require('http');
const express = require('express');
const socketio = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketio(server);
//io.setMaxListeners(20);

//Setting the file paths:
const path = require('path');
app.use(express.static(__dirname + '/public'));
//app.use('/jsPsych', express.static(__dirname + "/jsPsych"));

const {addUser, getUser, userLeave, getRoomUsers, resetTellerStatus, makeTeller} = require('./public/js/utils/users');

const {cards, resetCardsAndLetters, isIntersect, getNewLetters, getDeck} = require('./public/js/utils/cards');
var letters;
letters = resetCardsAndLetters();
var initialNbLetters = letters.length;

var gameLanguage;
const fs = require('fs');
var englishWords = fs.readFileSync('./public/ressources/english2.txt', 'utf8');
englishWords = englishWords.split("\n");

var frenchWords = fs.readFileSync('./public/ressources/francais.txt', 'utf8');
frenchWords = frenchWords.split("\n");


var wordList;
const words = [];
const minLetterLength = 4;

const tellerPositions = {
    first: -1,
    second: -0,
};
const tellers = [];

var i;
var timer, currentTime, newTime;
const textTimer = {
    time: 'Timer',
    color: 'black'
};
const initialTimeInfo = {
    time: 100, //maybe make 100
    color: 'black'
};
const timeInfo = {};

var score = 0;
const endGameMessages = {
    bad: "Hm... You can only get better!",
    mediocre: "It's only the beginning... I hope",
    okay: "This is starting to get decent.",
    good: "This a good score, close to victory!",
    genius:  "Well done champions!"
}

//Geting the port and launching the app:
const localPort = 3000;
const PORT = process.env.PORT || localPort;
var globalHold = {};
server.listen(PORT, function(){
    console.log(`Server running on port ${PORT}`);

    var serverURL = "";
    if (PORT === localPort) {
        serverURL += `http://localhost:${PORT}/`;
    }else {
        serverURL += PORT;
    }
    console.log("Server should be available at: " + serverURL);
    //globalHold.serverURL = serverURL;
});

/*app.get('/', function(request, response) {
    response.sendFile('index.html', { root: path.join(__dirname, 'public') });
});*/

/*
app.get('/gameRoom.html/', function(request, response) {
    response.sendFile('gameRoom.html', { root: path.join(__dirname, 'public') });
});*/

/* ---------Run on client connection--------- */

io.on('connection', function(socket){

    //Message and log on connection:
    socket.emit('message', 'Welcome');
    console.log('New connection');



    //Listen for room info:
    socket.on('joinRoom', function({username, roomId}){
        const user = addUser(socket.id, username, roomId);

        socket.join(user.room);

        var roomUsers = getRoomUsers(user.room);

        //Send to everyone
        io.in(user.room).emit('updatePlayerList', roomUsers);

        /*
        //Send to everyone but the personne who just joined
        socket.to(user.room).emit('give me html status');

        socket.on('return html status', function(html){
            //Send to everyone
            io.in(user.room).emit('update your html', roomUsers);
        });*/

        //When user disconnects>
        socket.on('disconnect', function(){
            //Get the user that left
            const user = userLeave(socket.id);
            //If that user exists
            if(user){
                console.log(user.username, "disconnected");

                var roomUsers = getRoomUsers(user.room);

                io.in(user.room).emit('updatePlayerList', roomUsers);
            }
        });

        socket.on('Language Changed', function(language){
            socket.to(user.room).emit('updateLanguage', language);
        });

        //When newGame is clicked:
        socket.on('newGame', function(language){

            if(language === "english"){
                wordList = englishWords;
            }else if(language === "francais"){
                wordList = frenchWords;
            }


            var roomUsers = getRoomUsers(user.room);
            if(roomUsers.length > 2){
                startNewGame(user);
            }else{
                //need more than two player:
                io.in(user.room).emit('need more players');
            }
        });

        //When tellers click ready:
        socket.on('teller clicked ready', function(){
            user.ready = true;
            var roomUsers = getRoomUsers(user.room);

            var startRound = true;
            for (i = 0; i < roomUsers.length; i++) {
                if (!roomUsers[i].ready){
                    startRound = false;
                }
            }

            if(startRound){newRoundStart(user);}
        });

        //When the cards a painted, update their x:
        socket.on('update card.x', function({cardName, cardX}){
            cards.forEach(card => {
                if(card.name === cardName){
                    card.x = cardX;
                }
            });
        });

        //When a card is clicked:
        socket.on('cardClicked', function(clickPos){
            if(user.tellerStatus){
                cards.forEach(card => {
                    if(isIntersect(clickPos, card) && card.status === "desactivated"){

                        card.status = "activated";
                        card.textColor = "red";

                        io.in(user.room).emit('paintCards', cards);
                    }
                });
            }
        });

        //When 'correct' is clicked:
        socket.on('correct is clicked', function(){
            if(user.tellerStatus){
                updateScore(user);
            }
        });

        //When 'pass' is clicked:
        socket.on('pass is clicked', function(){
            if(user.tellerStatus){
                generateNewWords(user);
            }
        });


    }); //End of join room
}); //End of connection

function startNewGame(user){
    score = 0;
    io.in(user.room).emit('updateScore', score);

    io.in(user.room).emit('hide tellers UI');

    letters = resetCardsAndLetters();

    resetTellerPosition();
    resetTimer(user);

    newRoundPrep(user);
}

function resetTellerPosition(){
    tellerPositions.first = -1;
    tellerPositions.second = 0;
}

function updateTellerPosition(roomUsers){
    if(tellerPositions.first >= roomUsers.length-1){
        tellerPositions.first = 0;
        tellerPositions.second = 1;
    }else if(tellerPositions.second >= roomUsers.length-1){
        tellerPositions.first = roomUsers.length-1;
        tellerPositions.second = 0;
    }else{
        tellerPositions.first++;
        tellerPositions.second++;
    }

}

function newRoundPrep(user){
    //Need to put an ability to restart the round if there is a drop to < 3 players.

    io.in(user.room).emit('hide tellers UI');

    //select tellers:
    var roomUsers = resetTellerStatus(user.room);

    updateTellerPosition(roomUsers);

    makeTeller(roomUsers[tellerPositions.first]);
    makeTeller(roomUsers[tellerPositions.second]);

    //Send to everyone
    io.in(user.room).emit('updatePlayerList', roomUsers);

    tellers.length = 0;
    tellers.push(roomUsers[tellerPositions.first]);
    tellers.push(roomUsers[tellerPositions.second]);

    io.to(tellers[0].id).to(tellers[1].id).emit('show ready button to tellers');

    for (i = 0; i < roomUsers.length; i++) {
        if(roomUsers[i].tellerStatus){
            io.to(roomUsers[i].id).emit('update roleStatus', "You are a TELLER");
        }else{
            io.to(roomUsers[i].id).emit('update roleStatus', "You are a GUESSER");
        }
    }

    //conditional it
    var deck = getDeck(cards);
    if(deck.text == initialNbLetters){
        io.in(user.room).emit('paintMessage', 'Waiting for tellers to click READY');
    }else{
        io.in(user.room).emit('paintCards', cards);
    }


    //wait for tellers to confirm:
}

function newRoundStart(user){
    //words
    generateWords();
    io.to(tellers[0].id).to(tellers[1].id).emit('show words', words);

    //Cards
    io.in(user.room).emit('paintCards', cards);

    //UI
    io.to(tellers[0].id).to(tellers[1].id).emit('show UI to tellers');

    //timer
    clearInterval(timer);
    io.in(user.room).emit('updateTimer', initialTimeInfo);
    newTime = initialTimeInfo.time;
    startTimer(user);

    //rules
}

function startTimer(user){
    timer = setInterval(function(){
        currentTime = newTime;
        newTime = currentTime -1;
        if(newTime < 11 && newTime > 0){
            timeInfo.time = newTime;
            timeInfo.color = "red";
        }else if(newTime < 0){
            clearInterval(timer);
            timeInfo.time = 0;
            timeInfo.color = "red";
            updateCards(user);
        }else{
            timeInfo.time = newTime;
            timeInfo.color = "black";
        }
        io.in(user.room).emit('updateTimer', timeInfo);
    }, 1000);
}

function resetTimer(user){
    clearInterval(timer);
    io.in(user.room).emit('updateTimer', textTimer);
}

//Function to randomly choose an element from an array (and take it out):
function popChoice(array) {
   var randomIndex = Math.floor(Math.random()*array.length);
   return array.splice(randomIndex, 1)[0];
}


function generateWords(){
    words.length = 0;
    var isWordIllegal;
    for (i = 0; i < 3; i++) {
        isWordIllegal = true;
        while(isWordIllegal){
            newWord = popChoice(wordList);
            if(!words.includes(newWord) && newWord.length >= minLetterLength){
                isWordIllegal = false;
            }
        }
        words.push(newWord);
    }
}

function updateScore(user){
    score++;
    io.in(user.room).emit('updateScore', score);
    generateNewWords();
}

function generateNewWords(){
    generateWords();
    io.to(tellers[0].id).to(tellers[1].id).emit('show words', words);
}

function updateCards(user){
    var nbCardsToChange = 0;
    cards.forEach(card => {
        if(card.status === "activated"){
            nbCardsToChange++;
        }
    });

    var lettersObject = getNewLetters(letters, nbCardsToChange);
    letters = lettersObject.letters;

    var countChangedCards = -1;
    cards.forEach(card => {
        if(card.status === "activated"){
            countChangedCards++;

            card.text = lettersObject.newLetters[countChangedCards];
            card.status = "desactivated";
            card.textColor = "black";
        }else if(card.name === "deck"){
            card.text = card.text-nbCardsToChange;
        }
    });

    var deck = getDeck(cards);
    if(deck.text < 0){
        endGame(user);
    }else{
        newRoundPrep(user);
    }
}

function endGame(user){
    io.in(user.room).emit('hide tellers UI');
    var endGameText = score + ": ";

    if(score < 10){
        endGameText += endGameMessages.bad;
    }else if(score < 20){
        endGameText += endGameMessages.mediocre;
    }else if(score < 25){
        endGameText += endGameMessages.okay;
    }else if(score < 30){
        endGameText += endGameMessages.good;
    }else{// score is 30+
        endGameText += endGameMessages.genius;
    }

    io.in(user.room).emit('paintMessage', endGameText);
}
