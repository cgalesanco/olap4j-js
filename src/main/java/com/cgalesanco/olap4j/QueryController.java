package com.cgalesanco.olap4j;

import java.io.Serializable;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

import javax.annotation.Resource;
import javax.naming.InitialContext;
import javax.naming.NamingException;
import javax.sql.DataSource;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import javax.xml.ws.WebServiceException;

import org.olap4j.OlapConnection;
import org.olap4j.metadata.Cube;
import org.olap4j.metadata.Hierarchy;
import org.olap4j.metadata.NamedList;

@Path("/query")
public class QueryController
{
  private DataSource _ds;

  @Resource(name = "jdbc/db")
  public void setDataSource(DataSource ds) {
    _ds = ds;
  }

  public DataSource getDataSource() {
    if ( _ds == null ) {
      InitialContext ctxt = null;
      try {
        ctxt = new InitialContext();
        _ds = (DataSource)ctxt.lookup("jdbc/DB");
      } catch (NamingException e) {
        throw new RuntimeException(e);
      }
    }
    return _ds;
  }

  @GET
  @Path("/hierarchies")
  @Produces(MediaType.APPLICATION_JSON)
  public List<HierarchyInfo> getHierarchies() {
    Connection oCn = null;
    OlapConnection cn = null;
    List<HierarchyInfo> result = new ArrayList<HierarchyInfo>();
    try {
      oCn = getDataSource().getConnection();
      cn = oCn.unwrap(OlapConnection.class);
      NamedList<Cube> cubes = cn.getOlapSchema().getCubes();
      final Cube salesCube = cubes.get("Sales");
      for (Hierarchy h : salesCube.getHierarchies()) {
        result.add(new HierarchyInfo(h));
      }

    } catch (SQLException e) {
      throw new WebServiceException(e);
    } finally {
      try {
      if (cn != null) {
        cn.close();
      }
      if (oCn != null) {
        oCn.close();
      }
      } catch(SQLException e) {
        // TODO log error on close
      }

    }
    return result;
  }

  private class HierarchyInfo implements Serializable
  {
    public HierarchyInfo(Hierarchy h) {
      _uniqueName = h.getUniqueName();
      _caption = h.getCaption();
    }

    public String getUniqueName() {
      return _uniqueName;
    }

    public String getCaption() {
      return _caption;
    }

    private String _uniqueName;
    private String _caption;
  }
}
