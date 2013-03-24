/*global require, angular */
require(['lib/angular', 'jquery', 'olapRowsAxis', 'olapColsAxis', 'olapService', 'olapCellSetTable'],
    function (a, $, CellSetRowsAxis, CellSetColsAxis, OlapService, CellSetTable) {
      // TODO: Use an injectable service
      var svc = new OlapService('/test');

      angular.module('olapJsApp', []).
        controller('QueryCtrl', ['$scope', '$http', function ($scope, $http) {

        svc.executeQuery({success:function(data){
          $scope.$apply(function($scope){
            $scope.query = data;
          });
        }});

        $http.get('/rest/query/hierarchies').success(function(data){
          $scope.hierarchies = data;
          });
        }]).

        directive('olapCellset', function(){
          var table;

          function link(scope, iElement, iAttrs) {
            function createHandler(opName) {
              return function (table, axis, position) {
                svc[opName](axis,position,{
                  success:function(data) {
                    scope.$apply(function(scope){
                      scope[iAttrs.olapCellset] = data;
                    });
                  }
                });
              };
            }

            scope.$watch(iAttrs.olapCellset, function(newValue){
              if ( newValue ) {
                table.setData(newValue);
              }
            });

            table.setDrillHandlers(createHandler('drill'), createHandler('undrill'));
          }

          return {
            restrict: 'A',
            compile: function(tElem) {
              table = new CellSetTable(tElem, CellSetRowsAxis, CellSetColsAxis);
              return link;
            }
            };
          });

      angular.bootstrap(document, ['olapJsApp']);
    });
