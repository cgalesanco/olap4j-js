/*global describe, beforeEach, it, expect, jasmine */
define(['jquery', 'olapColsAxis'], function ($, CellSetColsAxis) {
  describe('The CellSetColsAxis component', function () {
    var axisPositions;
    var elem;
    var axis;

    var allStores = {caption: 'All Stores', level: 0};
    var US = {caption: 'United States', level: 1};
    var CAN = {caption: 'Canada', level: 1};
    var allProducts = {caption: 'All Products', level: 0};
    var specialMember = {caption: 'A & B < >', level: 1};
    var grocery = {caption: 'Grocery', level: 1};

    beforeEach(function () {
      /*
        | - All Stores                              | + US           | + CAN          |
        |-------------------------------------------|----------------|----------------|
        | - All Products | Grocery | Special Member | + All Products | + All Products |
       */
      axisPositions = [
        [
          {member: allStores, expanded: true},
          {member: allProducts, expanded: true}
        ],
        [
          {member: grocery}
        ],
        [
          {member: specialMember}
        ],
        [
          {member: US, expanded:false},
          {member: allProducts, expanded: false}
        ],
        [
          {member: CAN, expanded:false},
          {member: allProducts, expanded: false}
        ]
      ];

      elem = $(document.createElement('thead'));
      axis = new CellSetColsAxis(elem);
      axis.setData(axisPositions);
    });

    it('creates a row for each hierarchy', function () {

      expect(elem.prop('tagName')).toBe('THEAD');

      // Last row will contain a cell for each position
      expect(elem.children('tr').size()).toBe(axisPositions[0].length);
    });

    it('creates a column for each position', function () {

      expect(elem.prop('tagName'));

      // Last row will contain a cell for each position
      expect(elem.find('tr:eq(1) > th').size()).toBe(axisPositions.length);
    });

    it('has a method to retrieve the number of rows', function(){
      expect(axis.getRowCount()).toBe(elem.children('tr').size());
    });

    it('creates a header cell for each member in a position', function () {
      var firstRowCells = elem.find('tr:eq(0) th');
      var secondRowCells = elem.find('tr:eq(1) th');

      expect(firstRowCells.size()).toBe(3);
      expect(secondRowCells.size()).toBe(5);
    });

    it('uses member caption for header cell contents (properly encoding it)', function () {
      var firstCell = elem.find('tr:eq(0) th:eq(0) :last');
      var secondCell = elem.find('tr:eq(1) th:eq(2) :last');

      expect(firstCell.text()).toBe(axisPositions[0][0].member.caption);

      var specialCharCaption = axisPositions[2][0].member.caption; // A & B < >;
      expect(secondCell.text()).toBe(specialCharCaption);
    });

    it('uses member span property to set cell column span', function () {
      var firstCell = elem.find('tr:eq(0) th:eq(0)');
      var secondCell = elem.find('tr:eq(0) th:eq(1)');

      expect(firstCell.attr('colSpan')).toBe('3');
      expect(secondCell.attr('colSpan')).toBeUndefined();
    });

    it('uses member expanded property to display the expanded/collapsed control', function () {
      var firstCell = elem.find('tr:eq(1) th:eq(0)');
      var secondCell = elem.find('tr:eq(0) th:eq(1)');
      var thirdCell = elem.find('tr:eq(1) th:eq(1)');

      expect(firstCell.children('.expanded').length).toBe(1);
      expect(secondCell.children('.collapsed').size()).toBe(1);
      expect(thirdCell.children('.expanded').size()).toBe(0);
      expect(thirdCell.children('.collapsed').size()).toBe(0);
    });

    it('properly call expand/collapse event handlers', function () {
      var firstButton = elem.find('tr:eq(1) th:eq(0) .expanded');
      var secondButton = elem.find('tr:eq(0) th:eq(1) .collapsed');
      var expandSpy = jasmine.createSpy();
      var collapseSpy = jasmine.createSpy();
      axis.setExpandHandler(expandSpy);
      axis.setCollapseHandler(collapseSpy);

      firstButton.trigger('click');
      expect(expandSpy).toHaveBeenCalledWith(axis, [allStores, allProducts]);

      secondButton.trigger('click');
      expect(collapseSpy).toHaveBeenCalledWith(axis, [US]);
    });
  });
});