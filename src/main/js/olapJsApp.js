/*global require */
require(['lib/angular', 'jquery', 'olapRowsAxis', 'olapColsAxis', 'olapService', 'olapCellSetTable'],
    function (a, $, CellSetRowsAxis, CellSetColsAxis, OlapService, CellSetTable) {

      // Creates the CellSet table on load
      $(document).ready(function () {
        var table = new CellSetTable($('#cellSet'), new OlapService('/test'), CellSetRowsAxis, CellSetColsAxis);
        table.init();
      });

      angular.module('olapJsApp',[]).controller('TestController', function($scope){
        $scope.testValue = 'Hi there!';
      });

      angular.bootstrap(document,'olapJsApp');
    });
