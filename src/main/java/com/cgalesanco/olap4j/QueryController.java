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

@PerSession
@Path("/query")
public class QueryController
{
  private Query _query;

  public QueryController() {
    _query = createQuery();
  }

  @GET
  @Produces(MediaType.APPLICATION_JSON)
  public QueryCellSet executeQuery() {
    return doExecuteQuery();
  }

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
  @Path("/hierarchies/remove")
  @Produces(MediaType.APPLICATION_JSON)
  public QueryCellSet removeHierarchy(@FormParam("axis") int axisOrdinal, @FormParam("hierarchy") String hierarchyName) {
    QueryAxis axis = _query.getAxis(Axis.Factory.forOrdinal(axisOrdinal));
    QueryHierarchy hierarchy = _query.getHierarchy(hierarchyName);
    axis.removeHierarchy(hierarchy);

    return doExecuteQuery();
  }

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

  private QueryCellSet doExecuteQuery() {
    try {
      return new QueryCellSet(_query, _query.execute());
    } catch (OlapException e) {
      throw new WebServiceException(e);
    }
  }

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

  private DataSource getDataSource() {
    DataSource ds;
    try {
      InitialContext ctxt = new InitialContext();
      ds = (DataSource)ctxt.lookup("jdbc/DB");
    } catch (NamingException e) {
      throw new RuntimeException(e);
    }
    return ds;
  }

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
