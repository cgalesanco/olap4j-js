require(['jquery','lib/angular'], function() {

  angular.module('menuApp',[])
      .directive('contextMenuOn', function(){
        return {
          scope: {context:'=contextMenuOn'},
          link:function(scope, iElement, iAttrs) {
            scope.$watch('context', function(newValue){
              function hideMenu(){
                scope.$apply(function(scope){scope.context = null});
                $('html').unbind('click', hideMenu);
              }

              scope.context = newValue;
              if ( newValue ) {
                iElement.css('position','absolute');
                iElement.css('left', window.event.clientX-5);
                iElement.css('top', window.event.clientY-5);
                iElement.show();
                $('html').click(hideMenu);
                iElement.click(function(event){
                  event.stopPropagation();
                });
                window.event.stopPropagation();
              } else {
                iElement.hide();
              }
            });
          }
        };
      })
      .controller("MenuController",['$scope',function($scope){
        $scope.currentItem = null; // Variable holding the context for the menu
      }]);

  angular.bootstrap(document,['menuApp']);
});
