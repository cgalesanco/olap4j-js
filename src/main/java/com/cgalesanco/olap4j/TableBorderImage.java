package com.cgalesanco.olap4j;

import java.awt.*;
import java.awt.geom.Path2D;
import java.awt.image.BufferedImage;
import java.io.IOException;

import javax.imageio.ImageIO;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

public class TableBorderImage extends HttpServlet
{
  protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
    String name = request.getRequestURI().substring(request.getContextPath().length()+1);
    String[] nameParts = name.split("[_\\.]");

    int width = Integer.parseInt(nameParts[1]);
    int height = Integer.parseInt(nameParts[2]);

    BufferedImage image = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
    Graphics2D gr = (Graphics2D) image.getGraphics();
    gr.setRenderingHint(
      RenderingHints.KEY_ANTIALIASING,
      RenderingHints.VALUE_ANTIALIAS_OFF);
    gr.setColor(Color.WHITE);
    gr.fillRect(0, 0, width+1, height);

    gr.setColor(new Color(0xdd,0xdd,0xdd));
    Path2D.Double path = new Path2D.Double();
    path.moveTo(0,0);
    path.curveTo(width/2,0,width/2,height/4,width/2,height/2);
    path.curveTo(width/2,3*height/4,width/2,height,width-1,height-1);
    gr.draw(path);
    response.setContentType("image/png");
    ImageIO.write(image, "PNG", response.getOutputStream());
  }
}
