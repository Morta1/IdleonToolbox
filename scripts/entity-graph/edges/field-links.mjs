// A page field that names another page by id (utility/wiki/field-links.mjs) is an edge like any other,
// so the named page lists the field's page back. No meta: the field already says the level or the
// detail, and an empty meta lets two mirrored fields of one edge collapse in the build's dedupe.
import { fieldLinkEdge, fieldLinks } from '../../../utility/wiki/field-links.mjs';

export const fieldLinkEdges = (nodes) => Object.entries(nodes).flatMap(([id, node]) => fieldLinks(node)
  .map((link) => ({ ...fieldLinkEdge(id, link), meta: {}, source: 'field-link' })));
