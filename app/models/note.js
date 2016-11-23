/**
 * Created by Rachel on 9/28/2016.
 */


function Note(creatorId, createDateTime, boardId, message, top, left, stickyId, id) {
    this.creatorId = creatorId;
    this.createDateTime = createDateTime;
    this.boardId = boardId;
    this.message = message;
    this.top = top;
    this.left = left;
    this.stickyId = stickyId;
    this.id = id;
    this.userVotes = null;
}

module.exports = Note;