define(['jquery'], function ($) {
  function CellSetTable(parent, olapService, CellSetRowsAxis, CellSetColsAxis) {
    var self = this;
    var service = olapService;
    var table = $(document.createElement('table'));
    var tHead = $(document.createElement('thead'));
    var tBody = $(document.createElement('tbody'));
    var rowsAxis, colsAxis;

    tHead.appendTo(table);
    colsAxis = new CellSetColsAxis(tHead);
    colsAxis.setExpandHandler(undrill);
    colsAxis.setCollapseHandler(drill);

    tBody.appendTo(table);
    rowsAxis = new CellSetRowsAxis(tBody);
    rowsAxis.setExpandHandler(undrill);
    rowsAxis.setCollapseHandler(drill);

    function drill(axis, position) {
      olapService.drill(axis == colsAxis ? 0 : 1, position, {
        success: self.setData
      });
    }

    function undrill(axis, position) {
      olapService.undrill(axis == colsAxis ? 0 : 1, position, {
        success: self.setData
      });
    }

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
      colsAxis.setData(data.colsAxis);
      rowsAxis.setData(data.rowsAxis);

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

    this.init = function() {
      service.executeQuery({success: self.setData});
    }

    table.appendTo(parent);
  }

  return CellSetTable;
});
