package com.cgalesanco.olap4j.json;

import java.io.IOException;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

import es.cgalesanco.olap4j.query.QueryAxis;
import es.cgalesanco.olap4j.query.QueryHierarchy;
import org.codehaus.jackson.JsonGenerator;
import org.codehaus.jackson.map.JsonSerializer;
import org.codehaus.jackson.map.SerializerProvider;
import org.olap4j.CellSetAxis;
import org.olap4j.OlapException;
import org.olap4j.Position;
import org.olap4j.metadata.Hierarchy;
import org.olap4j.metadata.Member;

/**
 * JsonSerializer instance to serialize {@link CellSetAxis} instances.
 * <p>Generates a JSON object with two properties: <em>hierarchies</em> and <em>positions</em>. The former contains an
 * array with the hierarchies in this axis. The later is an array with the positions in the axis. Each position is itself
 * an array of JSON serializer members.</p>
 * <p>Each member is serialized with the following structure:</p>
 * <pre>
 * {
 *    "member":{
 *       "id":1,                                // Generated member ID
 *       "uniqueName":"[Store].[All Stores]",   // Member's unique name, as in {@link org.olap4j.metadata.Member#getUniqueName()}
 *       "caption":"All Stores",                // Member's caption, as in {@link org.olap4j.metadata.Member#getCaption()}
 *       "level":0                              // Member's depth, as in {@link org.olap4j.metadata.Member#getDepth()}
 *    },
 *    "expanded":true,                          // Is this member expanded. This property is generated for leaf members
 *                                              // as in {@link QueryAxis#isDrilled(org.olap4j.metadata.Member...)}
 * }
 * </pre>
 * <p>To save bandwidth, a numerical id is generated for each member, and the member specification is serialized only once.
 * Further appearances of that member will be replaced with its id (e.g. "member":1234)</p>
 * <p>Also, from each position, the longest common initial sequence of members in common with its predecessor is removed. The</p>
 * following JSON snippet describes a <code>CellSetAxis</code> instance with two positions, the first member </p>
 * <pre>
 *   M1,   N1,   O1                M1,   N1,  O1
 *   M1,   N1,   O2                           O2
 *   M1,   N1,   O3      =====>               O3
 *   M1,   N2,   O1                      N2,  O1
 *   M2,   N2,   O1                M2,   N2,  O1
 * </pre>
 */
public class QueryCellSetAxisSerializer extends JsonSerializer<QueryCellSetAxis>
{
  /**
   * Private class to hold the previously serialized members.
   */
  static private class UsedMembersSet {
    private Map<Member, Integer> usedMembers;
    private int maxMember;

    /**
     * Creates an empty member set.
     */
    public UsedMembersSet() {
      usedMembers = new HashMap<Member,Integer>();
      maxMember = 0;
    }

    /**
     * Adds <code>m</code> to the set of serialized members
     * @param m the member to add to the set.
     * @return a new ID for that member.
     */
    public Integer add(final Member m) {
      int memberId = ++maxMember;
      usedMembers.put(m, memberId);
      return memberId;
    }

    /**
     * Retrieves the ID for a member.
     * @param m the member to search for.
     * @return the ID for that member, or <code>null</code> if it's not in the set.
     */
    public Integer get(final Member m) {
      return usedMembers.get(m);
    }
  }

  @Override
  public Class<QueryCellSetAxis> handledType() {
    return QueryCellSetAxis.class;
  }

  @Override
  public void serialize(final QueryCellSetAxis queryCellSetAxis, final JsonGenerator json, final SerializerProvider serializerProvider) throws IOException {
    final CellSetAxis axis = queryCellSetAxis.getAxis();
    final QueryAxis queryAxis = queryCellSetAxis.getQuery().getAxis(axis.getAxisOrdinal());

    //
    // Serializes the hierarchies
    json.writeStartObject();
    json.writeFieldName("hierarchies");
    json.writeStartArray();
    for (QueryHierarchy qh : queryAxis.getHierarchies()) {
      writeHierarchy(json, qh.getHierarchy());
    }
    json.writeEndArray();


    //
    // Serializes the positions
    json.writeFieldName("positions");
    UsedMembersSet usedMembers = new UsedMembersSet();
    List<Position> positions = axis.getPositions();
    Iterator<Position> itPosition = positions.iterator();
    if (!itPosition.hasNext()) {
      json.writeNull();  // Null is generated for an empty positions list
    } else {
      json.writeStartArray();

      // Writes out the first position
      Position position = itPosition.next();
      List<Member> posMembers = position.getMembers();
      writeMembers(json, queryAxis, posMembers, usedMembers, 0);

      // Iterates up to the end of the list, keeping the previous position to find any common prefix.
      while (itPosition.hasNext()) {
        Position nextPos = itPosition.next();
        List<Member> nextPosMembers = nextPos.getMembers();

        int m = findCommonPrefix(posMembers, nextPosMembers);
        writeMembers(json, queryAxis, nextPosMembers, usedMembers, m);

        posMembers = nextPosMembers;
      }
      json.writeEndArray();
    }

    json.writeEndObject();
  }

  /**
   * Helper to write a hierarchy.
   * @param json the current <code>JsonGenerator</code>
   * @param hierarchy  the hierarchy to write
   */
  private void writeHierarchy(final JsonGenerator json, final Hierarchy hierarchy) throws IOException {
    json.writeStartObject();
    json.writeStringField("uniqueName", hierarchy.getUniqueName());
    json.writeStringField("caption", hierarchy.getCaption());
    json.writeEndObject();
  }

  /**
   * Helper to write a position.
   * @param json the current <code>JsonGenerator</code>
   * @param queryAxis the current axis
   * @param posMembers the members in this position
   * @param usedMembers the current set of used members, will be updated with the members in this positions.
   * @param start first member to write. Used to skip the common prefix with the previous position
   */
  private void writeMembers(final JsonGenerator json, final QueryAxis queryAxis, final List<Member> posMembers,
                            final UsedMembersSet usedMembers, final int start) throws IOException {
    json.writeStartArray();
    for (int i = start; i < posMembers.size(); ++i) {
      QueryHierarchy queryHierarchy = queryAxis.getHierarchies().get(i);
      Member m = posMembers.get(i);

      //
      // Writes the member itself
      json.writeStartObject();
      json.writeFieldName("member");

      Integer memberId = usedMembers.get(m);
      if (memberId == null) {
        // New member, writes the full member object
        memberId = usedMembers.add(m);
        json.writeStartObject();
        json.writeNumberField("id", memberId);
        json.writeStringField("caption", m.getCaption());
        json.writeNumberField("level", m.getDepth());
        json.writeStringField("uniqueName", m.getUniqueName());
        json.writeEndObject();
      } else {
        // Existing member, writes only the ID
        json.writeNumber(memberId);
      }

      //
      // For non-leaf nodes, writes the 'expanded' property
      try {
        if (!queryHierarchy.isLeaf(m)) {
          Member[] pos = new Member[i + 1];
          for (int p = 0; p < i + 1; ++p) {
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

  /**
   * Helper to find the common prefix between two positions.
   * @param current current position.
   * @param next next position
   * @return the length of the longest common prefix for both positions.
   */
  private int findCommonPrefix(final List<Member> current, final List<Member> next) {
    int i;
    for (i = 0; i < current.size(); ++i) {
      if (!current.get(i).equals(next.get(i))) {
        break;
      }
    }
    return i;
  }
}