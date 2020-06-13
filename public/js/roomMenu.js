//The button at the botton of the form will call this function to create the room:
function createRoom(){
    //Get the form:
    var createForm = document.getElementById("createForm");
    //Escape the different inputs' values:
    var createUsernameValue = escape(createForm.elements.createUsername.value);
    var createRoomIdValue = escape(createForm.elements.createRoomId.value);
    //Check that the inputs are not empty:
    if (createRoomIdValue != "" && createUsernameValue != "") {
        //Send the escaped inputs' values back to the inputs:
        createForm.elements.createUsername.value = createUsernameValue;
                createForm.elements.createUsername.value = createUsernameValue;
        createForm.elements.createRoomId.value = createRoomIdValue;
        //submits the information and uses the form's action to send to /gameRoom.html/
        createForm.submit();
    }else{
        //Error alert
        alert("The fields are not entered correctly. Please try again");
        return false;
    }
}

//When a key is pressed in the document...
document.onkeypress = function(e){
    //If this key is the "Enter" key...
    if(e.key === "Enter"){
        //Call the function to create the room:
        createRoom();
    }
};
