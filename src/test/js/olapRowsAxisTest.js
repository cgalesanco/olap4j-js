define(['jquery', 'olapRowsAxis'], function ($, CellSetRowsAxis) {
  describe('The CellSetRowsAxis component', function () {
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

      axisPositions = [
        [
          {member: allStores, expanded: false},
          {member: allProducts, expanded: true}
        ],
        [
          {member: grocery}
        ],
        [
          {member: specialMember}
        ],
        [
          {member: US},
          {member: allProducts, expanded: false}
        ],
        [
          {member: CAN},
          {member: allProducts, expanded: false}
        ]
      ];

      elem = $(document.createElement('div'));
      axis = new CellSetRowsAxis(elem);
      axis.setData(axisPositions);
    });

    it('creates a row for each position', function () {

      var table = elem.children().get(0);
      expect(table.tagName).toBe('TABLE');

      expect(elem.find('table tr').size()).toBe(axisPositions.length);
    });

    it('creates a header cell for each member in a position', function () {
      var firstPosCells = elem.find('table tr:first th');
      var secondPosCells = elem.find('table tr:eq(1) th');

      expect(firstPosCells.size()).toBe(axisPositions[0].length);
      expect(secondPosCells.size()).toBe(axisPositions[1].length);
    });

    it('uses member caption for header cell contents (properly encoding it)', function () {
      var firstCell = elem.find('table tr:first th:first :eq(1) ');
      var secondCell = elem.find('table tr:eq(2) th:eq(0)');

      expect(firstCell.text()).toBe(axisPositions[0][0].member.caption);

      var specialCharCaption = axisPositions[2][0].member.caption; // A & B < >;
      expect(secondCell.text()).toBe(specialCharCaption);
    });

    it('uses member span property to set cell row span', function () {
      var firstCell = elem.find('table tr:first th:first');
      var secondCell = elem.find('table tr:eq(0) th:eq(1)');

      expect(firstCell.attr('rowSpan')).toBe('3');
      expect(secondCell.attr('rowSpan')).toBeUndefined();
    });

    xit('uses member level property to set cell content indentation', function () {
      var firstCell = elem.find('table tr:first th:first');
      var secondCell = elem.find('table tr:eq(1) th:eq(0)');

      expect(firstCell.css('padding-left')).toBe('');
      expect(secondCell.css('padding-left')).toBe('1em');
    });

    it('uses member expanded property to display the expanded/collapsed control', function () {
      var firstCell = elem.find('table tr:first th:eq(1)');
      var secondCell = elem.find('table tr:first th:eq(0)');
      var thirdCell = elem.find('table tr:eq(1) th:eq(0)');

      expect(firstCell.children('.expanded').length).toBe(1);
      expect(secondCell.children('.collapsed').size()).toBe(1);
      expect(thirdCell.children('.expanded').size()).toBe(0);
      expect(thirdCell.children('.collapsed').size()).toBe(0);
    });

    it('properly call expand/collapse event handlers', function () {
      var firstButton = elem.find('table tr:first th:eq(1) .expanded');
      var secondButton = elem.find('table tr:first th:eq(0) .collapsed');
      var expandSpy = jasmine.createSpy();
      var collapseSpy = jasmine.createSpy();
      axis.setExpandHandler(expandSpy);
      axis.setCollapseHandler(collapseSpy);

      firstButton.trigger('click');
      expect(expandSpy).toHaveBeenCalledWith(axis, [allStores, allProducts]);

      secondButton.trigger('click');
      expect(collapseSpy).toHaveBeenCalledWith(axis, [allStores]);
    });
  });
});