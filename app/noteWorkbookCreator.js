/**
 * Created by Rachel on 11/25/2016.
 */

var Workbook = require('./models/workbook');
var XLSX = require('xlsx');
var moment = require('moment');

function NoteWorkbookCreator() {

}

function NoteRowComparator(a, b) {
    // Compare section names first
    if (a[0] == null && b[0] != null) {
        return -1;
    }

    if (a[0] != null && b[0] == null) {
        return 1;
    }
    if (!(a[0] == null && b[0] == null)) {
        if (a[0] < b[0]) {
            return -1;
        }
        if (a[0] > b[0]) {
            return 1;
        }
    }

    // section names are equal, sort by vote desc
    if (a[2] > b[2]) {
        return -1;
    }
    if (a[2] < b[2]) {
        return 1;
    }
    return 0;
}

NoteWorkbookCreator.prototype.createWorkbook = function(notes, boardId, boardName) {
    var dateTimeString = moment().format('YYYY-MM-DD-h-mm-ss');
    var fileName = 'board-' + boardId + "-" + dateTimeString + '.xlsx';
    var data = [];
    for (var i = 0; i < notes.length; i++) {
        var noteRow = [];
        var note = notes[i];
        noteRow.push(note.section);
        noteRow.push(note.message);
        var voteCount = 0;
        if (note.userVotes) {
            voteCount = note.userVotes.length;
        }
        noteRow.push(voteCount);
        data.push(noteRow);
    }

    data = data.sort(NoteRowComparator);
    data.unshift(['Section', 'Message', 'Votes']);

    var wb = new Workbook();
    wb.createSheetFromArrayOfArrays(data, boardName);

    XLSX.writeFile(wb, './' + fileName);
    return fileName;
}

module.exports = NoteWorkbookCreator;
