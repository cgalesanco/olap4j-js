define(['lib/angular'],function () {
  angular.module('appControllers',[])
      .controller('QueryCtrl', ['$scope','$http','olapService', function($scope, $http, svc){
        /**
         * Updates the scope variable containing the cellset with new data and
         * sets its drill/undrill methods so they call back the service.
         * @param scope controller scope
         * @param data cell set data to set
         */
        function updateCellSet(scope, data) {
          scope.query = data;
          scope.query.drill = function (axis, position) {
            $scope.$apply(function () {
              busyServiceCall(svc.drill, axis, position, null);
            })
          };
          scope.query.undrill = function (axis, position) {
            $scope.$apply(function () {
              busyServiceCall(svc.undrill, axis, position, null);
            })
          };
        }

        /**
         * Executes an olap service call setting <code>queryInProgress=true</code>
         * if the call takes more than 300ms to execute.
         *
         * @param {function} fn service method to call
         * @param {...object} args service method arguments
         * @param {object} options options object to be used when calling the method
         */
        function busyServiceCall() {
          var callArgs = Array.prototype.slice.call(arguments);
          var options = callArgs.splice(-1)[0];
          var delayedOptions = {
            success: function (data) {
              // Calls the success method defined in the options, if any.
              if ( options && options.success ) {
                options.success(data);
              }

              $scope.$apply(function (scope) {
                updateCellSet(scope, data);
                scope.queryInProgress = false;
                window.clearTimeout(timer);
              });
            },
            fail: function (data) {
              if ( options && options.fail ) {
                options.fail(data);
              }
              $scope.$apply(function (scope) {
                scope.queryInProgress = false;
                window.clearTimeout(timer);
              });
            }
          };

          var timer = window.setTimeout(function () {
            $scope.$apply(function(){
              $scope.queryInProgress = true;
            });
          }, 300);

          var args = callArgs.splice(1);
          args.push(delayedOptions);
          arguments[0].apply(svc, args);
        }

        // Initial service call to get the CellSet for the current query.
        $scope.queryInProgress = true;
        $http.get('rest/query/hierarchies').
            success(function (data) {
              $scope.hierarchies = data;

              busyServiceCall(svc.executeQuery, null);
            }).
            error(function () {
              $scope.queryInProgress = false;
            });

        /**
         * Checks if a hierarchy is being used in the current query.
         *
         * @param h {string} hierarchy name
         * @return {boolean} true if the hierarchy is no axis in the current query uses this hierarchy,
         * false otherwise.
         */
        $scope.notUsedHierarchy = function (h) {
          var axisHierarchy;
          if (!$scope.query || !$scope.query.axes) {
            return true;
          }

          for (var i = 0; i < $scope.query.axes.length; ++i) {
            for (var hierarchyIdx in $scope.query.axes[i].hierarchies) {
              axisHierarchy = $scope.query.axes[i].hierarchies[hierarchyIdx];
              if (axisHierarchy.uniqueName === h.uniqueName) {
                return false;
              }
            }
          }

          return true;
        }

        /**
         * Appends a hierarchy to a query axis.
         *
         * @param axis {number} axis ordinal where the hierarchy is being added.
         * @param name {string} hierarchy unique name.
         */
        $scope.addHierarchy = function (axis, name) {
          busyServiceCall(svc.addHierarchy, axis, name, null);
        };

        /**
         * Removes a hierarchy from a query axis.
         *
         * @param axis {number} axis ordinal where the hierarchy is being removed.
         * @param name {string} hierarchy unique name.
         */
        $scope.removeHierarchy = function (axis, name) {
          busyServiceCall(svc.removeHierarchy, axis, name, null)
        };
      }]);

});