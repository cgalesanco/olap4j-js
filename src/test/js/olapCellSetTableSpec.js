/*global describe, beforeEach, it, expect, jasmine */
define(['jquery', 'olapCellSetTable'], function ($, CellSetTable) {
  describe("The CellSetTable component", function(){
    var parent, drillUrl,
        mockRowsAxis, mockColsAxis,
        rowsAxisSpy, colsAxisSpy;

    beforeEach(function(){
      parent = $("<div/>");
      mockRowsAxis = jasmine.createSpyObj('rowsAxis', ['setData','getColumnCount', 'setExpandHandler', 'setCollapseHandler']);
      mockColsAxis = jasmine.createSpyObj('colsAxis', ['setData','getRowCount', 'setExpandHandler', 'setCollapseHandler']);
      rowsAxisSpy = jasmine.createSpy('CellSetRowsAxis').andReturn(mockRowsAxis);
      colsAxisSpy = jasmine.createSpy('CellSetColsAxis').andReturn(mockColsAxis);
    });

    it("constructs rows and columns axes", function(){
      new CellSetTable(parent, drillUrl, rowsAxisSpy, colsAxisSpy);

      expect(colsAxisSpy).toHaveBeenCalled();
      expect(colsAxisSpy.mostRecentCall.args[0].prop('tagName')).toBe('THEAD');
      var colsParent = colsAxisSpy.mostRecentCall.args[0].parent();
      expect(rowsAxisSpy).toHaveBeenCalled();
      expect(rowsAxisSpy.mostRecentCall.args[0].prop('tagName')).toBe('TBODY');
      var rowsParent = rowsAxisSpy.mostRecentCall.args[0].parent();

      expect(colsParent.get(0)).toEqual(rowsParent.get(0));
      expect(rowsParent.prop('tagName')).toBe('TABLE');
    });

    it("creates a title cell in the upper left corner", function(){
      var rowsColumnCount = 3;
      var colsRowCount = 1;

      mockColsAxis.setData.andCallFake(function(){
        colsAxisSpy.mostRecentCall.args[0].html('<tr><th>Mock Axis</th></tr>');
      });
      mockRowsAxis.setData.andCallFake(function(){
        rowsAxisSpy.mostRecentCall.args[0].html('<tr><th>Mock Axis</th></tr>');
      });

      mockColsAxis.getRowCount.andReturn(colsRowCount);
      mockRowsAxis.getColumnCount.andReturn(rowsColumnCount);

      var csTable = new CellSetTable(parent, drillUrl, rowsAxisSpy, colsAxisSpy);
      csTable.setData({rowsAxis:[], colsAxis:[], data:[]});

      var titleCell = parent.find('table > thead > tr:first > th:first');
      expect(titleCell.text()).toBe('\u00a0');
      expect(titleCell.attr('rowSpan')).toBeUndefined();
      expect(titleCell.attr('colSpan')).toBe(''+rowsColumnCount);
    });

    it("fills the table with the cell set data", function(){
      var rowsColumnCount = 3;
      var colsRowCount = 1;
      var r, c, rowData, cell;

      mockColsAxis.setData.andCallFake(function(){
        colsAxisSpy.mostRecentCall.args[0].html('' +
            '<tr><th>Mock Axis</th><th>Mock Axis</th></tr>' +
            '<tr><th>Mock Axis</th><th>Mock Axis</th></tr>' +
            '<tr><th>Mock Axis</th><th>Mock Axis</th></tr>');
      });
      mockRowsAxis.setData.andCallFake(function(){
        rowsAxisSpy.mostRecentCall.args[0].html('' +
            '<tr><th>Mock Row Axis</th></tr>' +
            '<tr><th>Mock Row Axis</th></tr>');
      });

      mockColsAxis.getRowCount.andReturn(colsRowCount);
      mockRowsAxis.getColumnCount.andReturn(rowsColumnCount);

      var csTable = new CellSetTable(parent, drillUrl, rowsAxisSpy, colsAxisSpy);
      var expectedData = [[1,2],[3,4]];
      csTable.setData({rowsAxis:[[]], colsAxis:[], data:expectedData});

      for(r = 0; r < expectedData.length; r++) {
        rowData = expectedData[r];
        for(c = 0; c < rowData.length; c++) {
          cell = parent.find('table > tbody > tr:eq('+r+') > td:eq('+(c)+')');
          expect(cell.text()).toBe(rowData[c].toString());
        }
      }
    });
  });
});

