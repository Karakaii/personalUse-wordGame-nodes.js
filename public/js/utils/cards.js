//Build a canvas based on the dimensions of the canvas:
//const canvasWidth = 800;
const cardColor = 'teal';
const canvasHeight = 250;
const centerY = canvasHeight/2;
const cardWidth = 75;
const cardHeight = 125;
const cardY = centerY - 125/2;
const cards = [
    {
        name: "deck",
        text: 26,
        textColor: "white",
        x: 0,
        y: cardY,
        w: cardWidth,
        h: cardHeight,
        color: cardColor,
        status: "deck"
    },
    {
        name: "card1",
        text: "A",
        textColor: "black",
        x: 0,
        y: cardY,
        w: cardWidth,
        h: cardHeight,
        color: cardColor,
        status: "desactivated"
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

function popChoice(array) {
   var randomIndex = Math.floor(Math.random()*array.length);
   return array.splice(randomIndex, 1)[0];
}

function resetCardsAndLetters(){
    //26letters
    //letters = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];

    //Official 20 letters
    letters = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "L", "M", "N", "O", "P", "R", "S", "T", "U", "V"];

    cards.forEach(card => {
        card.x = 0;
        if(card.name === "deck"){
            card.text = letters.length - 4;
        }else{
            card.text = popChoice(letters);
            card.textColor = "black";
            card.status = "desactivated";
        }
    });

    return letters;
}

/*
https://lavrton.com/hit-region-detection-for-html5-canvas-and-how-to-listen-to-click-events-on-canvas-shapes-815034d7e9f8/

https://stackoverflow.com/questions/3173448/html5-canvas-find-out-if-click-co-ordinates-are-inside-a-given-rectangle/5481005
*/
function isIntersect(point, shape) {
    return point.x >= shape.x && point.x <= shape.x + shape.w
         && point.y >= shape.y && point.y <= shape.y + shape.h
      // The click was inside the card
}


function getNewLetters(letters, nbCardsToChange){
    var newLetters = [];

    for (var i = 0; i < nbCardsToChange; i++) {
        newLetters.push(popChoice(letters));
    }

    var lettersObject = {};
    lettersObject.letters = letters;
    lettersObject.newLetters = newLetters;
    return lettersObject;
}

function getDeck(cards){
    //Return each user where the user.room === room of interest.
    return cards.filter(card => card.name === "deck")[0];
}


//export:
module.exports = {
    cards,
    resetCardsAndLetters,
    isIntersect,
    getNewLetters,
    getDeck
};
