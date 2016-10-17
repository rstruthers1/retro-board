/**
 * Created by Rachel on 9/25/2016.
 */



function Board(name, ownerId, createdDateTime, id) {
    this.name = name;
    this.ownerId = ownerId;
    this.createdDateTime = createdDateTime;
    this.id = id;
    this.userConnections = [];
}

Board.prototype.addUserConnection = function(userConnection) {
    this.userConnections.push(userConnection);
}

Board.prototype.removeUserConnection = function(socketId) {
    var deleteIndex = -1;
    for (var i = 0 ; i < this.userConnections.length; i++) {
        if (this.userConnections[i].socketId == socketId) {
            deleteIndex = i;
            break;
        }
    }

    if (deleteIndex > -1) {
        this.userConnections.splice(deleteIndex, 1);
    }
}

Board.prototype.printUserConnections = function() {
    console.log("Printing user connections for board");
    for (var i = 0; i < this.userConnections.length; i++) {
        var userConnection = this.userConnections[i];
        console.log("user id: " + userConnection.userId + ", socket id: " + userConnection.socketId);
    }
}

Board.prototype.getUserConnections = function() {
    var uc = [];
    for (var i = 0; i < this.userConnections.length; i++) {
        var userConnection = this.userConnections[i];
        uc.push(userConnection);
    }
    return uc;
}



module.exports = Board;
