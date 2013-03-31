package com.cgalesanco.olap4j.json;

import es.cgalesanco.olap4j.query.Query;
import org.codehaus.jackson.map.annotate.JsonSerialize;
import org.olap4j.CellSet;

/**
 * JSON DTO for a {@link CellSet} instance.
 * Holds both, the {@link CellSet} instance itself, and the {@link Query} instance used to generate it. The later is
 * required to compute the expanded/collapsed and leaf states, for the axis member.
 */
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
