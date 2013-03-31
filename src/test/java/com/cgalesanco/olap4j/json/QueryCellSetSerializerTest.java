package com.cgalesanco.olap4j.json;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.ListIterator;

import es.cgalesanco.olap4j.query.Query;
import org.codehaus.jackson.JsonGenerator;
import org.codehaus.jackson.Version;
import org.codehaus.jackson.map.JsonSerializer;
import org.codehaus.jackson.map.ObjectMapper;
import org.codehaus.jackson.map.SerializationConfig;
import org.codehaus.jackson.map.SerializerProvider;
import org.codehaus.jackson.map.module.SimpleModule;
import org.junit.Before;
import org.junit.Test;
import org.mockito.invocation.InvocationOnMock;
import org.mockito.stubbing.Answer;
import org.olap4j.Axis;
import org.olap4j.Cell;
import org.olap4j.CellSet;
import org.olap4j.CellSetAxis;
import org.olap4j.CellSetAxisMetaData;
import org.olap4j.Position;

import static junit.framework.Assert.assertEquals;
import static org.mockito.Matchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link QueryCellSetSerializer}
 */
public class QueryCellSetSerializerTest
{
  private ObjectMapper _objectMapper;

  /**
   * Serializer stub for {@link QueryCellSetAxis}.
   * Generates a string with the axis ordinal: 'ROWS', 'COLUMN', etc.
   */
  static private class TestAxisSerializer extends JsonSerializer<QueryCellSetAxis> {
    @Override
    public Class<QueryCellSetAxis> handledType() {
      return QueryCellSetAxis.class;
    }

    @Override
    public void serialize(final QueryCellSetAxis value, final JsonGenerator json, final SerializerProvider provider) throws IOException {
      json.writeString(value.getAxis().getAxisOrdinal().name());
    }
  }

  /**
   * Stub implementation for a {@link CellSetAxis}.
   */
  static private class MockCellSetAxis implements CellSetAxis
  {
    private final int _positionCount;
    private final Axis _axis;

    public MockCellSetAxis(Axis axis, int positionCount) {
      _axis = axis;
      _positionCount = positionCount;
    }

    @Override
    public Axis getAxisOrdinal() {
      return _axis;
    }

    @Override
    public CellSet getCellSet() {
      throw new RuntimeException("Not implemented");
    }

    @Override
    public CellSetAxisMetaData getAxisMetaData() {
      throw new RuntimeException("Not implemented");
    }

    @Override
    public List<Position> getPositions() {
      throw new RuntimeException("Not implemented");
    }

    @Override
    public int getPositionCount() {
      return _positionCount;
    }

    @Override
    public ListIterator<Position> iterator() {
      throw new RuntimeException("Not implemented");
    }
  }

  /**
   * Creates and {@link ObjectMapper} used for testing.
   * The object mapper is configured to ignore Jackson annotations, use the {@link QueryCellSetSerializer} and
   * use a {@link TestAxisSerializer} instance to serialize instances of {@link QueryCellSetAxis}.
   */
  @Before
  public void setUp() {
    _objectMapper = new ObjectMapper();
    _objectMapper.configure(SerializationConfig.Feature.USE_ANNOTATIONS, false);

    SimpleModule testModule = new SimpleModule("TestModule", new Version(1,0,0,null));
    testModule.addSerializer(new QueryCellSetSerializer());
    testModule.addSerializer(new TestAxisSerializer());
    _objectMapper.registerModule(testModule);
  }

  /**
   * <p>For a cellset with ROWS and COLUMNS axes, the serializer writes:</p>
   * <li>
   *  <ul>an 'axes' property with an array of QueryCellSetAxis serializations</ul>
   *  <ul>a 'data' property with a bi-dimensional array with values</ul>
   * </li>
   */
  @Test
  public void testRowsColumnsCellSet() throws IOException {
    final String[][] data = new String[][]{
      {"1","2"},
      {"3.14",""}
    };
    final QueryCellSet queryCellSet = createMockCellSet(data);

    final ByteArrayOutputStream os = new ByteArrayOutputStream();
    _objectMapper.writeValue(os, queryCellSet);

    assertEquals(
      "{'axes':['COLUMNS','ROWS'],'data':[['1','2'],['3.14','']]}".replace('\'', '"'),
      new String(os.toByteArray()));
  }

  /**
   * <p>For a cellset with only a COLUMNS axis, the serializer writes:</p>
   * <li>
   *  <ul>an 'axes' property with an array of QueryCellSetAxis serializations</ul>
   *  <ul>a 'data' property with a uni-dimensional array with values</ul>
   * </li>
   */
  @Test
  public void testColumnsOnlyCellSet() throws IOException {
    final String[] data = new String[]{
      "1","2"
    };
    final QueryCellSet queryCellSet = createMockColumnsOnlyCellSet(data);

    final ByteArrayOutputStream os = new ByteArrayOutputStream();
    _objectMapper.writeValue(os, queryCellSet);

    assertEquals(
      "{'axes':['COLUMNS'],'data':['1','2']}".replace('\'', '"'),
      new String(os.toByteArray()));
  }

  /**
   * <p>For a cellset with now axis, the serializer writes:</p>
   * <li>
   *  <ul>an 'axes' property with an array of QueryCellSetAxis serializations</ul>
   *  <ul>a null 'data' property</ul>
   * </li>
   */
  @Test
  public void testEmptyCellSet() throws IOException {
    final QueryCellSet queryCellSet = createMockEmptyCellSet();

    final ByteArrayOutputStream os = new ByteArrayOutputStream();
    _objectMapper.writeValue(os, queryCellSet);

    assertEquals(
      "{'axes':[],'data':null}".replace('\'', '"'),
      new String(os.toByteArray()));
  }

  /**
   * Helper to create a bi-dimensional CellSet
   * @param data a bi-dimensional string array with stubbed values.
   * @return the stubbed <code>QueryCellSet</code> instance.
   */
  @SuppressWarnings("unchecked")
  private QueryCellSet createMockCellSet(final String[][] data) {
    CellSet qCs = mock(CellSet.class);

    List<CellSetAxis> axes = Arrays.asList(
      new MockCellSetAxis(Axis.COLUMNS, data[0].length),
      (CellSetAxis)new MockCellSetAxis(Axis.ROWS, data.length)
    );
    when(qCs.getAxes()).thenReturn(axes);
    when(qCs.getCell(any(List.class))).thenAnswer(new Answer<Object>()
    {
      @Override
      @SuppressWarnings("unchecked")
      public Object answer(final InvocationOnMock invocation) throws Throwable {
        List<Integer> position = (List<Integer>)invocation.getArguments()[0];
        Cell cell = mock(Cell.class);
        when(cell.getFormattedValue()).thenReturn(data[position.get(1)][position.get(0)]);
        return cell;
      }
    });

    Query query = mock(Query.class);
    return new QueryCellSet(query, qCs);
  }

  /**
   * Helper to create a uni-dimensional CellSet
   * @param data a uni-dimensional string array with stubbed values.
   * @return the stubbed <code>QueryCellSet</code> instance.
   */
  @SuppressWarnings("unchecked")
  private QueryCellSet createMockColumnsOnlyCellSet(final String[] data) {
    CellSet qCs = mock(CellSet.class);

    List<CellSetAxis> axes = Arrays.asList(
      (CellSetAxis)new MockCellSetAxis(Axis.COLUMNS, data.length)
    );
    when(qCs.getAxes()).thenReturn(axes);
    when(qCs.getCell(any(List.class))).thenAnswer(new Answer<Object>()
    {
      @Override
      public Object answer(final InvocationOnMock invocation) throws Throwable {
        List<Integer> position = (List<Integer>)invocation.getArguments()[0];
        Cell cell = mock(Cell.class);
        when(cell.getFormattedValue()).thenReturn(data[position.get(0)]);
        return cell;
      }
    });

    Query query = mock(Query.class);
    return new QueryCellSet(query, qCs);
  }

  /**
   * Helper to create an empty CellSet
   * @return the stubbed <code>QueryCellSet</code> instance.
   */
  private QueryCellSet createMockEmptyCellSet() {
    CellSet qCs = mock(CellSet.class);

    List<CellSetAxis> axes = Collections.emptyList();
    when(qCs.getAxes()).thenReturn(axes);

    Query query = mock(Query.class);
    return new QueryCellSet(query, qCs);
  }
}
