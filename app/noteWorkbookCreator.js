/**
 * Created by Rachel on 11/25/2016.
 */

var Workbook = require('./models/workbook');
var XLSX = require('xlsx-style');
var moment = require('moment');
var path = require('path');
var fs = require('fs');

var FIVE_MINUTES = 5 * 60 * 1000; /* ms */

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

function deleteOldNoteFiles() {
    var startPath = "./";
    var files = fs.readdirSync(startPath);
    var now = new Date();
    for (var i = 0; i < files.length; i++) {
        var file = files[i];
        if (!(file.startsWith("board-") && file.endsWith(".xlsx"))) {
            continue;
        }
        var filename=path.join(startPath, file);
        var stats = fs.statSync(filename);
        console.log("---------------------------------");
        console.log(filename);
        console.log(stats.mtime);
        if (now - stats.mtime > FIVE_MINUTES) {
            console.log("Older than 5 minutes, deleting");
            fs.unlinkSync(filename);
        } else {
            console.log("Newer that 5 minutes, not deleting");
        }
        console.log("---------------------------------");
    }
}

NoteWorkbookCreator.prototype.createWorkbook = function(notes, boardId, boardName) {
    deleteOldNoteFiles();
    var dateTimeString = moment().format('YYYY-MM-DD-hhmmss');
    var fileName = 'board-' + boardId + "-" + dateTimeString + '.xlsx';
    var data = [];
    for (var i = 0; i < notes.length; i++) {
        var noteRow = [];
        var note = notes[i];
        noteRow.push(note.sectionName);
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

    var wscols = [
        null,
        {wch:50},
        null
    ];

    wb.addSheetFromArrayOfArrays(data, boardName, wscols);

    XLSX.writeFile(wb, './' + fileName);
    return fileName;
}

module.exports = NoteWorkbookCreator;
