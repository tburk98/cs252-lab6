


const preGame = document.getElementById('games')

const dbRef = firebase.database().ref().child('games')

//dbRef.on('value', data => console.log(data.val()))


function createGame (gameID, socketID) {
    firebase.database().ref('games/' + gameID).once('value', function(data) {
        if (data.val() === null) {
            firebase.database().ref('games/' + gameID).set({
                isOpen: true,
            });
    
            firebase.database().ref('games/' + gameID + '/players/' + socketID).set({
                isDead: false,
                wins: 0,
            })
        }
        else {
             console.log("Game already exists!");
        }
    })

}

function addPlayer(gameID, socketID) {
    firebase.database().ref('games/' + gameID + '/players/' + socketID).set({
        isDead: false,
        wins: 0,
    })
}

function closeGame (gameID) {
    firebase.database().ref('games/' + gameID).set({
        isOpen: false,
    });
}

function joinGame (gameID, socketID) {

    firebase.database().ref('games/' + gameID).once('value').then(function(data) { 
        console.log(data.val().isOpen);
        if (data.val().isOpen == false) {
            console.log("game is not open!");
        }
        else {
            firebase.database().ref('games/' + gameID + '/players/' + socketID).set({
                isDead: false,
                wins: 0,
            });
        }
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
