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

    function drawSlips(table) {
      var slips = $('th.cgaoSlip');
      var i;
      for( i = 0; i < slips.size(); i++ ) {
        var first = slips.get(i);
        slips.css('background','url("imgd/line_'+ first.offsetWidth+'_'+ (first.offsetHeight)+'.png") no-repeat');
        slips.css('background-width','100%');
        slips.css('background-height','100%');
      }
    }

    function createTitleCell() {
      var numCols = rowsAxis.getColumnCount()-1;
      var numRows = colsAxis.getRowCount()-1;
      if ( colsAxis.getRowCount() <= 0 || rowsAxis.getColumnCount() <= 0) {
        return;
      }

      if ( numRows > 0 && numCols > 0 ) {
        var titleCell = $(document.createElement('th'));
        if (numRows > 1) {
          titleCell.attr('rowSpan', numRows);
        }
        if (numCols > 1) {
          titleCell.attr('colSpan', numCols);
        }
        titleCell.text('\u00A0');
        titleCell.insertBefore(tHead.find('tr:first th:first'));
      }

      for(var i = 0; i < cellSet.axes[1].hierarchies.length; ++i) {
        titleCell = $(document.createElement('th'));
        titleCell.data('hie', cellSet.axes[1].hierarchies[i]);
        titleCell.addClass('rowHierarchy');
        var titleSpan = $(document.createElement('span'));
        titleSpan.addClass('hierarchyHeader');
        titleSpan.text(cellSet.axes[1].hierarchies[i].caption);
        titleSpan.appendTo(titleCell);
        titleCell.insertBefore(tHead.find('tr:eq('+(numRows)+') th:eq('+i+')'));
      }
      $('<th class="cgaoSlip">&nbsp;</th>').insertBefore(tHead.find('tr:eq('+(numRows)+') th:eq('+cellSet.axes[1].hierarchies.length+')'));
    }

    this.setData = function (data) {
      cellSet = data;
      colsAxis.setData(data.axes[0]);
      rowsAxis.setData(data.axes[1]);

      createTitleCell();

      var headers = table.find('.hierarchyHeader');
      headers.draggable({helper:'clone', revertDuration:0, revert:true});
      headers.droppable({
        accept:'.hierarchyHeader',
        drop:function(event,ui){
          var metadataFrom = parent[0].olapGetMetadataAt(ui.draggable);
          var metadataTo = parent[0].olapGetMetadataAt(angular.element(this));
          if ( metadataFrom ) {

            alert(metadataFrom.hierarchy.caption + '->' + metadataTo.hierarchy.caption+' ('+metadataTo.axisOrdinal+')');
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
      drawSlips(table);
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

    table.addClass('cgaoTable table table-striped table-bordered table-hover table-condensed');
    table.appendTo(parent).ready(function(){
      drawSlips(table)
    });
  }

  return CellSetTable;
});
