/*global define */
define(['jquery', 'lib/jquery-ui'], function ($) {
  function CellSetTable(parent, CellSetRowsAxis, CellSetColsAxis) {
    var self = this,
        cellSet,
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
      var numRows = colsAxis.getRowCount()-1;
      if ( numRows <= 0 ) {
        return;
      }

      var titleCell = $(document.createElement('th'));
      if (colsAxis.getRowCount() > 1) {
        titleCell.attr('rowSpan', numRows);
      }
      if (rowsAxis.getColumnCount() > 1) {
        titleCell.attr('colSpan', rowsAxis.getColumnCount());
      }
      titleCell.text('\u00A0');
      titleCell.insertBefore(tHead.find('tr:first th:first'));

      for(var i = 0; i < cellSet.axes[1].hierarchies.length; ++i) {
        titleCell = $(document.createElement('th'));
        titleCell.data('hie', cellSet.axes[1].hierarchies[i]);
        var titleSpan = $(document.createElement('span'));
        titleSpan.addClass('hierarchyHeader');
        titleSpan.text(cellSet.axes[1].hierarchies[i].caption);
        titleSpan.appendTo(titleCell);
        titleCell.insertBefore(tHead.find('tr:eq('+numRows+') th:eq('+i+')'));
      }
    }

    this.setData = function (data) {
      cellSet = data;
      colsAxis.setData(data.axes[0]);
      rowsAxis.setData(data.axes[1]);

      createTitleCell();

      var headers = table.find('.hierarchyHeader');
      headers.draggable({revert: 'invalid'});
      headers.droppable({
        accept:'.hierarchyHeader',
        drop:function(event,ui){
          var metadataFrom = parent[0].olapGetMetadataAt(ui.draggable);
          var metadataTo = parent[0].olapGetMetadataAt(angular.element(this));
          if ( metadataFrom ) {

            alert(metadataFrom.hierarchy.caption + '->' + metadataTo.hierarchy.caption);
          }
        }
      });


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

    parent[0].olapGetMetadataAt = function(element) {
      if ( !cellSet ) {
        return null; // No cellSet bind
      }

      if ( element && element.get(0).tagName !== 'TH' ) {
        element = element.parents('th');
      }
      if ( !element ) {
        return null;
      }

      var axisOrdinal;
      if ( element.parents('tBody').size() ) {
        axisOrdinal = 1;
      } else if ( element.parents('tHead').size() ) {
        axisOrdinal = 0;
      } else {
        return null;
      }

      var metadata;
      var data = element.data('pos');
      if ( data ) {
        metadata = {
          member: data.member,
          isLeaf: (data.expanded === undefined),
          axisOrdinal: axisOrdinal
        };

        var hierarchyIdx = 0;
        while( data.prevCell ) {
          data = data.prevCell.data('pos');
          hierarchyIdx++;
        }
        metadata.hierarchy = cellSet.axes[axisOrdinal].hierarchies[hierarchyIdx];
      } else if ( (data = element.data('hie')) ) {
        metadata = {
          hierarchy : data
        };
      }

      return metadata;
    }

    table.appendTo(parent);
    table.addClass('cgaoTable table table-striped table-bordered table-hover table-condensed');
  }

  return CellSetTable;
});
