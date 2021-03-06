/*global require, angular */
require(['jquery', 'lib/angular',
  'olapRowsAxis', 'olapColsAxis', 'olapService', 'olapCellSetTable', 'olapController'],
    function ($, a, CellSetRowsAxis, CellSetColsAxis, OlapService, CellSetTable) {

      angular.module('olapJsApp', ['appControllers'])
          .factory('olapService', function () {
            return new OlapService('rest/query')
          })
      /**
       * @ngdoc directive
       * @name  olap.directive:olapCellset
       *
       * @element A
       * @param   {string} query scope variable holding query data. Changes to this variable will be reflected in
       *  the table, and expand/collapse operations on the table will modify this variable.
       *
       *  @description
       *
       *  This directive displays a pivot table to display an olap4j CellSet. The table provides controls to
       *  drill/collapse the members shown in the axes, modifying the underlying query.
       <doc:example>
       <doc:source>
       <div olap-cellset="myQuery" />
       </doc:source>
       </doc:example>
       *
       *  The generated table will look like
       *
       *  TODO: draw a sample table
       *
       */
          .directive('olapCellset', function () {
            var table;

            function link(scope, iElement, iAttrs) {

              function createHandler(opName) {
                return function (table, axis, position) {
                  var query = scope.$eval(iAttrs.olapCellset);
                  query[opName](axis, position);
                };
              }

              scope.$watch(iAttrs.olapCellset, function (newValue) {
                if (newValue) {
                  table.setData(newValue);
                }
              });

              table.setDrillHandlers(createHandler('drill'), createHandler('undrill'));
              table.setMoveHandler(function(table,hierarchy,axis,position) {
                var query = scope.$eval(iAttrs.olapCellset);
                query.move(hierarchy,axis,position);
              });
            }

            return {
              restrict: 'A',
              compile: function (tElem) {
                table = new CellSetTable(tElem, CellSetRowsAxis, CellSetColsAxis);
                return link;
              }
            };
          })
  .directive('contextMenuOn', function () {
    return {
      scope: {context: '=contextMenuOn'},
      link: function (scope, iElement, iAttrs) {
        function hideMenu() {
          scope.$apply(function (scope) {
            scope.context = null
          });
          $('html').unbind('click', hideMenu);
        }

        scope.$watch('context', function (newValue, oldValue) {
          if (newValue && !oldValue) {
            // The menu is closed if the menu is alreadyOpen (oldValue truthy)
            scope.context = newValue;
            iElement.css('position', 'absolute');
            iElement.css('left', window.event.clientX - 5);
            iElement.css('top', window.event.clientY - 5);
            iElement.show();
            $('html').click(hideMenu);
            iElement.click(function (event) {
              event.stopPropagation();
            });
            if ( window.event.stopPropagation ) {
              window.event.stopPropagation();
            } else {
              window.event.cancelBubble = true;
            }
          } else {
            scope.context = null;
            iElement.hide();
          }
        });
      }
    };
  });

      angular.bootstrap(document, ['olapJsApp']);

    });
