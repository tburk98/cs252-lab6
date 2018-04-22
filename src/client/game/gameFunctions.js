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

//dbRef.on('value', data => console.log(data.val()))


function createGame (gameID) {
    console.log("Creating game..");
    firebase.database().ref('games/' + gameID).once('value', function(data) {
        if (data.val() === null) {
            firebase.database().ref('games/' + gameID).set({
                isOpen: true,
                maxPlayers: 2,
            });
    
            /*firebase.database().ref('games/' + gameID + '/players/' + socketID).set({
                isDead: false,
                wins: 0,
            })*/
            console.log("Game created!");
            window.location.href = "game/" + gameID;
            return false;
        }
        else {
             throw "Game already exists!"
        }
    })

}

async function joinGame (gameID, socketID) {

    await firebase.database().ref('games/' + gameID).once('value').then(function(data) { 
        if(data.val() == null) {
            throw "Game does not exist.";
        }
        else if (data.val().isOpen == false) {
            throw "Game is not open." ;
        }
        else if(data.val().players == null) {
            firebase.database().ref('games/' + gameID + '/players/' + socketID).set({
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
            firebase.database().ref('games/' + gameID + '/players/' + socketID).set({
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
