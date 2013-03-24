/*global define */
define(['jquery'],function($){
  function OlapService(svcUrl) {

    function hydrateAxisData(data) {
      var members = {}, r, c, position, memberDescriptor, memberId;
      for (r = 0; r < data.length; r++) {
        position = data[r];
        for (c = 0; c < position.length; c++) {
          memberDescriptor = position[c];
          if (typeof(memberDescriptor.member) === "number") {
            // Member descriptor contains the member id, replace it with the member itself
            memberId = memberDescriptor.member;
            memberDescriptor.member = members[memberId];
          } else {
            // Member contains the member description, store it in the members map
            members[memberDescriptor.member.id] = memberDescriptor.member;
          }
        }
      }
    }

    function drillUndrill(op, axisOrdinal,position, options) {
      var posNames = [], i;
      for(i = 0; i < position.length; ++i) {
        posNames[i] = position[i].uniqueName;
      }
      $.ajax({
        type:'post',
        url:svcUrl,
        data : {
          axis:axisOrdinal,
          operation:op  ,
          position:posNames
        },
        success:function(data) {
          hydrateAxisData(data.rowsAxis);
          hydrateAxisData(data.colsAxis);
          options.success(data);
        }
      });
    }


    this.executeQuery = function(options){
      $.ajax({
        type:'get',
        url:svcUrl,
        success:function(data) {
          hydrateAxisData(data.rowsAxis);
          hydrateAxisData(data.colsAxis);
          options.success(data);
        }
      });
    };

    this.drill = function(axisOrdinal,position, options){
      drillUndrill('drill', axisOrdinal, position, options);
    };

    this.undrill = function(axisOrdinal,position, options){
      drillUndrill('undrill', axisOrdinal, position, options);
    };
  }
  return OlapService;
});
