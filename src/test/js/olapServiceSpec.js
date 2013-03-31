define(['jquery','olapService'], function($, OlapService){

  describe('The Olap4j Service',function(){
    var svc;
    var url = '/service';
    var srvSpy;

    var dehydratedAxis = [
      [{member:{id:1, caption:'M1'}},{member:{id:2, caption:'M2'}}],
      [{member:1}],
      [{member:2}]
    ];

    beforeEach(function(){
      svc = new OlapService(url);
      srvSpy = spyOn($,'ajax');
    });

    function testResponseHydration(request) {
      var srvData = {
        axes: [
          {positions:[[]]},
          {positions:dehydratedAxis}
        ],
        data: []
      };

      srvSpy.andCallFake(function (options) {
        options.success(srvData);
      });

      var handler = jasmine.createSpy();
      request(handler);

      expect(handler).toHaveBeenCalled();
      var data = handler.mostRecentCall.args[0];

      expect(data).toBe(srvData);
      expect(data.axes[1].positions[1][0].member).toBe(data.axes[1].positions[0][0].member);
      expect(data.axes[1].positions[2][0].member).toBe(data.axes[1].positions[0][1].member);
    }

    describe('to execute a query', function(){

      it('calls GET on the provided URL', function(){
        svc.executeQuery();

        expect(srvSpy).toHaveBeenCalled();
        var ajaxOptions = srvSpy.mostRecentCall.args[0];
        expect(ajaxOptions.url).toBe(url);
        expect(ajaxOptions.type).toBe('get');
      });

      it('hydrates the response on success', function() {
        testResponseHydration(function(handler){
          svc.executeQuery({success: handler});
        });
      });
    });

    describe('to drill a query', function(){
      var axis = 1,
          pos = [{uniqueName:'Member1'},{uniqueName:'Member2'}];

      it('sends POST to the provided URL', function(){
        svc.drill(axis, pos);

        expect(srvSpy).toHaveBeenCalled();
        var ajaxOptions = srvSpy.mostRecentCall.args[0];
        expect(ajaxOptions.url).toBe(url+'/drill');
        expect(ajaxOptions.type).toBe('post');
      });

      it('the data posted identifies the operation, axis and position (by unique name)', function(){
        svc.drill(axis, pos);

        var postedData = srvSpy.mostRecentCall.args[0].data;
        expect(postedData.axis).toBe(axis);
        expect(postedData.position.length).toBe(2);
        expect(postedData.position[0]).toBe(pos[0].uniqueName);
        expect(postedData.position[1]).toBe(pos[1].uniqueName);
      });

      it('hydrates the response on success', function() {
        testResponseHydration(function(handler){
          svc.drill(axis, pos, {success:handler});
        });
      });

    });


  });
});
