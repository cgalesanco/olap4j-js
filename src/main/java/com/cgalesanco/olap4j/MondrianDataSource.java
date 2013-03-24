package com.cgalesanco.olap4j;

import java.io.PrintWriter;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.SQLFeatureNotSupportedException;
import java.util.logging.Logger;

import javax.sql.DataSource;

public class MondrianDataSource implements DataSource
{
  private String _url;

  @Override
  public Connection getConnection() throws SQLException {
    return getConnection(null, null);
  }

  @Override
  public Connection getConnection(final String username, final String password) throws SQLException {
    return DriverManager.getConnection(_url);
  }

  public void setJdbcUrl(String url) {
    _url = url;
  }

  @Override
  public PrintWriter getLogWriter() throws SQLException {
    return new PrintWriter(System.out);
  }

  @Override
  public void setLogWriter(final PrintWriter out) throws SQLException {
    //To change body of implemented methods use File | Settings | File Templates.
  }

  @Override
  public void setLoginTimeout(final int seconds) throws SQLException {
    //To change body of implemented methods use File | Settings | File Templates.
  }

  @Override
  public int getLoginTimeout() throws SQLException {
    return 0;  //To change body of implemented methods use File | Settings | File Templates.
  }

  @Override
  public Logger getParentLogger() throws SQLFeatureNotSupportedException {
    return null;  //To change body of implemented methods use File | Settings | File Templates.
  }

  @Override
  public <T> T unwrap(final Class<T> iface) throws SQLException {
    return null;  //To change body of implemented methods use File | Settings | File Templates.
  }

  @Override
  public boolean isWrapperFor(final Class<?> iface) throws SQLException {
    return false;  //To change body of implemented methods use File | Settings | File Templates.
  }
}
