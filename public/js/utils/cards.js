/* Create all the necessary elements: */
const canvasHeight = 250; //Based on the actual canvas's height
const centerY = canvasHeight/2; //vertical centre
const cardColor = 'teal'; //Change this to change the cards' color
const cardWidth = 75; //Change this to change the cards' width
const cardHeight = 125; //Change this to change the cards' height
const cardY = centerY - 125/2; //Centres the cards vertically
//An array of objects that represent the 5 different types of cards:
const cards = [
    {
        name: "deck", //Can recognise them by their name
        text: 26, //The deck's text is the number of cards left (this is updated with functions)
        textColor: "white",
        //x and y positions to be painted at:
        x: 0,
        y: cardY,
        //width and height to be painted as:
        w: cardWidth,
        h: cardHeight,
        color: cardColor,
        status: "deck" //differentiates it from the other cards
    },
    {
        name: "card1", //Can recognise them by their name
        text: "A", //The letter that will be written on it (this is updated with functions)
        textColor: "black",
        //x and y positions to be painted at:
        x: 0,
        y: cardY,
        //width and height to be painted as:
        w: cardWidth,
        h: cardHeight,
        color: cardColor,
        status: "desactivated" //can either be activated or desactivated (changes with functions)
    },
    {
        name: "card2",
        text: "B",
        textColor: "black",
        x: 0,
        y: cardY,
        w: cardWidth,
        h: cardHeight,
        color: cardColor,
        status: "desactivated"
    },
    {
        name: "card3",
        text: "C",
        textColor: "black",
        x: 0,
        y: cardY,
        w: cardWidth,
        h: cardHeight,
        color: cardColor,
        status: "desactivated"
    },
    {
        name: "card4",
        text: "D",
        textColor: "black",
        x: 0,
        y: cardY,
        w: cardWidth,
        h: cardHeight,
        color: cardColor,
        status: "desactivated"
    }
]

//Function to randomly choose an element from an array (but also removes it):
function popChoice(array) {
    var randomIndex = Math.floor(Math.random()*array.length);
    return array.splice(randomIndex, 1)[0];
}

//Function to reset the cards' properties and to rest the letters variable:
function resetCardsAndLetters(){

    /* Initialise the letters varible */
    //26letters
    //letters = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];

    //Official 20 letters of the game:
    letters = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "L", "M", "N", "O", "P", "R", "S", "T", "U", "V"];

    /* Reset the cards' properties */
    //Go through each card...
    cards.forEach(card => {
        //Set the card's x to 0
        card.x = 0;
        if(card.name === "deck"){
            //Set the deck's text as the number of cards minus 4 (because four are already shown)
            card.text = letters.length - 4;
        }else{
            //Randomly select a letter (and remove it from the letters) and put it as the card's text:
            //Good thing that the deck is the first object because it needs the initial letters.length
            card.text = popChoice(letters);
            //Reset the color to black (it can become red in the game)
            card.textColor = "black";
            //Reset the status to desactivated (it can become activated in the game)
            card.status = "desactivated";
        }
    });

    //Return the letters variable:
    return letters;
}

//Function to assign new letters as the game progresses and some letters are used:
//Need to put the current letters array and the number of letters needed
function getNewLetters(letters, nbCardsToChange){
    //Randomly select as many letters (and remove them from the letters) as demanded by the number of cards that need to be changed:
    var newLetters = [];
    for (var i = 0; i < nbCardsToChange; i++) {
        newLetters.push(popChoice(letters));
    }

    //Return an object with the modified letters array and with the newLetters array that were demanded:
    var lettersObject = {};
    lettersObject.letters = letters;
    lettersObject.newLetters = newLetters;
    return lettersObject;
}

//Function to return the card object which name is "deck":
function getDeck(cards){
    return cards.filter(card => card.name === "deck")[0];
}

/*
--- Documentation for finding if a click on the page touched an element on a canvas ---
https://lavrton.com/hit-region-detection-for-html5-canvas-and-how-to-listen-to-click-events-on-canvas-shapes-815034d7e9f8/
https://stackoverflow.com/questions/3173448/html5-canvas-find-out-if-click-co-ordinates-are-inside-a-given-rectangle/5481005
*/
//Function to check if a click on the page intersects with a card on the canvas:
//Point is the object with the position of the click (modified to make relative to canvas)
//Shape is a card
function isIntersect(point, shape) {
    return point.x >= shape.x && point.x <= shape.x + shape.w
         && point.y >= shape.y && point.y <= shape.y + shape.h
        // The click was inside the card
}

//Export the module:
module.exports = {
    cards,
    resetCardsAndLetters,
    isIntersect,
    getNewLetters,
    getDeck
};
