package com.cgalesanco.olap4j;

import com.cgalesanco.olap4j.json.QueryCellSetSerializer;
import es.cgalesanco.olap4j.query.Query;
import org.codehaus.jackson.map.annotate.JsonSerialize;
import org.olap4j.CellSet;

@JsonSerialize(using = QueryCellSetSerializer.class)
public class QueryCellSet
{
  private final Query _query;
  private final CellSet _cellSet;

  public QueryCellSet(final Query query, final CellSet cellSet) {
    _query = query;
    _cellSet = cellSet;
  }

  public Query getQuery() {
    return _query;
  }

  public CellSet getCellSet() {
    return _cellSet;
  }
}
