/**
 * Created by Rachel on 9/28/2016.
 */


function BoardConnection(socketId, boardId, userId) {
    this.socketId = socketId;
    this.boardId = boardId;
    this.userId = userId;
}



module.exports = BoardConnection;
