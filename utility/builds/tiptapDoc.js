// Round-trip between plain-text storage (what the worker persists) and
// TipTap document JSON (what the editor works with). The storage format is
// a small Markdown subset plus our custom `[[rawName]]` marker for item
// mentions:
//
//   Supported block syntax: paragraphs, ###/#### headings, - / 1. lists
//   Supported inline marks:  **bold**, *italic*, [text](href)
//   Special:                 [[EquipmentHats5]] → mention node
//   Whitespace:              paragraphs separated by \n\n (standard MD);
//                            old plain-text builds with single \n still
//                            render — the view-side renderer turns soft
//                            breaks into <br>.
//
// textToDoc is the inverse of docToText for well-formed input. Unsupported
// token types (code blocks, tables, images, blockquotes, etc.) degrade to
// plain-text paragraphs so nothing crashes — they can't be created through
// our editor (the extensions are disabled) but might appear in stored text
// if somebody hand-authored the description via the API.

import { marked } from 'marked';
import { parseItemRefs } from './itemRefs';

// ---------------------------------------------------------------------------
// Serialize: TipTap doc JSON -> storage string
// ---------------------------------------------------------------------------

// Users type in a WYSIWYG editor, not in raw Markdown — they apply formatting
// via shortcuts or the (future) toolbar, not by typing `**x**`. So we escape
// only the characters whose literal occurrences would become accidental
// formatting on re-parse: the emphasis markers and backslash itself.
const escapeInlineMd = (s) =>
	typeof s === 'string'
		? s.replace(/\\/g, '\\\\').replace(/([*_])/g, '\\$1')
		: '';

const applyMarks = (text, marks) => {
	let out = text;
	if (!Array.isArray(marks) || marks.length === 0) return out;
	// Order matters: link wraps first (innermost), then bold/italic wrap around it.
	const link = marks.find((m) => m.type === 'link');
	if (link?.attrs?.href) out = `[${out}](${link.attrs.href})`;
	if (marks.some((m) => m.type === 'bold')) out = `**${out}**`;
	if (marks.some((m) => m.type === 'italic')) out = `*${out}*`;
	return out;
};

const inlineToText = (nodes) => {
	if (!Array.isArray(nodes)) return '';
	let out = '';
	for (const n of nodes) {
		if (!n) continue;
		if (n.type === 'text' && typeof n.text === 'string') {
			out += applyMarks(escapeInlineMd(n.text), n.marks);
		} else if (n.type === 'mention' && n.attrs?.id) {
			out += `[[${n.attrs.id}]]`;
		} else if (n.type === 'hardBreak') {
			out += '  \n';
		}
	}
	return out;
};

const listItemToText = (node, prefix) => {
	// A listItem's content is a sequence of blocks (typically a single paragraph).
	// We render each block, then prefix the first line and indent the rest.
	const inner = (node.content || []).map(blockToText).filter(Boolean).join('\n');
	const [first, ...rest] = inner.split('\n');
	return `${prefix}${first}${rest.length ? '\n' + rest.map((l) => '  ' + l).join('\n') : ''}`;
};

const blockToText = (block) => {
	if (!block) return '';
	switch (block.type) {
		case 'paragraph':
			return inlineToText(block.content);
		case 'heading': {
			const level = Math.min(Math.max(Number(block.attrs?.level) || 3, 1), 6);
			return `${'#'.repeat(level)} ${inlineToText(block.content)}`;
		}
		case 'bulletList':
			return (block.content || [])
				.map((item) => listItemToText(item, '- '))
				.join('\n');
		case 'orderedList':
			return (block.content || [])
				.map((item, i) => listItemToText(item, `${i + 1}. `))
				.join('\n');
		default:
			return '';
	}
};

export const docToText = (doc) => {
	if (!doc || !Array.isArray(doc.content)) return '';
	const blocks = doc.content.map(blockToText);
	// Blank blocks (e.g. empty paragraphs between content) are preserved as
	// empty strings so the join emits the blank-line separator naturally.
	return blocks.join('\n\n').replace(/\n{3,}/g, '\n\n').trim();
};

// ---------------------------------------------------------------------------
// Parse: storage string -> TipTap doc JSON
// ---------------------------------------------------------------------------

// Configure marked once. `gfm` adds strike and autolinks (strike is ignored by
// our walker; autolinks get rendered as link marks, which is fine).
marked.setOptions({ gfm: true, breaks: false, pedantic: false });

// Convert marked inline tokens to TipTap inline nodes, expanding [[X]] inside
// text/escape tokens into mention nodes. `marksStack` accumulates enclosing
// marks (bold, italic, link) as we recurse.
const inlineTokensToNodes = (tokens, marksStack = []) => {
	const out = [];
	if (!Array.isArray(tokens)) return out;
	for (const tok of tokens) {
		if (!tok) continue;
		switch (tok.type) {
			case 'text':
			case 'escape':
			case 'codespan': {
				// For `code`, we don't have a code mark enabled — fall through to plain text.
				const raw = tok.text ?? tok.raw ?? '';
				const segs = parseItemRefs(raw);
				if (segs.length === 0 && raw) {
					out.push(makeText(raw, marksStack));
				} else {
					for (const seg of segs) {
						if (seg.type === 'text' && seg.value) {
							out.push(makeText(seg.value, marksStack));
						} else if (seg.type === 'item' && seg.rawName) {
							// Mention attrs.id uses "type:id" so the NodeView can distinguish
							// items from talents without a separate attribute.
							out.push({ type: 'mention', attrs: { id: `item:${seg.rawName}`, label: null } });
						} else if (seg.type === 'talent' && seg.skillIndex != null) {
							out.push({ type: 'mention', attrs: { id: `talent:${seg.skillIndex}`, label: null } });
						}
					}
				}
				break;
			}
			case 'strong':
				out.push(...inlineTokensToNodes(tok.tokens, [...marksStack, { type: 'bold' }]));
				break;
			case 'em':
				out.push(...inlineTokensToNodes(tok.tokens, [...marksStack, { type: 'italic' }]));
				break;
			case 'link':
				out.push(
					...inlineTokensToNodes(tok.tokens, [
						...marksStack,
						{ type: 'link', attrs: { href: tok.href } }
					])
				);
				break;
			case 'br':
				out.push({ type: 'hardBreak' });
				break;
			case 'del':
				// Strike-through mark isn't enabled in the editor; keep the
				// inner text but drop the ~~ marks from legacy content.
				out.push(...inlineTokensToNodes(tok.tokens, marksStack));
				break;
			default:
				if (tok.raw) out.push(makeText(tok.raw, marksStack));
		}
	}
	return out;
};

const makeText = (text, marksStack) => {
	const node = { type: 'text', text };
	if (marksStack.length) node.marks = marksStack.map((m) => ({ ...m }));
	return node;
};

const blockTokenToNode = (tok) => {
	if (!tok) return null;
	switch (tok.type) {
		case 'paragraph': {
			const content = inlineTokensToNodes(tok.tokens);
			return content.length ? { type: 'paragraph', content } : { type: 'paragraph' };
		}
		case 'heading': {
			// Clamp to the valid 1..6 range; the editor schema supports all six.
			const level = Math.min(Math.max(tok.depth || 1, 1), 6);
			const content = inlineTokensToNodes(tok.tokens);
			return content.length
				? { type: 'heading', attrs: { level }, content }
				: { type: 'heading', attrs: { level } };
		}
		case 'list': {
			const type = tok.ordered ? 'orderedList' : 'bulletList';
			const items = (tok.items || []).map(listItemToNode).filter(Boolean);
			return items.length ? { type, content: items } : null;
		}
		case 'space':
			return null;
		case 'hr':
		case 'html':
		case 'table':
		case 'code':
		case 'blockquote':
		case 'def':
		case 'image':
			// Extension disabled — render as plain text to keep content visible.
			return {
				type: 'paragraph',
				content: [{ type: 'text', text: (tok.raw || '').trim() }].filter(
					(n) => n.text
				)
			};
		case 'text': {
			// Loose inline text at block level (e.g. within a list item).
			return { type: 'paragraph', content: inlineTokensToNodes([tok]) };
		}
		default:
			if (tok.raw) {
				return { type: 'paragraph', content: inlineTokensToNodes([{ type: 'text', raw: tok.raw, text: tok.raw }]) };
			}
			return null;
	}
};

const listItemToNode = (item) => {
	// marked's list item tokens include either `tokens` (block content) or a
	// plain text shape. Normalize to a listItem containing paragraph blocks.
	let blocks = [];
	if (Array.isArray(item.tokens) && item.tokens.length) {
		blocks = item.tokens.map(blockTokenToNode).filter(Boolean);
	} else if (typeof item.text === 'string') {
		blocks = [{ type: 'paragraph', content: inlineTokensToNodes([{ type: 'text', text: item.text }]) }];
	}
	if (blocks.length === 0) blocks = [{ type: 'paragraph' }];
	return { type: 'listItem', content: blocks };
};

export const textToDoc = (text) => {
	const str = typeof text === 'string' ? text : '';
	if (!str) return { type: 'doc', content: [{ type: 'paragraph' }] };

	// Backward-compat shim: old builds use single \n as paragraph break. If
	// the text has no blank-line paragraph separators but does have single
	// newlines, promote each newline to a blank-line separator so marked
	// parses them as separate paragraphs (preserving the original layout).
	const hasBlankLineSeparator = /\n\s*\n/.test(str);
	const normalized = hasBlankLineSeparator ? str : str.replace(/\n/g, '\n\n');

	const tokens = marked.lexer(normalized);
	const content = tokens.map(blockTokenToNode).filter(Boolean);
	if (content.length === 0) content.push({ type: 'paragraph' });
	return { type: 'doc', content };
};
