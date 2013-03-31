package com.cgalesanco.olap4j.json;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import es.cgalesanco.olap4j.query.Query;
import es.cgalesanco.olap4j.query.QueryAxis;
import es.cgalesanco.olap4j.query.QueryHierarchy;
import org.codehaus.jackson.Version;
import org.codehaus.jackson.map.ObjectMapper;
import org.codehaus.jackson.map.SerializationConfig;
import org.codehaus.jackson.map.module.SimpleModule;
import org.junit.Before;
import org.junit.Test;
import org.olap4j.Axis;
import org.olap4j.CellSetAxis;
import org.olap4j.OlapException;
import org.olap4j.Position;
import org.olap4j.metadata.Hierarchy;
import org.olap4j.metadata.Member;

import static junit.framework.Assert.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link QueryCellSetAxisSerializer}
 */
public class QueryCellSetAxisSerializerTest
{
  private ObjectMapper _objectMapper;

  /**
   * Creates and {@link ObjectMapper} used for testing.
   * The object mapper is configured to ignore Jackson annotations and use only the {@link QueryCellSetAxisSerializer}.
   */
  @Before
  public void setUp() {
    _objectMapper = new ObjectMapper();
    _objectMapper.configure(SerializationConfig.Feature.USE_ANNOTATIONS, false);
    SimpleModule testModule = new SimpleModule("TestModule", new Version(1,0,0,null));
    testModule.addSerializer(new QueryCellSetAxisSerializer());
    _objectMapper.registerModule(testModule);
  }


  /**
   * It serializes a hierarchies property describing the hierarchies in the serialized axis.
   */
  @Test
  public void testHierarchies() throws IOException, OlapException {
    QueryCellSetAxis queryCellSetAxis = createQueryCellSetAxis(
      new String[]{"First", "Second"},
      new String[0][][]
    );

    final ByteArrayOutputStream os = new ByteArrayOutputStream();
    _objectMapper.writeValue(os, queryCellSetAxis);

    assertEquals(
      ("{'hierarchies':[" +
        "{'uniqueName':'First','caption':'Caption First'}," +
        "{'uniqueName':'Second','caption':'Caption Second'}" +
        "]," +
        "'positions':null}").replace('\'', '"'),
      new String(os.toByteArray()));
  }

  /**
   * <p>It serializes a positions property with an array for every position.</p>
   * <p>Each positions is itself an array of member objects</p>
   */
  @Test
  public void testPositions() throws IOException, OlapException {
    QueryCellSetAxis queryCellSetAxis = createQueryCellSetAxis(
      new String[]{"First", "Second"},
      new String[][][]{
        {{"Root H1",  "0", "leaf", null},{"Root H2",  "0", "leaf", null}},
        {{"Child H1", "1", "leaf", null},{"Child H2", "2", "leaf", null}}
      }
    );

    final ByteArrayOutputStream os = new ByteArrayOutputStream();
    _objectMapper.writeValue(os, queryCellSetAxis);

    assertEquals(
      ("{'hierarchies':[" +
        "{'uniqueName':'First','caption':'Caption First'}," +
        "{'uniqueName':'Second','caption':'Caption Second'}" +
        "]," +
        "'positions':[" +
        "[{'member':{'id':1,'caption':'Caption Root H1','level':0,'uniqueName':'Root H1'}}," +
        "{'member':{'id':2,'caption':'Caption Root H2','level':0,'uniqueName':'Root H2'}}]," +
        "[{'member':{'id':3,'caption':'Caption Child H1','level':1,'uniqueName':'Child H1'}}," +
        "{'member':{'id':4,'caption':'Caption Child H2','level':2,'uniqueName':'Child H2'}}]" +
        "]}").replace('\'', '"'),
      new String(os.toByteArray()));

  }

  /**
   * <p>It replaces a member spec with its id when that member has been serialized in a previous position.</p>
   */
  @Test
  public void testUsedMemberIdReplacement() throws IOException, OlapException {
    QueryCellSetAxis queryCellSetAxis = createQueryCellSetAxis(
      new String[]{"First", "Second"},
      new String[][][]{
        {{"Root H1",  "0", "leaf", null},{"Root H2",  "0", "leaf", null}},
        {{"Child H1",  "1", "leaf", null},{"Root H2", "0", "leaf", null}}
      }
    );

    final ByteArrayOutputStream os = new ByteArrayOutputStream();
    _objectMapper.writeValue(os, queryCellSetAxis);

    assertEquals(
      ("{'hierarchies':[" +
        "{'uniqueName':'First','caption':'Caption First'}," +
        "{'uniqueName':'Second','caption':'Caption Second'}" +
        "]," +
        "'positions':[" +
        "[{'member':{'id':1,'caption':'Caption Root H1','level':0,'uniqueName':'Root H1'}}," +
        "{'member':{'id':2,'caption':'Caption Root H2','level':0,'uniqueName':'Root H2'}}]," +
        "[{'member':{'id':3,'caption':'Caption Child H1','level':1,'uniqueName':'Child H1'}}," +
        "{'member':2}]" +
        "]}").replace('\'', '"'),
      new String(os.toByteArray()));

  }

  /**
   * <p>It doesn't generates a if it, and every previous member in the position, are the same in
   * the previous positions.</p>
   */
  @Test
  public void testExpandedIndicator() throws IOException, OlapException {
    QueryCellSetAxis queryCellSetAxis = createQueryCellSetAxis(
      new String[]{"First", "Second"},
      new String[][][]{
        {{"Root H1",  "0", "non-leaf", "expanded"},{"Root H2",  "0", "non-leaf", "collapsed"}}
      }
    );

    final ByteArrayOutputStream os = new ByteArrayOutputStream();
    _objectMapper.writeValue(os, queryCellSetAxis);

    assertEquals(
      ("{'hierarchies':[" +
        "{'uniqueName':'First','caption':'Caption First'}," +
        "{'uniqueName':'Second','caption':'Caption Second'}" +
        "]," +
        "'positions':[" +
        "[{'member':{'id':1,'caption':'Caption Root H1','level':0,'uniqueName':'Root H1'},'expanded':true}," +
         "{'member':{'id':2,'caption':'Caption Root H2','level':0,'uniqueName':'Root H2'},'expanded':false}]" +
        "]}").replace('\'', '"'),
      new String(os.toByteArray()));

  }

  /**
   * <p>It generates an expanded property for non-leaf nodes. This property is true for drilled-in nodes, and
   * false for collapsed nodes.</p>
   */
  @Test
  public void testMemberGrouping() throws IOException, OlapException {
    QueryCellSetAxis queryCellSetAxis = createQueryCellSetAxis(
      new String[]{"First", "Second", "Third"},
      new String[][][]{
        {{"Root H1",  "0", "leaf", null},{"Root H2",  "0", "leaf", null},{"Root H3",  "0", "leaf", null}},
        {{"Root H1",  "0", "leaf", null},{"Child H2", "2", "leaf", null},{"Child H3", "2", "leaf", null}},
        {{"Root H1",  "0", "leaf", null},{"Child H2", "2", "leaf", null},{"Other Child H3", "2", "leaf", null}},
      }
    );

    final ByteArrayOutputStream os = new ByteArrayOutputStream();
    _objectMapper.writeValue(os, queryCellSetAxis);

    assertEquals(
      ("{'hierarchies':[" +
        "{'uniqueName':'First','caption':'Caption First'}," +
        "{'uniqueName':'Second','caption':'Caption Second'}," +
        "{'uniqueName':'Third','caption':'Caption Third'}" +
        "]," +
        "'positions':[" +
        "[{'member':{'id':1,'caption':'Caption Root H1','level':0,'uniqueName':'Root H1'}}," +
        "{'member':{'id':2,'caption':'Caption Root H2','level':0,'uniqueName':'Root H2'}}," +
        "{'member':{'id':3,'caption':'Caption Root H3','level':0,'uniqueName':'Root H3'}}]," +
        "[{'member':{'id':4,'caption':'Caption Child H2','level':2,'uniqueName':'Child H2'}}," +
        "{'member':{'id':5,'caption':'Caption Child H3','level':2,'uniqueName':'Child H3'}}]," +
        "[{'member':{'id':6,'caption':'Caption Other Child H3','level':2,'uniqueName':'Other Child H3'}}]" +
        "]}").replace('\'', '"'),
      new String(os.toByteArray()));

  }

  /**
   * Helper to crate a stubbed <code>QueryCellSetAxis</code>.
   *
   * @param hierarchyNames array of hierarchy names used to generate the hierarchies.
   * @param membersSpec bi-dimensional array of <code>Member</code> specifications used to generate positions in the
   *                    <code>CellSetAxis</code>. Each member specification is itself a String array with the following
   *                    structure:
   *                    <ol>
   *                      <li>Member name</li>
   *                      <li>Member depth (integer)</li>
   *                      <li>Leaf node: 'leaf' for a leaf node, non-leaf node otherwise</li>
   *                      <li>Expanded node: 'expanded' for an expanded node, collapsed node otherwise</li>
   *                    </ol>
   * @return the stubbed <code>QueryCellSetAxis</code> instance.
   */
  private QueryCellSetAxis createQueryCellSetAxis(String[] hierarchyNames, String[][][] membersSpec) throws OlapException {
    Query q = mock(Query.class);
    List<QueryHierarchy> hierarchies = createMockHierarchies(q, hierarchyNames);
    QueryAxis queryAxis = mock(QueryAxis.class);
    CellSetAxis cellSetAxis = mock(CellSetAxis.class);
    when(cellSetAxis.getAxisOrdinal()).thenReturn(Axis.COLUMNS);
    when(q.getAxis(Axis.COLUMNS)).thenReturn(queryAxis);
    when(queryAxis.getHierarchies()).thenReturn(hierarchies);
    int i = 0;
    for(QueryHierarchy qh : hierarchies) {
      String name = hierarchyNames[i++];
      when(q.getHierarchy(name)).thenReturn(qh);
    }

    Position[] positions = new Position[membersSpec.length];
    Map<String, Member> usedMembers = new HashMap<String, Member>();
    int pIdx = 0;
    for (String[][] p : membersSpec) {
      int mIdx = 0;
      Member[] members = new Member[membersSpec[0].length];
      for (String[] m : p) {
        Member prevMember = usedMembers.get(m[0]);
        if ( prevMember != null ) {
          members[mIdx] = prevMember;
        } else {
          members[mIdx] = createMember(m[0], Integer.parseInt(m[1]));
          usedMembers.put(m[0], members[mIdx]);
        }

        QueryHierarchy qh = hierarchies.get(mIdx);
        when(qh.isLeaf(members[mIdx])).thenReturn("leaf".equals(m[2]));
        when(queryAxis.isDrilled(members[mIdx])).thenReturn("expanded".equals(m[3]));

        mIdx++;
      }
      positions[pIdx++] = createPosition(members);
    }

    when(cellSetAxis.getPositions()).thenReturn(Arrays.asList(positions));
    when(cellSetAxis.getPositionCount()).thenReturn(positions.length);

    return new QueryCellSetAxis(q, cellSetAxis);
  }

  /**
   * Helper method to create a member.
   * @param name unique name for the member.
   * @param depth member's depth.
   * @return the stubbed member.
   */
  private Member createMember(String name, int depth) {
    Member m = mock(Member.class);
    when(m.getUniqueName()).thenReturn(name);
    when(m.getCaption()).thenReturn(String.format("Caption %1$s", name));
    when(m.getDepth()).thenReturn(depth);
    return m;
  }

  /**
   * Helper method to create a position.
   * @param members array of members to be contained in the position.
   * @return the stubbed position.
   */
  private Position createPosition(Member...members) {
    Position p = mock(Position.class);
    when(p.getMembers()).thenReturn(Arrays.asList(members));
    return p;
  }

  /**
   * Helper method to create a <code>QueryHierarchy</code> instance.
   * @param q the <code>Query</code> owning the hierarchies.
   * @param names array of hierarchy names.
   * @return a list of stubbed hierarchies.
   */
  private List<QueryHierarchy> createMockHierarchies(Query q, String[] names) {
    List<QueryHierarchy> hierarchies = new ArrayList<QueryHierarchy>(names.length);

    for(String name : names) {
      QueryHierarchy qh = mock(QueryHierarchy.class);
      Hierarchy h = mock(Hierarchy.class);
      when(qh.getHierarchy()).thenReturn(h);
      when(h.getUniqueName()).thenReturn(name);
      when(h.getCaption()).thenReturn("Caption "+name);
      when(q.getHierarchy(name)).thenReturn(qh);

      hierarchies.add(qh);
    }
    return hierarchies;
  }
}
