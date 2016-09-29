/**
 * Created by Rachel on 9/28/2016.
 */


function Note(message, creatorId, createDateTime, boardId, id) {
    this.message = message;
    this.creatorId = creatorId;
    this.createDateTime = createDateTime;
    this.boardId = boardId;
    this.id = id;
}

module.exports = Note;