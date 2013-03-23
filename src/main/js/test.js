/*global require */
require(['jquery', 'olapRowsAxis', 'olapColsAxis','olapService', 'olapCellSetTable'],
    function ($, CellSetRowsAxis, CellSetColsAxis, OlapService, CellSetTable) {
  $(document).ready(function () {
    var table = new CellSetTable($('#cellSet'), new OlapService('/test'), CellSetRowsAxis, CellSetColsAxis);
    table.init();
  });
});
