package com.cgalesanco.olap4j.json;

import es.cgalesanco.olap4j.query.Query;
import org.codehaus.jackson.map.annotate.JsonSerialize;
import org.olap4j.CellSetAxis;

/**
 * JSON DTO for a {@link CellSetAxis} instance.
 * Holds both, the {@link CellSetAxis} instance itself, and the {@link Query} instance used to generate it. The later is
 * required to compute the expanded/collapsed and leaf states, for the axis member.
 */
@JsonSerialize(using = QueryCellSetAxisSerializer.class)
public class QueryCellSetAxis
{
  private Query _query;
  private CellSetAxis _axis;

  public QueryCellSetAxis(final Query q, final CellSetAxis axis) {
    _query = q;
    _axis = axis;
  }

  public Query getQuery() {
    return _query;
  }

  public CellSetAxis getAxis() {
    return _axis;
  }
}
