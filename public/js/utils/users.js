//Creating the user variable:
const users = [];

//Add user info:
function addUser(id, username, room){
    var user = {
        id: id, //this will be their socket.id
        username: username,
        room: room, //this will be the room name they are joigning
        tellerStatus: false,
        ready: false
    }

    //push to users array
    users.push(user);
    //return the user
    return user;
}

//Get a user by its id:
function getUser(id){
    return users.find(user.id === id);
}

//Remove user when they leave:
function userLeave(id){
    //get the index of the user
    const index = users.findIndex(user => user.id === id);

    //If the user is in there (i.e., if the index isn't returned to -1)
    if(index !== -1){
        //remove the user from the user list, and return that user (not the entire array)
        return users.splice(index, 1)[0];
    }
}

//Get users in a certain room:
function getRoomUsers(room){
    //Return each user where the user.room === room of interest.
    return users.filter(user => user.room === room);
}

//Reset teller status:
function resetTellerStatus(room){
    //Get all the users:
    var roomUsers = getRoomUsers(room);
    //Go through each of them and make them not a teller but make them all ready:
    for (var i = 0; i < roomUsers.length; i++) {
        roomUsers[i].tellerStatus = false;
        roomUsers[i].ready = true;
    }
    //Return the room users:
    return roomUsers
}

//Make teller:
function makeTeller(user){
    //Take that user and make them a teller but make them not ready:
    user.tellerStatus = true;
    user.ready = false;
}

//Export the module:
module.exports = {
    addUser,
    getUser,
    userLeave,
    getRoomUsers,
    resetTellerStatus,
    makeTeller
};
