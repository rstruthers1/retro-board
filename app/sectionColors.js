/**
 * Created by Rachel on 12/2/2016.
 */

var XLSX = require('xlsx-style');


function SectionColors() {
    this.colors = null;
}

SectionColors.prototype.loadColors = function(spreadsheetFilePath) {

    var workbook = XLSX.readFile(spreadsheetFilePath);
    var sheet_name_list = workbook.SheetNames;
    this.colors = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]);
    console.log(this.colors);
}

module.exports = SectionColors;

