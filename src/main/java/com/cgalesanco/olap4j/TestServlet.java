package com.cgalesanco.olap4j;

import java.io.IOException;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.cgalesanco.olap4j.json.CellSetAxisMapper;
import es.cgalesanco.olap4j.query.Query;
import es.cgalesanco.olap4j.query.QueryAxis;
import es.cgalesanco.olap4j.query.QueryHierarchy;
import es.cgalesanco.olap4j.query.Selection;
import org.codehaus.jackson.JsonFactory;
import org.codehaus.jackson.JsonGenerator;
import org.olap4j.Axis;
import org.olap4j.Cell;
import org.olap4j.CellSet;
import org.olap4j.CellSetAxis;
import org.olap4j.OlapConnection;
import org.olap4j.OlapException;
import org.olap4j.mdx.IdentifierNode;
import org.olap4j.metadata.Cube;
import org.olap4j.metadata.Member;
import org.olap4j.metadata.NamedList;

public class TestServlet extends HttpServlet
{
  protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
    try {
      Query query = (Query) request.getSession().getAttribute("query");
      String position;
      String op = request.getParameter("operation");
      boolean isDrill = "drill".equals(op);

      String[] memberIds = request.getParameterValues("position[]");
      Cube cube = query.getCube();
      Member[] members = new Member[memberIds.length];
      for (int i = 0; i < members.length; ++i) {
        members[i] = cube.lookupMember(IdentifierNode.parseIdentifier(memberIds[i]).getSegmentList());
      }
      Axis axis = Axis.Factory.forOrdinal(Integer.parseInt(request.getParameter("axis")));
      if ( isDrill )
        query.getAxis(axis).drill(members);
      else
        query.getAxis(axis).undrill(members);

      executeQuery(response, query);
    } catch (OlapException e) {
      throw new ServletException(e);
    }
  }

  protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
    OlapConnection cn = null;
    try {
      Class.forName("mondrian.olap4j.MondrianOlap4jDriver");
      Connection oCn = DriverManager.getConnection(
        "jdbc:mondrian:" +
          "JdbcDrivers=org.apache.derby.jdbc.EmbeddedDriver;" +
          "Jdbc=jdbc:derby:/Users/cesar/foodmart;" +
          "JdbcUser=sa;JdbcPassword=;" +
          "Catalog=file:/Users/cesar/FoodMart.xml");
      cn = oCn.unwrap(OlapConnection.class);
      NamedList<Cube> cubes = cn.getOlapSchema().getCubes();
      final Cube salesCube = cubes.get("Sales");

      Query q = new Query("q", salesCube);
      request.getSession().setAttribute("query", q);
      final QueryHierarchy storeDim = q.getHierarchy("Store");
      Member root = storeDim.getHierarchy().getRootMembers().get(0);
      storeDim.include(Selection.Operator.DESCENDANTS, root);
      q.getAxis(Axis.ROWS).addHierarchy(storeDim);

      final QueryHierarchy productHie = q.getHierarchy("Product");
      Member productRoot = productHie.getHierarchy().getRootMembers().get(0);
      productHie.include(Selection.Operator.DESCENDANTS, productRoot);
      q.getAxis(Axis.ROWS).addHierarchy(productHie);

      final QueryHierarchy measuresHie = q.getHierarchy("Measures");
      for (Member measure : measuresHie.getHierarchy().getRootMembers()) {
        measuresHie.include(Selection.Operator.MEMBER, measure);
      }
      q.getAxis(Axis.COLUMNS).addHierarchy(measuresHie);

      executeQuery(response, q);
    } catch (Exception e) {
      throw new ServletException(e);
    }
  }

  private void executeQuery(final HttpServletResponse response, final Query q) throws OlapException, IOException {
    CellSet cs = q.execute();
    CellSetAxisMapper mapper = new CellSetAxisMapper();
    response.setContentType("application/json");
    JsonGenerator json = new JsonFactory().createJsonGenerator(response.getOutputStream());
    json.writeStartObject();

    json.writeFieldName("colsAxis");
    CellSetAxis colsAxis = cs.getAxes().get(Axis.COLUMNS.axisOrdinal());
    mapper.toJson(json, q, colsAxis);

    json.writeFieldName("rowsAxis");
    CellSetAxis rowsAxis = cs.getAxes().get(Axis.ROWS.axisOrdinal());
    mapper.toJson(json, q, rowsAxis);

    json.writeFieldName("data");
    int columnCount = colsAxis.getPositionCount();
    int rowCount = rowsAxis.getPositionCount();
    json.writeStartArray();
    for(int row = 0; row < rowCount; ++row) {
      json.writeStartArray();
      for(int col = 0; col < columnCount; ++col) {
        Cell cell = cs.getCell(row*columnCount+col);
        if ( cell.isEmpty() ) {
          json.writeString("");
        } else if ( cell.isNull() ) {
          json.writeNull();
        } else {
          json.writeNumber(cell.getDoubleValue());
        }
      }
      json.writeEndArray();
    }
    json.writeEndArray();

    json.writeEndObject();
    json.flush();
  }
}
