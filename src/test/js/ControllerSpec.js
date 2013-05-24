define(['jquery','lib/angular-mocks','olapController'], function($){

  describe('The QueryCtrl',function(){
    var $httpBackend;
    var injector;

    beforeEach(module('appControllers'));

    beforeEach(inject(function($injector){
      $httpBackend = $injector.get('$httpBackend');
      injector = $injector;
    }));

    it('On construction uses the service to retrieve the hierarchies and then executes the current query',
      inject(function($rootScope,$controller){
      $httpBackend.expectGET('rest/query/hierarchies').respond('[{"name":"H1","caption":"Hierarchy 1"}]');

      var scope = $rootScope.$new();
      var service = {executeQuery:function(){}};
      spyOn(service,'executeQuery');

      $controller('QueryCtrl',{$scope:scope, olapService:service});
      $httpBackend.flush(1);

      expect(scope.hierarchies.length).toBe(1);
      expect(scope.hierarchies[0].name).toBe('H1');
      expect(scope.hierarchies[0].caption).toBe('Hierarchy 1');

      service.executeQuery.mostRecentCall.args[0].success({axes:[],data:null});

      expect(scope.query).toBeDefined();
      expect(scope.query.drill).toBeDefined();
      expect(scope.query.undrill).toBeDefined();
    }));
  });
});
