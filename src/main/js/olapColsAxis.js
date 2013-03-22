/*global define */
define(['jquery'], function(){

  function CellSetRowsAxis(element) {
    this.element = element;
    var self = this;
    var expandHandler = null,
        collapseHandler = null;

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

    this.setData = function(data) {
      var table = $('<table>'), rows, c, r, cell, span,
          hierarchyCount = data[0] && data[0].length;

      this.element.empty();
      table.click(clickHandler);
      table.appendTo(this.element);
      this.element.addClass('cgaoAxis');


      rows = [];
      for(r = 0; r < hierarchyCount; r++) {
        rows[r] = $(document.createElement("tr"));
        rows[r].appendTo(table);
      }

      for(c = 0; c < data.length; c++) {
        var pos = data[c];
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

    this.setExpandHandler = function (h) {
      expandHandler = h;
    };

    this.setCollapseHandler = function (h) {
      collapseHandler = h;
    };
  }

  return CellSetRowsAxis;
});
