const WebSocket = require("ws");

const wss = new WebSocket.Server({port: 3000});

const wsmap = new Map();
const allRooms = new Map();
const party = new Map();
const freeRooms = new Array();
let numberOfRooms = 1000;

console.log("server running");

function tellEverybody() {

}

wss.on("connection", ws => {
    const user = {"nick": "", "room": ""};
    let logged = false;
    let master = false;
    console.log("new client connected");

    ws.on("message", data => {
        const pack = data.toString().split(",");
        console.log(pack);
        switch (pack[0]) {
            case "create":
                if (logged) return;
                //createGame(pack)
                if (freeRooms.length > 0) {
                    user.room = freeRooms.pop();
                } else {
                    numberOfRooms++;
                    user.room = numberOfRooms.toString();
                }

                user.nick = pack[1];
                const pw = pack[2];

                wsmap.set(user.nick + ", " + user.room, ws);
                allRooms.set(user.room, pw);

                let partyArray = new Array();
                partyArray.push(user.nick)
                party.set(user.room, partyArray);

                logged = true;
                master = true;
                ws.send("notifyCreate, " + user.room + ", " + pw)
                break;
            case "join":
                if (logged) return;
                console.log()
                if (!Array.from(party.keys()).includes(pack[2])) {
                    ws.send("notExist");

                    return;
                }
                if (Array.from(party.get(pack[2])).includes(pack[1])) {
                    ws.send("nickUnavailable");

                    return;
                }
                if (allRooms.get(pack[2]) === pack[3]) {
                    user.nick = pack[1];
                    user.room = pack[2];
                    logged = true;

                    wsmap.set(user.nick + ", " + user.room, ws);

                    let oldParty = new String(party.get(user.room));
                    let newParty = party.get(user.room);
                    newParty.push(user.nick);
                    party.set(user.room, newParty)

                    Array.from(party.get(user.room)).forEach((person) => {

                        let peer = {"nick": "", "room": ""};
                        peer.nick = person;
                        peer.room = user.room;


                        if (peer.nick !== user.nick) {
                            wsmap.get(peer.nick + ", " + peer.room).send("notifyJoin, " + user.nick);
                        } else {
                            ws.send("startGuest, " + user.room + ", " + pack[3] + ", " + oldParty);
                        }
                    });


                } else {
                    ws.send("WrongPW");
                }

                break;
            case "diceRoll":
                let dice = parseInt(pack[1]);
                let operator = pack[2];
                let constant = parseInt(pack[3]);
                let result;

                result = getRandomInt(dice) + 1;

                if (operator === "+") {
                    result = result + constant;
                } else if (operator === "-") {
                    result = result - constant;
                }
                Array.from(party.get(user.room)).forEach((person) => {

                    let peer = {"nick": "", "room": ""};
                    peer.nick = person;
                    peer.room = user.room;

                    wsmap.get(peer.nick + ", " + peer.room).send("notifyText," + user.nick + ", " + "rolled: " + result);

                });

                break;
            case "text":
                let fullText = "";
                if (pack.length > 2) {
                    for (let i = 1; i < pack.length; i++) {
                        if (i === pack.length - 1) {
                            fullText = fullText + pack[i];
                        } else {
                            fullText = fullText + pack[i] + ", ";
                        }
                    }
                } else {
                    fullText = pack[1];
                }

                Array.from(party.get(user.room)).forEach((person) => {

                    let peer = {"nick": "", "room": ""};
                    peer.nick = person;
                    peer.room = user.room;

                    wsmap.get(peer.nick + ", " + peer.room).send("notifyText, " + user.nick + ", " + fullText);

                });
                break;
            case "changeSize":
                Array.from(party.get(user.room)).forEach((person) => {

                    let peer = {"nick": "", "room": ""};
                    peer.nick = person;
                    peer.room = user.room;
                    if (peer.nick !== user.nick) {
                        wsmap.get(peer.nick + ", " + peer.room).send("notifyChangeSize," + pack[1]);
                    }
                });
                break;
            case "placeToken":
                Array.from(party.get(user.room)).forEach((person) => {

                    let peer = {"nick": "", "room": ""};
                    peer.nick = person;
                    peer.room = user.room;
                    if (peer.nick !== user.nick) {
                        if (pack.length < 6) {
                            wsmap.get(peer.nick + ", " + peer.room).send("notifyPlaceToken," + pack[1] + "," + pack[2] + "," + pack[3]);

                        } else {
                            wsmap.get(peer.nick + ", " + peer.room).send("notifyPlaceToken," + pack[1] + "," + pack[2] + "," + pack[3] + "," + pack[4] + "," + pack[5]);

                        }
                    }

                });
                break;
            case "removeToken":
                Array.from(party.get(user.room)).forEach((person) => {

                    let peer = {"nick": "", "room": ""};
                    peer.nick = person;
                    peer.room = user.room;
                    if (peer.nick !== user.nick)
                        wsmap.get(peer.nick + ", " + peer.room).send("notifyRemoveToken," + pack[1] + "," + pack[2]);

                });
                break;
            case "newBG":
                Array.from(party.get(user.room)).forEach((person) => {

                    let peer = {"nick": "", "room": ""};
                    peer.nick = person;
                    peer.room = user.room;
                    if (peer.nick !== user.nick)
                        wsmap.get(peer.nick + ", " + peer.room).send("notifyNewBG," + pack[1]);

                });
                break;
            case "newToken":
                Array.from(party.get(user.room)).forEach((person) => {

                    let peer = {"nick": "", "room": ""};
                    peer.nick = person;
                    peer.room = user.room;
                    if (peer.nick !== user.nick)
                        wsmap.get(peer.nick + ", " + peer.room).send("notifyNewToken," + pack[1]);

                });
                break;
            case "loadGame":
                Array.from(party.get(user.room)).forEach((person) => {
                    let peer = {"nick": "", "room": ""};
                    peer.nick = person;
                    peer.room = user.room;
                    if (peer.nick !== user.nick)
                        wsmap.get(peer.nick + ", " + peer.room).send("notifyLoadGame");
                });
                break;
        }

    })

    function getRandomInt(max) {
        return Math.floor(Math.random() * max);
    }

    ws.on("close", () => {

        if (logged) {

            Array.from(party.get(user.room)).forEach((person) => {

                let peer = {"nick": "", "room": ""};
                peer.nick = person;
                peer.room = user.room;

                if (peer.nick !== user.nick) {
                    wsmap.get(peer.nick + ", " + peer.room).send("notifyQuit, " + user.nick);
                }
            });

            party.set(user.room, party.get(user.room).filter(elem => elem !== user.nick));

            if (party.get(user.room).length < 1) {
                freeRooms.push(user.room);
                allRooms.delete(user.room);
                party.delete(user.room);
            }
        }
        //wsmap.delete(user.nick + ", " + user.room, ws);
        wsmap.delete(user.nick + ", " + user.room);

    });
})
;