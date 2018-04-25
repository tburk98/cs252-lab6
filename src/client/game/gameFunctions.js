var config = {
    apiKey: "AIzaSyAiDkGOGaAkRTTYameiQFJUNMjdOS6ONNc",
    authDomain: "cs252-lab6-2018.firebaseapp.com",
    databaseURL: "https://cs252-lab6-2018.firebaseio.com",
    projectId: "cs252-lab6-2018",
    storageBucket: "cs252-lab6-2018.appspot.com",
    messagingSenderId: "8737404167"
  };
firebase.initializeApp(config);

const preGame = document.getElementById('games')

const dbRef = firebase.database().ref().child('games')

var uid;

function getID() {
    return uid;
}

async function getUsername() {

    var name;
    await firebase.database().ref('users/' + uid).once('value', function(data) {
        if(data.val() != null && data.val().username != null) {
            console.log(data.val());
            name = data.val().username;
        }
        else {
            return "player";
        }
    })

    return name;
}

async function setUsername(name) {
    await firebase.database().ref('users/' + getID()).update({
        username: name,
    });

    return getID();
}

function createGame (gameID, numOfPlayers) {
    console.log("Creating game..");
    firebase.database().ref('games/' + gameID).once('value', function(data) {
        if (data.val() === null) {
            firebase.database().ref('games/' + gameID).set({
                isOpen: true,
                maxPlayers: numOfPlayers,
            });
    
            /*firebase.database().ref('games/' + gameID + '/players/' + socketID).set({
                isDead: false,
                wins: 0,
            })*/
            console.log("Game created!");
            window.location.href = "../game/" + gameID;
            return false;
        }
        else {
             throw "Game already exists!"
        }
    })

}

async function joinGame (gameID) {

    await firebase.database().ref('games/' + gameID).once('value').then(function(data) { 
        if(data.val() == null) {
            throw "Game does not exist.";
        }
        else if (data.val().isOpen == false) {
            throw "Game is not open." ;
        }
        else if(data.val().players == null) {
            firebase.database().ref('games/' + gameID + '/players/' + getID()).set({
                isDead: false,
                wins: 0,
            });
            return 0;
        }
        else if(Object.keys(data.val().players).length >= data.val().maxPlayers) {
            closeGame(gameID);
            throw "Game is full";
        }
        else {
            firebase.database().ref('games/' + gameID + '/players/' + getID()).set({
                isDead: false,
                wins: 0,
            });
            return 0;
        }
    })

}

function closeGame (gameID) {
    firebase.database().ref('games/' + gameID).update({
        isOpen: false,
    });
}

function login() {
    firebase.auth().signInAnonymously().catch(function(error) {
      // Handle Errors here.
      var errorCode = error.code;
      var errorMessage = error.message;
      // ...
    });

    firebase.auth().onAuthStateChanged(function(user) {
      if (user) {
        // User is signed in.
        var isAnonymous = user.isAnonymous;
        uid = user.uid;
        // ...
        console.log(getID());
        firebase.database().ref('users').once('value').then(function(data) { 
            console.log(data);
            if(!(getID() in data.val())) {
                firebase.database().ref('users/' + getID()).set({
                    username: "player",
                    wins: 0,
                });
            }
        })
      } else {
        // User is signed out.
        // ...
      }
      // ...
    });
}

function getWins (gameID, socketID) {

    firebase.database().ref('games/' + gameID + '/players/' + socketID).once('value').then(function(snap) {
        // Do something with wins here
        // data.val().wins
    }, function(error) {
        console.log("error getting wins")
    })

}

function isDead (gameID, socketID) {
    firebase.database().ref('games/' + gameID + '/players/' + socketID).once('value').then(function(snap) {
        // Do something with wins here
        // data.val().isDead
    }, function(error) {
        console.log("error getting wins")
    })
}
