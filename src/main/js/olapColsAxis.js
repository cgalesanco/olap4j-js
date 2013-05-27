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
          posList = target.parents('th').data('pos'),
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
        e.stopPropagation();
      } else if (target.hasClass('collapsed')) {
        collapseHandler(self, pos);
        e.stopPropagation();
      }
    }

    this.element.click(clickHandler);

    /**
     * Sets the axis data, generating the rows for the columns axis.
     * Hierarchy labels are displaced one row up of their respective members, so the first row will contain only
     * the label for the first hierarchy and the last row will contain only the members in the last hierarchy.
     //   +-------------+-+
     //   | Hierarchy 1 | |
     //   +-------------+-+-----------+-----------+
     //   | Hierarchy 2 | | H1 member | H1 member |
     //   +-------------+-+-----------+-----------+
     //   | Hierarchy 3 | | H2 member | H2 member |
     //   +-------------+-+-----------+-----------+
     //   | H3 Member   | H3 member |
     //   +-------------+-----------+
     * Hierarchy labels use two cells, the second cell displays a graphical "slide" to make the
     * header displacement evident
     * @param data
     */
    this.setData = function(data) {
      var tHead = this.element, rows, c, r, cell, span,
          hierarchyCount, positionCount;

      if ( !data || !data.hierarchies ) {
        hierarchyCount = 0;
        positionCount = 0;
      } else {
        hierarchyCount = data.hierarchies.length;
        positionCount = data.positions.length;
      }

      rowCount = hierarchyCount+1;

      tHead.empty();
      this.element.addClass('cgaoAxis');


      // Creates a row for each hierarchy in the axis.
      //  The first column will contain the hierarchy labels
      //  Following columns will contain hierarchy members (on row down)
      //  the rows variable will be populated with the rows to be populated with hierarchy members
      rows = [];
      for(r = 0; r < hierarchyCount; r++) {
        var headerRow = $(document.createElement("tr"));
        var headerCell = $(document.createElement("th"));
        var headerTitle = $(document.createElement('span'));
        headerTitle.text(data.hierarchies[r].caption);
        headerTitle.addClass('hierarchyHeader');

        headerCell.addClass('colHierarchy')
        headerCell.appendTo(headerRow);
        headerCell.data('hie', data.hierarchies[r]);
        $('<th class="cgaoSlide">&nbsp;</th>').appendTo(headerRow);
        headerRow.appendTo(tHead);
        headerTitle.appendTo(headerCell);

        if ( r > 0 ) {
          rows[r-1] = headerRow;
        }
      }
      if ( hierarchyCount > 0 ) {
        // Create an empty last row
        var r = rows[hierarchyCount-1] = $(document.createElement("tr"));
        r.appendTo(tHead);
      }


      // Populates the member rows
      for(c = 0; c < positionCount; c++) {
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
                cell.append('<div class="expanded"><i class="expanded icon-minus"></i></div>');
              } else {
                cell.append('<div class="collapsed"><i class="collapsed icon-plus"></i></div>');
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
