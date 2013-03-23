/*global require */
require(['lib/angular', 'jquery', 'olapRowsAxis', 'olapColsAxis', 'olapService', 'olapCellSetTable'],
    function (a, $, CellSetRowsAxis, CellSetColsAxis, OlapService, CellSetTable) {

      angular.module('olapJsApp', []).
          controller('TestController', function ($scope) {
            $scope.testValue = 'Hi there!';
          }).
          directive('olapCellset', function(){
            return {
              restrict: 'A',
              compile: function(tElem) {
                var table = new CellSetTable(tElem, new OlapService('/test'), CellSetRowsAxis, CellSetColsAxis);
                table.init();

                return function(){};  // link function is a no-op
              }

            }
          });

      angular.bootstrap(document, ['olapJsApp']);
    });
