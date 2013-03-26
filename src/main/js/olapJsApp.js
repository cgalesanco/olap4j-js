/*global require, angular */
require(['lib/angular', 'jquery', 'olapRowsAxis', 'olapColsAxis', 'olapService', 'olapCellSetTable'],
    function (a, $, CellSetRowsAxis, CellSetColsAxis, OlapService, CellSetTable) {
      // TODO: Use an injectable service
      var svc = new OlapService('/rest/query');

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

        $scope.notUsedHierarchy = function(h){
          var axisHierarchy;
          if ( !$scope.query ) {
            return true;
          }


          for(var hierarchyIdx in $scope.query.rowsAxis.hierarchies) {
            axisHierarchy = $scope.query.rowsAxis.hierarchies[hierarchyIdx];
            if ( axisHierarchy.uniqueName === h.uniqueName )
              return false;
          }

          for(var hierarchyIdx in $scope.query.colsAxis.hierarchies) {
            axisHierarchy = $scope.query.colsAxis.hierarchies[hierarchyIdx];
            if ( axisHierarchy.uniqueName === h.uniqueName )
              return false;
          }

          return true;
        }

        $scope.addHierarchy = function(axis, name) {
          svc.addHierarchy(axis, name,{
            success:function(data){
              $scope.$apply(function($scope){
                $scope.query = data;
              });
            }});
        }
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
