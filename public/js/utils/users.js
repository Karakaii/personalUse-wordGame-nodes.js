var users = [];

//add user info:
function addUser(id, username, room){
    var user = {
        id: id,
        username: username,
        room: room,
        tellerStatus: false,
        ready: false
    }

    users.push(user);
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

//Change tellerStatus:

//Reset teller status:
function resetTellerStatus(room){
    var roomUsers = getRoomUsers(room);

    for (var i = 0; i < roomUsers.length; i++) {
        roomUsers[i].tellerStatus = false;
        roomUsers[i].ready = true;
    }

    return roomUsers
}

//Make teller:
function makeTeller(user){
    user.tellerStatus = true;
    user.ready = false;
}



module.exports = {
    addUser,
    getUser,
    userLeave,
    getRoomUsers,
    resetTellerStatus,
    makeTeller
};
