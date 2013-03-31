package com.cgalesanco.olap4j.json;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

import es.cgalesanco.olap4j.query.Query;
import org.codehaus.jackson.JsonGenerator;
import org.codehaus.jackson.map.JsonSerializer;
import org.codehaus.jackson.map.SerializerProvider;
import org.olap4j.CellSet;
import org.olap4j.CellSetAxis;

public class QueryCellSetSerializer extends JsonSerializer<QueryCellSet>
{
  @Override
  public Class<QueryCellSet> handledType() {
    return QueryCellSet.class;
  }

  @Override
  public void serialize(final QueryCellSet queryCellSet, final JsonGenerator json, final SerializerProvider serializerProvider) throws IOException {
    CellSet cs = queryCellSet.getCellSet();
    Query q = queryCellSet.getQuery();

    json.writeStartObject();

    final List<CellSetAxis> axes = cs.getAxes();
    json.writeFieldName("axes");
    json.writeStartArray();
    for(CellSetAxis axis : axes) {
      json.writeObject(new QueryCellSetAxis(q, axis));
    }
    json.writeEndArray();

    json.writeFieldName("data");
    List<Integer> currentPosition = init(axes.size());

    write(json, cs, axes, currentPosition, axes.size()-1);
    json.writeEndObject();
  }

  private List<Integer> init(final int size) {
    List<Integer> list = new ArrayList<Integer>(size);
    for(int i = 0; i < size; ++i){
      list.add(0);
    }
    return list;
  }

  private void write(final JsonGenerator json, final CellSet cs, final List<CellSetAxis> axes, final List<Integer> currentPosition, final int start) throws IOException {
    if ( start < 0 ) {
      json.writeNull();
      return;
    }

    json.writeStartArray();
    CellSetAxis axis = axes.get(start);
    for(int i = 0; i < axis.getPositionCount(); ++i) {
      currentPosition.set(start, i);

      if ( start == 0 ) {
        json.writeString(cs.getCell(currentPosition).getFormattedValue());
      } else {
        write(json, cs, axes, currentPosition, start-1);
      }

    }
    json.writeEndArray();

  }


}
