package com.cgalesanco.olap4j;

import java.sql.Connection;
import java.sql.SQLException;

import javax.naming.InitialContext;
import javax.naming.NamingException;
import javax.sql.DataSource;

import org.olap4j.OlapConnection;
import org.olap4j.metadata.Cube;
import org.olap4j.metadata.NamedList;

public class CubeProvider
{
  private CubeProvider() {}

  synchronized public static Cube getCube() {
    if ( _cube == null ) {
      _cube = createCube();
    }
    return _cube;
  }

  /**
   * Helper to initialize a cube.
   * @return the new cube.
   */
  private static Cube createCube() {
    try {
      Connection oCn = getDataSource().getConnection();
      OlapConnection cn = oCn.unwrap(OlapConnection.class);
      NamedList<Cube> cubes = cn.getOlapSchema().getCubes();
      return cubes.get("Sales");
    } catch (SQLException e) {
      throw new RuntimeException(e);
    }
  }

  /**
   * Helper to retrieve the olap4j data source from JNDI
   * @return the olap4j data source.
   */
  private static DataSource getDataSource() {
    DataSource ds;
    try {
      InitialContext ctxt = new InitialContext();
      ds = (DataSource)ctxt.lookup("java:comp/env/jdbc/DB");
    } catch (NamingException e) {
      throw new RuntimeException(e);
    }
    return ds;
  }

  private static Cube _cube;
}
