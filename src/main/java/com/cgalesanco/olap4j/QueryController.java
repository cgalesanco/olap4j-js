package com.cgalesanco.olap4j;

import java.io.Serializable;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

import javax.naming.InitialContext;
import javax.naming.NamingException;
import javax.sql.DataSource;
import javax.ws.rs.FormParam;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import javax.xml.ws.WebServiceException;

import com.cgalesanco.olap4j.json.QueryCellSet;
import com.sun.jersey.spi.container.servlet.PerSession;
import es.cgalesanco.olap4j.query.Query;
import es.cgalesanco.olap4j.query.QueryAxis;
import es.cgalesanco.olap4j.query.QueryHierarchy;
import es.cgalesanco.olap4j.query.Selection;
import org.olap4j.Axis;
import org.olap4j.OlapConnection;
import org.olap4j.OlapException;
import org.olap4j.mdx.IdentifierNode;
import org.olap4j.metadata.Cube;
import org.olap4j.metadata.Hierarchy;
import org.olap4j.metadata.Member;
import org.olap4j.metadata.NamedList;

/**
 * JAX-RS resource providing access to an olap4j query stored in the user's session.
 */
@PerSession
@Path("/query")
public class QueryController
{
  private Query _query;

  /**
   * Creates and initializes a query
   */
  public QueryController() {
    _query = createQuery();
  }

  /**
   * Executes the query.
   * @return the CellSet result.
   */
  @GET
  @Produces(MediaType.APPLICATION_JSON)
  public QueryCellSet executeQuery() {
    return doExecuteQuery();
  }

  /**
   * Drills a position.
   * @param axisOrdinal the axis ordinal for the drilled position
   * @param memberIds the list of members for the drilled position
   * @return the CellSet result
   */
  @POST
  @Path("/drill")
  @Produces(MediaType.APPLICATION_JSON)
  public QueryCellSet drill(
    @FormParam("axis") int axisOrdinal,
    @FormParam("position[]") List<String> memberIds) {
    Member[] members = parsePosition(memberIds);
    Axis queryAxis = Axis.Factory.forOrdinal(axisOrdinal);
    _query.getAxis(queryAxis).drill(members);

    return doExecuteQuery();
  }

  /**
   * Undrills (collapse) a position
   * @param axisOrdinal the axis for the position to collapse
   * @param memberIds the list of members for the position to collapse
   * @return the CellSet result
   */
  @POST
  @Path("/undrill")
  @Produces(MediaType.APPLICATION_JSON)
  public QueryCellSet undrill(
    @FormParam("axis") int axisOrdinal,
    @FormParam("position[]") List<String> memberIds) {
    Member[] members = parsePosition(memberIds);
    Axis queryAxis = Axis.Factory.forOrdinal(axisOrdinal);
    _query.getAxis(queryAxis).undrill(members);

    return doExecuteQuery();
  }

  /**
   * Adds a new hierarchy to a query axis
   * @param axisOrdinal the axis where the hierarchy is to be added.
   * @param hierarchyName the unique name of the hierarchy to add.
   * @return the CellSet result
   */
  @POST
  @Path("/hierarchies/add")
  @Produces(MediaType.APPLICATION_JSON)
  public QueryCellSet addHierarchy(@FormParam("axis") int axisOrdinal, @FormParam("hierarchy") String hierarchyName) {
    try {
      QueryAxis axis = _query.getAxis(Axis.Factory.forOrdinal(axisOrdinal));
      final QueryHierarchy queryHierarchy = _query.getHierarchy(hierarchyName);
      for (Member root : queryHierarchy.getHierarchy().getRootMembers()) {
        queryHierarchy.include(Selection.Operator.DESCENDANTS, root);
      }
      axis.addHierarchy(queryHierarchy);

      return doExecuteQuery();
    } catch (OlapException e) {
      throw new WebServiceException(e);
    }
  }

  @POST
  @Path("hierarchies/move")
  @Produces(MediaType.APPLICATION_JSON)
  public QueryCellSet moveHierarchy(@FormParam("hierarchy") String hierarchyName,
                                    @FormParam("axis") int targetAxisOrdinal, @FormParam("position") int targetPos) {
    QueryHierarchy hierarchy = _query.getHierarchy(hierarchyName);
    QueryAxis axis = _query.getAxis(Axis.Factory.forOrdinal(targetAxisOrdinal));
    int hierarchySrcPos = axis.getHierarchies().indexOf(hierarchy);
    if ( hierarchySrcPos < 0 ) {
      axis.addHierarchy(hierarchy);
      hierarchySrcPos = axis.getHierarchies().size()-1;
    }
    if ( targetPos > hierarchySrcPos) {
      for(; targetPos > hierarchySrcPos; ++hierarchySrcPos ) {
        axis.pushDown(hierarchySrcPos);
      }
    } else if ( targetPos < hierarchySrcPos ) {
      for (; targetPos < hierarchySrcPos; --hierarchySrcPos) {
        axis.pullUp(hierarchySrcPos);
      }
    }

    return doExecuteQuery();
  }

  /**
   * Removes a hierarchy form an axis.
   * @param axisOrdinal The axis where the hierarchy is to be removed.
   * @param hierarchyName The unique name of the hierarchy to be removed.
   * @return the CellSet result
   */
  @POST
  @Path("/hierarchies/remove")
  @Produces(MediaType.APPLICATION_JSON)
  public QueryCellSet removeHierarchy(@FormParam("axis") int axisOrdinal, @FormParam("hierarchy") String hierarchyName) {
    QueryAxis axis = _query.getAxis(Axis.Factory.forOrdinal(axisOrdinal));
    QueryHierarchy hierarchy = _query.getHierarchy(hierarchyName);
    axis.removeHierarchy(hierarchy);

    return doExecuteQuery();
  }

  /**
   * All the hierarchies in the cube used by the current query.
   * @return The list of hierarchies
   */
  @GET
  @Path("/hierarchies")
  @Produces(MediaType.APPLICATION_JSON)
  public List<HierarchyInfo> getHierarchies() {
    final Cube cube = _query.getCube();
    List<HierarchyInfo> result = new ArrayList<HierarchyInfo>();
    for (Hierarchy h : cube.getHierarchies()) {
      result.add(new HierarchyInfo(h));
    }
    return result;
  }

  /**
   * Helper to execute the current query.
   * @return the CellSet result.
   */
  private QueryCellSet doExecuteQuery() {
    try {
      return new QueryCellSet(_query, _query.execute());
    } catch (OlapException e) {
      throw new WebServiceException(e);
    }
  }

  /**
   * Helper to parse a list of member unique names into the corresponding list of members.
   * @param memberIds the list of member unique names.
   * @return The corresponding list of members.
   */
  private Member[] parsePosition(final List<String> memberIds) {
    try {
      Cube cube = _query.getCube();
      Member[] members = new Member[memberIds.size()];
      for (int i = 0; i < members.length; ++i) {
        members[i] = cube.lookupMember(IdentifierNode.parseIdentifier(memberIds.get(i)).getSegmentList());
      }
      return members;
    } catch (OlapException e) {
      throw new WebServiceException(e);
    }
  }

  /**
   * Helper to initialize a query.
   * @return the new query.
   */
  private Query createQuery() {
    try {
      Connection oCn = getDataSource().getConnection();
      OlapConnection cn = oCn.unwrap(OlapConnection.class);
      NamedList<Cube> cubes = cn.getOlapSchema().getCubes();
      final Cube salesCube = cubes.get("Sales");
      Query q = new Query("q", salesCube);
      final QueryHierarchy storeDim = q.getHierarchy("Store");
      Member root = storeDim.getHierarchy().getRootMembers().get(0);
      storeDim.include(Selection.Operator.DESCENDANTS, root);
      q.getAxis(Axis.ROWS).addHierarchy(storeDim);

      final QueryHierarchy productHie = q.getHierarchy("Product");
      Member productRoot = productHie.getHierarchy().getRootMembers().get(0);
      productHie.include(Selection.Operator.DESCENDANTS, productRoot);
      final QueryAxis axis = q.getAxis(Axis.ROWS);
      axis.addHierarchy(productHie);

      final QueryHierarchy measuresHie = q.getHierarchy("Measures");
      for (Member measure : measuresHie.getHierarchy().getRootMembers()) {
        measuresHie.include(Selection.Operator.MEMBER, measure);
      }
      q.getAxis(Axis.COLUMNS).addHierarchy(measuresHie);
      return q;
    } catch (SQLException e) {
      throw new RuntimeException(e);
    }
  }

  /**
   * Helper to retrieve the olap4j data source from JNDI
   * @return the olap4j data source.
   */
  private DataSource getDataSource() {
    DataSource ds;
    try {
      InitialContext ctxt = new InitialContext();
      ds = (DataSource)ctxt.lookup("java:comp/env/jdbc/DB");
    } catch (NamingException e) {
      throw new RuntimeException(e);
    }
    return ds;
  }

  /**
   * DTO holding the information returned for a Hierarchy.
   */
  private class HierarchyInfo implements Serializable
  {
    public HierarchyInfo(Hierarchy h) {
      _uniqueName = h.getUniqueName();
      _caption = h.getCaption();
    }

    @SuppressWarnings("unused")
    public String getUniqueName() {
      return _uniqueName;
    }

    @SuppressWarnings("unused")
    public String getCaption() {
      return _caption;
    }

    private String _uniqueName;
    private String _caption;
  }
}
