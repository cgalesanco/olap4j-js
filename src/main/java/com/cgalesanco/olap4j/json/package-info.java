/**
 * <p>Provides the DTO's used for JSON serialization and the JSON serializer themselves.</p>
 * <h2>Schema for the generated JSON</h2>
 * <p>The JSON version of a {@link org.olap4j.CellSet} has the following structure</p>
 * <pre>
 *   {
 *     "axes": <em>array of axis</em>
 *     "data": <em>N-dimensional array of values represented as strings. N == axes.length</em>
 *   }
 * </pre>
 * <p>Each axis itself has the following structure</p>
 * <pre>
 *   {
 *     "hierarchies": <em>array of hierarchies</em>
 *     "positions": <em>array of axis positions</em>
 *   }
 * </pre>
 * <p>Where a hierarchy</p>
 * <pre>
 *   {
 *     "name": <em>String - the hierarchy unique name
 *     "caption": <em>String - the hierarchy caption</em>
 *   }
 * </pre>
 * <p>And an axis position</p>
 * <pre>
 *   {
 *     "member": <em>Member description, if this is the first time the member appears, or a member id (int)</em>
 *     "expanded": <em>boolean, undefined for leaf nodes</em>
 *   }
 * </pre>
 */
package com.cgalesanco.olap4j.json;