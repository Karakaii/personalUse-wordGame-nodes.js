function createRoom(){
    var createForm = document.getElementById("createForm");

    var createUsernameValue = escape(createForm.createUsername.value);
    var createRoomIdValue = escape(createForm.elements.createRoomId.value);
    if (createRoomIdValue != "" && createUsernameValue != "") {
        var roomInfo = {
            username: createUsernameValue,
            roomId: createRoomIdValue,
        };
        createForm.submit();
    }else{
        //Error alert
        alert("The fields are not entered correctly. Please try again");
        return false;
    }
}

document.onkeypress = function(e){
    if(e.key === "Enter"){
        createRoom();
    }
};
