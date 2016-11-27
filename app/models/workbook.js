/**
 * Created by Rachel on 11/25/2016.
 */

var XLSX = require('xlsx-style');


function Workbook() {
    this.SheetNames = [];
    this.Sheets = {};
}

function datenum(v, date1904) {
    if (date1904) v += 1462;
    var epoch = Date.parse(v);
    return (epoch - new Date(Date.UTC(1899, 11, 30))) / (24 * 60 * 60 * 1000);
}

/**
 * Create a sheet from array of arrays. Came from: https://gist.github.com/SheetJSDev/88a3ca3533adf389d13c.
 * @param data the two-dimensional array.
 * @param opts the options.
 * @returns {{}} The sheet.
 */
function sheetFromArrayOfArrays(data, opts) {
    var ws = {};
    var range = {s: {c: 10000000, r: 10000000}, e: {c: 0, r: 0}};
    for (var R = 0; R != data.length; ++R) {
        for (var C = 0; C != data[R].length; ++C) {
            if (range.s.r > R) range.s.r = R;
            if (range.s.c > C) range.s.c = C;
            if (range.e.r < R) range.e.r = R;
            if (range.e.c < C) range.e.c = C;
            var cell = {v: data[R][C]};
            if (cell.v == null) continue;
            var cell_ref = XLSX.utils.encode_cell({c: C, r: R});

            if (typeof cell.v === 'number') {
                cell.t = 'n';
                cell.s = {
                    "alignment": {
                        "horizontal": "right",
                        "vertical": "top"
                    }
                }
            }
            else if (typeof cell.v === 'boolean') cell.t = 'b';
            else if (cell.v instanceof Date) {
                cell.t = 'n';
                cell.z = XLSX.SSF._table[14];
                cell.v = datenum(cell.v);
            }
            else {

                cell.t = 's';
                if (R == 0) {
                    cell.s = {
                        "border": {
                            "bottom": {
                                "style": "thick",
                                "color": {
                                    "auto": 1
                                }
                            }
                        },
                        "font": {
                            bold: true
                        }
                    }
                } else {
                    cell.s = {
                        "alignment": {
                            "wrapText": 1,
                            "horizontal": "left",
                            "vertical": "top"

                        }
                    }
                }
            }

            ws[cell_ref] = cell;
        }
    }
    if (range.s.c < 10000000) ws['!ref'] = XLSX.utils.encode_range(range);

    return ws;
}

Workbook.prototype.addSheetFromArrayOfArrays = function (data, worksheetName, wscols) {
    var ws = sheetFromArrayOfArrays(data);
    if (wscols) {
        ws['!cols'] = wscols;
    }
    /* add worksheet to workbook */
    this.SheetNames.push(worksheetName);
    this.Sheets[worksheetName] = ws;
}


module.exports = Workbook;

