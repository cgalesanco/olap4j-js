package com.cgalesanco.olap4j.json;

import java.io.IOException;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

import es.cgalesanco.olap4j.query.Query;
import es.cgalesanco.olap4j.query.QueryAxis;
import es.cgalesanco.olap4j.query.QueryHierarchy;
import org.codehaus.jackson.JsonGenerator;
import org.olap4j.CellSetAxis;
import org.olap4j.OlapException;
import org.olap4j.Position;
import org.olap4j.metadata.Hierarchy;
import org.olap4j.metadata.Member;

public class CellSetAxisMapper
{
  public void toJson(final JsonGenerator json, final Query query, final CellSetAxis axis) throws IOException {
    QueryAxis queryAxis = query.getAxis(axis.getAxisOrdinal());

    usedMembers = new HashMap<Member, Integer>();
    List<Position> positions = axis.getPositions();
    Iterator<Position> itPosition = positions.iterator();
    if ( !itPosition.hasNext() ) {
      return;
    }

    json.writeStartObject();
    json.writeFieldName("hierarchies");
    json.writeStartArray();
    for(QueryHierarchy qh : queryAxis.getHierarchies()){
      writeHierarchy(json, qh.getHierarchy());
    }
    json.writeEndArray();

    json.writeFieldName("positions");
    json.writeStartArray();

    Position position = itPosition.next();
    List<Member> posMembers = position.getMembers();
    writeMembers(json, queryAxis, posMembers, 0);

    while( itPosition.hasNext() ) {
      Position nextPos = itPosition.next();
      List<Member> nextPosMembers = nextPos.getMembers();

      int m = findCommonPrefix(posMembers, nextPosMembers);
      writeMembers(json, queryAxis, nextPosMembers, m);

      posMembers = nextPosMembers;
    }

    json.writeEndArray();

    json.writeEndObject();
  }

  private void writeHierarchy(final JsonGenerator json, final Hierarchy hierarchy) throws IOException {
    json.writeStartObject();
    json.writeStringField("uniqueName", hierarchy.getUniqueName());
    json.writeStringField("caption", hierarchy.getCaption());
    json.writeEndObject();
  }

  Map<Member,Integer> usedMembers;
  int maxMember = 0;

  private void writeMembers(final JsonGenerator json, final QueryAxis queryAxis, final List<Member> posMembers, final int start) throws IOException {
    json.writeStartArray();
    for(int i = start; i < posMembers.size(); ++i) {
      QueryHierarchy queryHierarchy = queryAxis.getHierarchies().get(i);
      Member m = posMembers.get(i);

      json.writeStartObject();
      json.writeFieldName("member");

      Integer memberId = usedMembers.get(m);
      if ( memberId == null ) {
        memberId = ++maxMember;
        usedMembers.put(m, memberId);
        json.writeStartObject();
        json.writeNumberField("id", memberId);
        json.writeStringField("caption", m.getCaption());
        json.writeNumberField("level", m.getDepth());
        json.writeStringField("uniqueName", m.getUniqueName());
        json.writeEndObject();
      } else {
        json.writeNumber(memberId);
      }

      try {
      if ( !queryHierarchy.isLeaf(m) ) {
        Member[] pos = new Member[i+1];
        for(int p = 0; p < i+1; ++p ){
          pos[p] = posMembers.get(p);
        }
        json.writeBooleanField("expanded", queryAxis.isDrilled(pos));
      }
      } catch (OlapException e) {
        throw new RuntimeException(e);
      }
      json.writeEndObject();
    }
    json.writeEndArray();
  }

  private int findCommonPrefix(final List<Member> current, final List<Member> next) {
    int i;
    for(i = 0; i < current.size(); ++i ) {
      if ( !current.get(i).equals(next.get(i)) ) {
        break;
      }
    }
    return i;
  }
}
