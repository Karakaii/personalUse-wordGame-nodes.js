/* ---------Initial preparations--------- */
// Creating the express app and the socket.io server:
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const app = express(); //create express app
const server = http.createServer(app); //create the server from the express app
const io = socketio(server); //create the socket on the server side

//Setting the file paths:
//const path = require('path');
app.use(express.static(__dirname + '/public'));

//Getting the users module:
const {addUser, getUser, userLeave, getRoomUsers, resetTellerStatus, makeTeller} = require('./public/js/utils/users');

//Getting the cards module:
const {cards, resetCardsAndLetters, isIntersect, getNewLetters, getDeck} = require('./public/js/utils/cards');
var letters = resetCardsAndLetters(); //setting all the cards and the letters
var initialNbLetters = letters.length; //get how many cards there were to start with

/* ---------Preparing elements for the game--------- */
//Getting the text for the words:
const fs = require('fs');
var englishWords = fs.readFileSync('./public/ressources/english2.txt', 'utf8');
englishWords = englishWords.split("\n"); //english words
var frenchWords = fs.readFileSync('./public/ressources/francais.txt', 'utf8');
frenchWords = frenchWords.split("\n"); //french words
var wordList; //preparing a variable to hold the word array
const words = []; //preparing an array to hold the words presented to the teller
const minLetterLength = 4; //words will have to be minimum this number of letters

//Prepare information for the tellers:
//initial teller positions
const tellerPositions = {
    first: -1,
    second: -0,
};
const tellers = []; //preparing an array to hold the tellers' user objects

var i; //preparing i for loops

//Prepare elements for the timer
var timer, currentTime, newTime;
//This is the object for when the timer is set to a black "Timer" in between games
const textTimer = {
    time: 'Timer',
    color: 'black'
};
//This is the object that sets the timer at the start of a game:
const initialTimeInfo = {
    time: 100, //1min and 40s
    color: 'black'
};
//This is the object that will hold new timer info as it comes along:
const timeInfo = {};

//Preparing elements for the score
var score = 0; //Preparing the score variable
//Messages to show at the end of the game:
const endGameMessages = {
    bad: "Hm... You can only get better!",
    mediocre: "It's only the beginning... I hope",
    okay: "This is starting to get decent.",
    good: "This a good score, close to victory!",
    genius:  "Well done champions!"
}

/* ---------Getting the port and launching the app--------- */
const localPort = 3000;
const PORT = process.env.PORT || localPort; //detect if it is uploaded on a server or if it is local
server.listen(PORT, function(){
    console.log(`Server running on port ${PORT}`);
    var serverURL = "";
    if (PORT === localPort) {
        serverURL += `http://localhost:${PORT}/`;
    }else {
        serverURL += PORT;
    }
    console.log("Server should be available at: " + serverURL);
});


/* ---------Run on client connection--------- */
io.on('connection', function(socket){

    //Message and log on connection:
    socket.emit('message', 'Welcome');
    console.log('New connection');



    //Listen for room info:
    socket.on('joinRoom', function({username, roomId}){
        //Add the user object and get the user object
        const user = addUser(socket.id, username, roomId);

        //Join this user to the room entered:
        socket.join(user.room);

        //Get the room users:
        var roomUsers = getRoomUsers(user.room);
        //Tell them the other users to update their playerList
        io.in(user.room).emit('updatePlayerList', roomUsers);

        //When user disconnects>
        socket.on('disconnect', function(){
            //Get the user that left
            const user = userLeave(socket.id);
            //If that user exists
            if(user){
                console.log(user.username, "disconnected");

                //Tell them the other users to update their playerList
                io.in(user.room).emit('updatePlayerList', roomUsers);
            }
        });

        //If the server hears that the language was changed:
        socket.on('Language Changed', function(language){
            //Send that language to all the other users in the room so they can change their language dropdown:
            socket.to(user.room).emit('updateLanguage', language);
        });

        //When newGame is clicked:
        socket.on('newGame', function(language){

            //Set the worldList according to the language sent when newGame was clicked:
            if(language === "english"){
                wordList = englishWords;
            }else if(language === "francais"){
                wordList = frenchWords;
            }

            //Check the users in the room, there needs to be at least 3 to play:
            var roomUsers = getRoomUsers(user.room);
            if(roomUsers.length > 2){
                //If more than 3, call the function that starts and new game (and pass the user in)
                startNewGame(user);
            }else{
                //If not, send a message that will create an alter for everyone that they need more than two player:
                io.in(user.room).emit('need more players');
            }
        });

        //Once the round is prepared we are waiting on the tellers to click that they are ready before we start.
        //When tellers click the ready button:
        socket.on('teller clicked ready', function(){
            user.ready = true; //Set that user as ready

            //Get all the users in the room and check their ready status
            var roomUsers = getRoomUsers(user.room);
            var startRound = true;
            for (i = 0; i < roomUsers.length; i++) {
                if (!roomUsers[i].ready){
                    //if one is not ready (user.ready = false), set the startRound to false
                    startRound = false;
                }
            }

            //If startRound hasn't been changed to false, call the function that will start the round (gameplay, this is after the prepartion) (and pass the user in)
            if(startRound){newRoundStart(user);}
        });

        //When the cards a painted, update their x:
        socket.on('update card.x', function({cardName, cardX}){
            //Go through each card and if the card name sent by the users matches, update the x.
            cards.forEach(card => {
                if(card.name === cardName){
                    card.x = cardX;
                }
            });
        });

        //When a card is clicked:
        socket.on('cardClicked', function(clickPos){
            //only if the user is a teller...
            if(user.tellerStatus){
                //go through each card...
                cards.forEach(card => {
                    //if the click position intersects with the card position AND it is desactivated...
                    if(isIntersect(clickPos, card) && card.status === "desactivated"){
                        card.status = "activated"; //make it activated
                        card.textColor = "red"; //make its text red
                        //Tell all the users in the room to paint the cards:
                        io.in(user.room).emit('paintCards', cards);
                    }
                });
            }
        });

        //When 'correct' is clicked:
        socket.on('correct is clicked', function(){
            //only if the user is a teller...
            if(user.tellerStatus){
                //call the function to update the score (and pass the user in)
                updateScore(user);
            }
        });

        //When 'pass' is clicked:
        socket.on('pass is clicked', function(){
            //only if the user is a teller...
            if(user.tellerStatus){
                //call the function to generate new words (and pass the user in)
                generateNewWords(user);
            }
        });

    }); //End of join room
}); //End of connection

/* ---------Function for the game--------- */

//Function to start a new game:
function startNewGame(user){
    score = 0; //Set the score to 0
    //Tell everyone in the room to update the score:
    io.in(user.room).emit('updateScore', score);
    //Tell everyone in the room to hide the teller ui:
    io.in(user.room).emit('hide tellers UI');

    //Reset the cards and letters and get the letters:
    letters = resetCardsAndLetters();

    //Call the function that will make the teller positions as default:
    resetTellerPosition();

    //Call the function that resets the timer to its default ("Timer" in black):
    resetTimer(user);

    //Start the preparation of the new round:
    newRoundPrep(user);
}

//Make the tellerPositions as the default (called in newGame();):
function resetTellerPosition(){
    tellerPositions.first = -1;
    tellerPositions.second = 0;
}

//Update the tellerPositions to move the tellers (called in newRoundPrep();):
function updateTellerPosition(roomUsers){
    if(tellerPositions.first >= roomUsers.length-1){
        //If the first teller position is equal to the last index of the number of room users:
        tellerPositions.first = 0; //first
        tellerPositions.second = 1; //second
    }else if(tellerPositions.second >= roomUsers.length-1){
        //If the second teller position is equal to the last index of the number of room users:
        tellerPositions.first = roomUsers.length-1; //last
        tellerPositions.second = 0; //first
    }else{
        //Otherwise, increment the teller positions:
        tellerPositions.first++;
        tellerPositions.second++;
    }
}

//Function for preparing the round (called in newGame();):
function newRoundPrep(user){
    //??Need to put an ability to restart the round if there is a drop to < 3 players??

    //Tell everyone to hide the teller UI as this is the start of a new round:
    io.in(user.room).emit('hide tellers UI');

    //select tellers://
    //Set everyone to a non teller and get the roomUsers:
    var roomUsers = resetTellerStatus(user.room);
    //Update the tellerPosition:
    updateTellerPosition(roomUsers);
    //Use the teller positions as indexes in the roomUsers array to select the two users to make as tellers:
    makeTeller(roomUsers[tellerPositions.first]);
    makeTeller(roomUsers[tellerPositions.second]);
    //Tell them the other users to update their playerList (it will put * next to the teller names)
    io.in(user.room).emit('updatePlayerList', roomUsers);
    //Update the tellers array:
    tellers.length = 0; //empty the array of previous tellers
    tellers.push(roomUsers[tellerPositions.first]); //push the first teller
    tellers.push(roomUsers[tellerPositions.second]); //push the second teller

    //Emit to the two tellers by using their user object in the tellers array, which contain their socket.id: Show the ready button.
    io.to(tellers[0].id).to(tellers[1].id).emit('show ready button to tellers');

    //Go through the users in the room:
    for (i = 0; i < roomUsers.length; i++) {
        if(roomUsers[i].tellerStatus){
            //If they are a teller tell them to update the role status as a TELLER
            io.to(roomUsers[i].id).emit('update roleStatus', "You are a TELLER");
        }else{
            //If they are not a teller tell them to update the role status as a GUESSER
            io.to(roomUsers[i].id).emit('update roleStatus', "You are a GUESSER");
        }
    }

    //First paint//
    var deck = getDeck(cards); //get the deck
    if(deck.text == initialNbLetters){
        //If the deck has the number of initial letters it is supposed to have it means it is the first round. Hence, paint a message telling all the users in the room to wait for the tellers to click ready.
        io.in(user.room).emit('paintMessage', 'Waiting for tellers to click READY');
    }else{
        //If it is not the first round, tell all the users in the room to paint the cards.
        io.in(user.room).emit('paintCards', cards);
    }


    //Now it waits for tellers to confirm by pressing the ready button//
    //See socket.on('teller clicked ready')
}

//Function to start a new round (gameplay, not the preparation) (call in socket.on('teller clicked ready') and updateCards();)
function newRoundStart(user){
    //Words
    generateWords(); //generate the words
    io.to(tellers[0].id).to(tellers[1].id).emit('show words', words); //send them to the tellers

    //Cards
    io.in(user.room).emit('paintCards', cards); //tell all the users in the room to paint the cards.

    //UI
    io.to(tellers[0].id).to(tellers[1].id).emit('show UI to tellers'); //Tell the tellers to show the UI

    //Timer
    clearInterval(timer); //stop the timer
    //Tell everyone in the room to set the timer to its start time and colour (e.g., black '100')
    io.in(user.room).emit('updateTimer', initialTimeInfo);
    //Set new time to this initial time
    newTime = initialTimeInfo.time;
    //Call a function that starts the timer:
    startTimer(user);
}

//Function that starts the timer and uses the user object (needs to be like this)
function startTimer(user){
    //Set the timer to be an interval that fires a function every 1000ms (1s)
    timer = setInterval(function(){
        currentTime = newTime; //set the current time to the newTime
        newTime = currentTime -1; //decrease the newTime

        //Monitor what the newTime will be:
        if(newTime < 11 && newTime > 0){
            //If the new time is between 10 and 1, set the time info to red 'newTime'
            timeInfo.time = newTime;
            timeInfo.color = "red";
        }else if(newTime < 0){
            //If the new time is below 0, set the time info to red '0'
            clearInterval(timer);
            timeInfo.time = 0;
            timeInfo.color = "red";
            //Call the function that update the cards and starts a new round:
            updateCards(user);
        }else{
            //Otherwise, set the time info to black 'newTime'
            timeInfo.time = newTime;
            timeInfo.color = "black";
        }
        //Tell every user in the room to update their timer
        io.in(user.room).emit('updateTimer', timeInfo);
    }, 1000);
}

//Function that stops the timer and tells every user to set it to black 'Timer'
function resetTimer(user){
    clearInterval(timer);
    io.in(user.room).emit('updateTimer', textTimer);
}

//Function to randomly choose an element from an array (but also removes it):
function popChoice(array) {
   var randomIndex = Math.floor(Math.random()*array.length);
   return array.splice(randomIndex, 1)[0];
}

//Function that generates three words:
function generateWords(){
    words.length = 0; //empty the words
    var isWordIllegal;
    //for 3 words
    for (i = 0; i < 3; i++) {
        //Start the loop to check
        isWordIllegal = true;
        while(isWordIllegal){
            //Select a word (and delete it from the array)
            newWord = popChoice(wordList);
            //If it is not already in the words array (redundant with popChoice but in case) AND
            //if it is equal or about the minimum number of letters...
            if(!words.includes(newWord) && newWord.length >= minLetterLength){
                isWordIllegal = false; //...break the loop
            }
        }
        //...and add the word:
        words.push(newWord);
    }
}

//Function to update score (called in socket.on('correct is clicked'))
function updateScore(user){
    score++; //increment the score
    io.in(user.room).emit('updateScore', score); //tell every user in the room to update the score
    //Call this function that will change the words of the tellers:
    generateNewWords();
}

//Function to change the words of the tellers (called in socket.on('correct is clicked') or updateScore();)
function generateNewWords(){
    generateWords(); //get new words
    io.to(tellers[0].id).to(tellers[1].id).emit('show words', words); //show them to the tellers
}

//Function that will update the cards (called in startTimer(); when the timer reaches 0)
function updateCards(user){
    //Get the number of cards that need to be changed (each card that has been activated)
    var nbCardsToChange = 0;
    cards.forEach(card => {
        if(card.status === "activated"){
            nbCardsToChange++;
        }
    });

    //Get new letters according to the number of cards needed to be changed
    var lettersObject = getNewLetters(letters, nbCardsToChange);
    letters = lettersObject.letters;

    //Go back through all the cards, to update the letters of the cards that need to be updated:
    var countChangedCards = -1; //keep track of the index of cards being updated
    cards.forEach(card => {
        if(card.status === "activated"){
            //If the card is activated it is a card that need to be updated
            countChangedCards++;

            //Get its new letter by using the number of cards currently updated as an index
            card.text = lettersObject.newLetters[countChangedCards];
            card.status = "desactivated"; //desactivate the card
            card.textColor = "black"; //make the text black
        }else if(card.name === "deck"){
            //Update the deck to reduce it's number by the number of cards that need to be updated
            card.text = card.text-nbCardsToChange;
        }
    });

    //Get the deck and check its text
    var deck = getDeck(cards);
    if(deck.text < 0){
        //if it is below 0, call the end of the game
        endGame(user);
    }else{
        //otherwise call a new round
        newRoundPrep(user);
    }
}

//Function for the end of the game:
function endGame(user){
    //Tell every user in the room to hide the teller UI
    io.in(user.room).emit('hide tellers UI');

    //Get the endGame text based on the score:
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

    //Tell every user to paint the endGame text:
    io.in(user.room).emit('paintMessage', endGameText);
}
