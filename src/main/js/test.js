/*global require */
require(['jquery', 'olapRowsAxis', 'olapColsAxis'], function ($, CellSetRowsAxis, CellSetColsAxis) {
  function processData(data) {
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

  function postCommand(axis, command, position) {
    var posString = '', i;
    for (i = 0; i < position.length; ++i) {
      if (posString.length > 0) {
        posString += ',';
      }
      posString += position[i].uniqueName;
    }
    var data = {};
    data[command] = posString;
    $.ajax({
      type:'POST',
      url:'/test',
      data: data
    }).success(function (data) {
          processData(data);
          axis.setData(data);
        });
  }

  function drill(axis, position) {
    postCommand(axis, 'drill', position);
  }

  function undrill(axis, position) {
    postCommand(axis, 'undrill', position);
  }
  $(document).ready(function () {
    var rowsAxis = new CellSetRowsAxis($('#rowsPane'));
    rowsAxis.setExpandHandler(undrill);
    rowsAxis.setCollapseHandler(drill);

    var colsAxis = new CellSetColsAxis($('#colsPane'));
    colsAxis.setExpandHandler(undrill);
    colsAxis.setCollapseHandler(drill);

    $.ajax({
      url:'/test'
    }).success(function (data) {
          processData(data);
          rowsAxis.setData(data);
          colsAxis.setData(data);
        });
  });
});
