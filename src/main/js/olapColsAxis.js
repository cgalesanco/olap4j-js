/*global define */
define(['jquery'], function($){

  function CellSetRowsAxis(element) {
    var self = this,
        rowCount,
        expandHandler = null,
        collapseHandler = null;
    this.element = element;

    function clickHandler(e) {
      var target = $(e.target),
          posList = target.parent().data('pos'),
          pos = [],
          prevCell;
      if (!posList) {
        return;
      }

      do {
        pos.unshift(posList.member);
        prevCell = posList.prevCell;
        posList = prevCell ? prevCell.data('pos') : null;
      } while (posList);

      if (target.hasClass('expanded')) {
        expandHandler(self, pos);
      } else if (target.hasClass('collapsed')) {
        collapseHandler(self, pos);
      }
    }

    this.element.click(clickHandler);
    this.setData = function(data) {
      var tHead = this.element, rows, c, r, cell, span,
          hierarchyCount = data && data.hierarchies.length;

      rowCount = hierarchyCount; // Number of rows in the axis, this will be different
                                 // from the number of hierarchies/
      tHead.empty();
      this.element.addClass('cgaoAxis');


      rows = [];
      for(r = 0; r < hierarchyCount; r++) {
        rows[r] = $(document.createElement("tr"));
        rows[r].appendTo(tHead);
      }

      for(c = 0; c < data.positions.length; c++) {
        var pos = data.positions[c];
        var firstRow = hierarchyCount - pos.length;
        for( r = 0; r < hierarchyCount; r++) {
          var row = rows[r];
          if ( r < firstRow ) {
            cell = row.children(':last-child');
            span = cell.attr('colSpan');
            span = !span ? 2 : (parseInt(span, 10) + 1);
            cell.attr('colSpan', span);
          } else {
            cell = $(document.createElement('th'));
            var cellData = pos[r-firstRow];

            if ( cellData.expanded !== undefined ) {
              if (cellData.expanded) {
                cell.append('<div class="expanded">-</div>');
              } else {
                cell.append('<div class="collapsed">+</div>');
              }
            }

            var caption = $(document.createElement('span'));
            caption.text(cellData.member.caption);
            caption.appendTo(cell);

            cell.data('pos', {
              member: cellData.member,
              prevCell: r === 0 ? null : rows[(r) - 1].children(':last-child')
            });

            cell.appendTo(row);
          }
        }
      }
    };

    this.getRowCount = function() {
      return rowCount;
    };

    this.setExpandHandler = function (h) {
      expandHandler = h;
    };

    this.setCollapseHandler = function (h) {
      collapseHandler = h;
    };
  }

  return CellSetRowsAxis;
});
