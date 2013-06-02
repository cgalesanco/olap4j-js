/*global define */
define(['jquery'], function ($) {
  'use strict';

  /**
   * Constructs a CellSetRowsAxis
   * @param element jQuery element to hold the axis
   * @constructor
   */
  function CellSetRowsAxis(element) {
    var self = this,
        columnCount,
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

    this.setData = function (data) {
      var tBody = this.element,
          hierarchyCount, positionCount,
          cells,
          r, c, i,
          row, dataRow, dataLength,
          dataCell, cell, span;


      if ( !data || !data.hierarchies ) {
        hierarchyCount = 0;
        positionCount = 0;
        tBody.empty();
        columnCount = 1;
        return;
      } else {
        hierarchyCount = data.hierarchies.length;
        positionCount = data.positions.length;
      }

      tBody.empty();
      cells = new Array(hierarchyCount);
      columnCount = hierarchyCount; // Number of columns in the axis, this will be different
                                    // from the number of hierarchies
      for (r = 0; r < positionCount; r++) {
        row = $('<tr>');
        dataRow = data.positions[r];
        dataLength = dataRow.length;

        // Increases span for missing columns
        for (c = 0; c < hierarchyCount - dataLength; c++) {
          span = cells[c].attr('rowSpan');
          span = !span ? 2 : (parseInt(span, 10) + 1);
          cells[c].attr('rowSpan', span);
        }

        // Draws existing columns
        for (i = 0; i < dataRow.length; i++) {
          dataCell = dataRow[i];
          cell = $('<th>');
          cells[c + i] = cell;
          if ( i == dataRow.length-1 ) {
            cell.attr('colSpan','2');
          }

          if (dataCell.expanded !== undefined) {
            if (dataCell.expanded) {
              cell.append('<div class="expanded"><i class="expanded icon-minus"></i></div>');
            } else {
              cell.append('<div class="collapsed"><i class="collapsed icon-plus"></i></div>');
            }
          }
          cell.append($('<span/>').text(dataCell.member.caption));

          if (dataCell.member.level) {
            cell.css('padding-left', dataCell.member.level + 'em');
          }

          cell.data('pos', {
            member: dataCell.member,
            isLeaf: dataCell.expanded === undefined,
            prevCell: (c + i) === 0 ? null : cells[(c + i) - 1]
          });

          row.append(cell);
        }

        row.appendTo(tBody);
      }
    };

    this.getColumnCount = function() {
      return columnCount;
    };

    this.setExpandHandler = function (h) {
      expandHandler = h;
    };

    this.setCollapseHandler = function (h) {
      collapseHandler = h;
    };

    this.element.addClass('cgaoAxis');
  }

  return CellSetRowsAxis;
});