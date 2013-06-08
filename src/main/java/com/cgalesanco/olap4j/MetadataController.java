package com.cgalesanco.olap4j;

import java.io.Serializable;

import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;

import org.olap4j.OlapException;
import org.olap4j.impl.IdentifierParser;
import org.olap4j.metadata.Cube;
import org.olap4j.metadata.Hierarchy;
import org.olap4j.metadata.Member;
import org.olap4j.metadata.NamedList;

@Path("/metadata")
public class MetadataController
{
  private Cube _cube;

  public MetadataController() {
    _cube = CubeProvider.getCube();
  }

  @GET
  @Path("/hierarchy/{hierarchyName}/roots")
  @Produces(MediaType.APPLICATION_JSON)
  public MemberInfo[] getRootMembers(@PathParam("hierarchyName")String hierarchyName) {
    try {
      final NamedList<Hierarchy> hierarchies = _cube.getHierarchies();
      Hierarchy h = hierarchies.get(hierarchyName);
      return getMemberInfos(h.getRootMembers());
    } catch(OlapException e) {
      throw new RuntimeException(e);
    }
  }

  @GET
  @Path("/member/{memberName}/children")
  @Produces(MediaType.APPLICATION_JSON)
  public MemberInfo[] getChildrenMembers(@PathParam("memberName")String memberUniqueName) {
    try {
      Member m = _cube.lookupMember(IdentifierParser.parseIdentifier(memberUniqueName));
      return getMemberInfos(m.getChildMembers());
    } catch (OlapException e) {
      throw new RuntimeException(e);
    }
  }

  private MemberInfo[] getMemberInfos(final NamedList<? extends Member> roots) {
    MemberInfo[] result = new MemberInfo[roots.size()];
    int i = 0;
    for(Member m : roots) {
      result[i++] = new MemberInfo(m);
    }
    return result;
  }

  private static class MemberInfo implements Serializable
  {
    private String _caption;
    private String _name;
    private String _uniqueName;
    private boolean _isLeaf;

    public MemberInfo(Member m) {
      _caption = m.getCaption();
      _name  = m.getName();
      _uniqueName = m.getUniqueName();
      try {
        _isLeaf = m.getChildMemberCount() == 0;
      } catch (OlapException e) {
        throw new RuntimeException(e);
      }
    }

    public boolean isLeaf() {
      return _isLeaf;
    }

    public String getName() {
      return _name;
    }

    public String getCaption() {
      return _caption;
    }

    public String getUniqueName() {
      return _uniqueName;
    }
  }
}
