/*global define */
define(['jquery', 'lib/jquery-ui'], function ($) {
  var dropHighlightH = ['cgaoDropLeft','cgaoDropRight'];
  var dropHighlightV= ['cgaoDropTop','cgaoDropBottom'];

  function CellSetTable(parent, CellSetRowsAxis, CellSetColsAxis) {
    var self = this,
        cellSet,
        table = $(document.createElement('table')),
        tHead = $(document.createElement('thead')),
        tBody = $(document.createElement('tbody')),
        rowsAxis, colsAxis,
        drillHandler, undrillHandler,
        moveHandler;

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

    function move(hierarchy, axis, position) {
      if ( moveHandler ) {
        moveHandler(self, hierarchy, axis, position)
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

    function drawSlides(table) {
      var slides = $('th.cgaoSlide');
      var i;
      for( i = 0; i < slides.size(); i++ ) {
        var first = slides.get(i);
        slides.css('background','url("imgd/line_'+ first.offsetWidth+'_'+ (first.offsetHeight)+'.png") no-repeat');
        slides.css('background-width','100%');
        slides.css('background-height','100%');
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
      $('<th class="cgaoSlide">&nbsp;</th>').insertBefore(tHead.find('tr:eq('+(numRows)+') th:eq('+cellSet.axes[1].hierarchies.length+')'));
    }

    function within(elem, x, y) {
      var left = elem.offset().left;
      var top = elem.offset().top;
      var width = elem.width();
      var height = elem.height();
      var result = null;
      if ( x >= left && (x-left <= width) &&
          y >= top && (y-top) <= height ) {
        var result = [];
        result.push(((x-left) < width/2) ? 0 : 1);
        result.push(((y-top) < height/2) ? 0 : 1);
      }
      return result;
    }

    function onHierarchyDrag(event, ui){
      var over = ui.helper.data('over');
      if ( over ) {
        var pos = within(over,event.pageX, event.pageY);
        if ( !pos ) {
          over.removeClass(dropHighlightH.join(' ')+dropHighlightV.join(' '));
        } else {
          over.addClass(dropHighlightH[pos[0]]+' '+dropHighlightV[pos[1]]);
          over.removeClass(dropHighlightH[(pos[0]+1)%2]+' '+dropHighlightV[(pos[1]+1)%2]);
        }
      }
    }

    function onHierarchyDragOver(event,ui){
      ui.helper.data('over', $(event.target));
    }

    function onHierarchyDragOut(event) {
      $(event.target).removeClass(dropHighlightH.concat(dropHighlightV).join(' '));
    }

    this.setData = function (data) {
      cellSet = data;
      colsAxis.setData(data.axes[0]);
      rowsAxis.setData(data.axes[1]);

      createTitleCell();

      var headers = table.find('.rowHierarchy,.colHierarchy');
      headers.draggable({
        helper:function(e,ui){
          var src = $(e.currentTarget);
          return src.clone()
              .css('border','1px solid #dddddd')
              .css('background','rgba(255,255,255,0.5)')
        },
        revertDuration:0,
        revert:true,
        cursor:'pointer',
        drag:onHierarchyDrag
      });
      headers.droppable({
        accept:'.rowHierarchy,.colHierarchy',
        tolerance:'pointer',
        over:onHierarchyDragOver,
        out:onHierarchyDragOut,
        drop:function(event,ui){
          $(event.target).removeClass(dropHighlightH.concat(dropHighlightV).join(' '));
          var metadataFrom = parent[0].olapGetMetadataAt(ui.draggable);
          var dest = angular.element(this);
          var metadataTo = parent[0].olapGetMetadataAt(dest);

          var pos = 0;
          if ( metadataFrom ) {
            if ( metadataTo.axisOrdinal === 0 ) {
              pos = dest.closest('tr').prevAll().length;
              pos += within(dest, event.pageX, event.pageY)[1];
            } else if ( metadataTo.axisOrdinal === 1 ) {
              pos += dest.get(0).cellIndex;
              pos += within(dest, event.pageX, event.pageY)[0];
            }
            move(metadataFrom.hierarchy.caption, metadataTo.axisOrdinal, pos);
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
      drawSlides(table);
    };

    this.setDrillHandlers = function(drill, undrill) {
      drillHandler = drill;
      undrillHandler = undrill;
    };

    this.setMoveHandler = function(move) {
      moveHandler = move;
    }

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
      if ( element.hasClass('colHierarchy') ) {
        axisOrdinal = 0;
      } else if ( element.hasClass('rowHierarchy') ) {
        axisOrdinal = 1;
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
          hierarchy : data,
          axisOrdinal:axisOrdinal
        };
      }

      return metadata;
    }

    table.addClass('cgaoTable table table-striped table-bordered table-hover table-condensed');
    table.appendTo(parent).ready(function(){
      drawSlides(table)
    });
  }

  return CellSetTable;
});
