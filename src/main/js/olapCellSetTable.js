/*global define */
define(['jquery'], function ($) {
  function CellSetTable(parent, CellSetRowsAxis, CellSetColsAxis) {
    var self = this,
        table = $(document.createElement('table')),
        tHead = $(document.createElement('thead')),
        tBody = $(document.createElement('tbody')),
        rowsAxis, colsAxis,
        drillHandler, undrillHandler;

    function drill(axis, position) {
      if ( drillHandler ) {
        drillHandler(self, axis === colsAxis ? 0 : 1, position);
      }
    }

    function undrill(axis, position) {
      if ( undrillHandler ) {
        undrillHandler(self, axis === colsAxis ? 0 : 1, position);
      }
    }

    tHead.appendTo(table);
    colsAxis = new CellSetColsAxis(tHead);
    colsAxis.setExpandHandler(undrill);
    colsAxis.setCollapseHandler(drill);

    tBody.appendTo(table);
    rowsAxis = new CellSetRowsAxis(tBody);
    rowsAxis.setExpandHandler(undrill);
    rowsAxis.setCollapseHandler(drill);

    function createTitleCell() {
      var titleCell = $(document.createElement('th'));
      if (colsAxis.getRowCount() > 1) {
        titleCell.attr('rowSpan', colsAxis.getRowCount());
      }
      if (rowsAxis.getColumnCount() > 1) {
        titleCell.attr('colSpan', rowsAxis.getColumnCount());
      }
      titleCell.text('\u00A0');
      titleCell.insertBefore(tHead.find('tr:first th:first'));
    }

    this.setData = function (data) {
      colsAxis.setData(data.axes[0]);
      rowsAxis.setData(data.axes[1]);

      createTitleCell();

      var r, c;
      for (r = 0; r < data.data.length; ++r) {
        var dataRow = data.data[r];
        var row = tBody.children('tr:eq(' + r + ')');
        for (c = 0; c < dataRow.length; c++) {
          var cell = $(document.createElement('td'));
          cell.text(dataRow[c]);
          cell.appendTo(row);
        }
      }
    };

    this.setDrillHandlers = function(drill, undrill) {
      drillHandler = drill;
      undrillHandler = undrill;
    };

    table.appendTo(parent);
  }

  return CellSetTable;
});
