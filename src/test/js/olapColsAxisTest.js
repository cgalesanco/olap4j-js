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

      axisHierarchies = [
        {name:'[Stores]', caption:'Stores'},
        {name:'[Products]', caption:'Products'}
      ];

      elem = $(document.createElement('thead'));
      axis = new CellSetColsAxis(elem);
      axis.setData({hierarchies:axisHierarchies, positions:axisPositions});
    });

    it('creates a row for each hierarchy plus on additional row for the "stacked" hierarchy header', function () {

      expect(elem.prop('tagName')).toBe('THEAD');

      // Last row will contain a cell for each position
      expect(elem.children('tr').size()).toBe(axisPositions[0].length+1);
    });

    it('creates a column for each position', function () {

      expect(elem.prop('tagName'));

      // Last row will contain a cell for each position
      expect(elem.find('tr:last > th').size()).toBe(axisPositions.length);
    });

    it('has a method to retrieve the number of rows', function(){
      expect(axis.getRowCount()).toBe(elem.children('tr').size());
    });

    it('creates a header cell for each member in a position', function () {
      var hierarchyHeaderCells = elem.find('th.colHierarchy');

      expect(hierarchyHeaderCells.size()).toBe(2);
    });

    it('uses member caption for header cell contents (properly encoding it)', function () {
      // First cell will be in row 1 (because of hierarchy label displacement),
      // column 2 (after the two cells used for each hierarchy label
      var firstCell = elem.find('tr:eq(1) th:eq(2) :last');
      var secondCell = elem.find('tr:eq(2) th:eq(2) :last');

      expect(firstCell.text()).toBe(axisPositions[0][0].member.caption);

      var specialCharCaption = axisPositions[2][0].member.caption; // A & B < >;
      expect(secondCell.text()).toBe(specialCharCaption);
    });

    it('creates a second cell for each hierarchy label to add the "slide"', function () {
      var firstCell = elem.find('tr:eq(0) th:eq(1)');
      var secondCell = elem.find('tr:eq(1) th:eq(1)');

      expect(firstCell.hasClass('cgaoSlide')).toBeTruthy();
      expect(secondCell.hasClass('cgaoSlide')).toBeTruthy();
    });

    it('uses member expanded property to display the expanded/collapsed control', function () {
      var firstCell = elem.find('tr:eq(2) th:eq(0)');
      var secondCell = elem.find('tr:eq(1) th:eq(3)');
      var thirdCell = elem.find('tr:eq(2) th:eq(1)');

      expect(firstCell.children('.expanded').length).toBe(1);
      expect(secondCell.children('.collapsed').size()).toBe(1);
      expect(thirdCell.children('.expanded').size()).toBe(0);
      expect(thirdCell.children('.collapsed').size()).toBe(0);
    });

    it('properly call expand/collapse event handlers', function () {
      var firstButton = elem.find('tr:eq(2) th:eq(0) .expanded');
      var secondButton = elem.find('tr:eq(1) th:eq(3) .collapsed');
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