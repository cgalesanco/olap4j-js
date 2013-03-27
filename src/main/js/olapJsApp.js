/*global require, angular */
require(['lib/angular', 'jquery', 'olapRowsAxis', 'olapColsAxis', 'olapService', 'olapCellSetTable'],
    function (a, $, CellSetRowsAxis, CellSetColsAxis, OlapService, CellSetTable) {
      // TODO: Use an injectable service
      var svc = new OlapService('/rest/query');

      angular.module('olapJsApp', []).
          controller('QueryCtrl', ['$scope', '$http', function ($scope, $http) {

            $scope.queryInProgress = true;
            $http.get('/rest/query/hierarchies').
                success(function (data) {
                  $scope.hierarchies = data;

                  svc.executeQuery({success: function (data) {
                    $scope.$apply(function ($scope) {
                      $scope.query = data;
                      $scope.queryInProgress = false;
                    })
                  }});
                }).
                fail(function(){
                  $scope.queryInProgress = false;
                });

            $scope.notUsedHierarchy = function (h) {
              var axisHierarchy;
              if (!$scope.query) {
                return true;
              }

              for (var hierarchyIdx in $scope.query.rowsAxis.hierarchies) {
                axisHierarchy = $scope.query.rowsAxis.hierarchies[hierarchyIdx];
                if (axisHierarchy.uniqueName === h.uniqueName) {
                  return false;
                }
              }

              for (hierarchyIdx in $scope.query.colsAxis.hierarchies) {
                axisHierarchy = $scope.query.colsAxis.hierarchies[hierarchyIdx];
                if (axisHierarchy.uniqueName === h.uniqueName) {
                  return false;
                }
              }

              return true;
            }

            $scope.addHierarchy = function (axis, name) {
              $scope.queryInProgress = true;
              svc.addHierarchy(axis, name, {
                success: function (data) {
                  $scope.$apply(function ($scope) {
                    $scope.query = data;
                    $scope.queryInProgress = false;
                  });
                }});
            };

            $scope.removeHierarchy = function (axis, name) {
              $scope.queryInProgress = true;
              svc.removeHierarchy(axis, name, {
                success: function (data) {
                  $scope.$apply(function ($scope) {
                    $scope.query = data;
                    $scope.queryInProgress = false;
                  });
                }});
            };
          }
          ]).

          directive('olapCellset', function () {
            var table;

            function link(scope, iElement, iAttrs) {
              function busyServiceCall() {
                var callArgs = Array.prototype.slice.call(arguments);
                var options = callArgs.splice(-1)[0];
                var delayedOptions = {
                  success: function (data) {
                    options.success(data);
                    scope.$apply(function (scope) {
                      scope.queryInProgress = false;
                      window.clearTimeout(timer);
                    });
                  },
                  fail: function (data) {
                    options.fail(data);
                    scope.$apply(function (scope) {
                      scope.queryInProgress = false;
                      window.clearTimeout(timer);
                    });
                  }
                };

                var timer = window.setTimeout(function () {
                  scope.$apply(function (scope) {
                    scope.queryInProgress = true;
                  });
                }, 300);

                var args = callArgs.splice(1);
                args.push(delayedOptions);
                arguments[0].apply(svc, args);
              }

              function createHandler(opName) {
                return function (table, axis, position) {
                  busyServiceCall(svc[opName], axis, position, {
                    success: function (data) {
                      scope.$apply(function (scope) {
                        scope[iAttrs.olapCellset] = data;
                      });
                    }
                  })
                };
              }

              scope.$watch(iAttrs.olapCellset, function (newValue) {
                if (newValue) {
                  table.setData(newValue);
                }
              });

              table.setDrillHandlers(createHandler('drill'), createHandler('undrill'));
            }

            return {
              restrict: 'A',
              compile: function (tElem) {
                table = new CellSetTable(tElem, CellSetRowsAxis, CellSetColsAxis);
                return link;
              }
            };
          });


      angular.bootstrap(document, ['olapJsApp']);
    });
