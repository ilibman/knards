import { Editor, Range, Transforms, Point, Path } from 'slate';

function lineStart(editor: Editor, p: Point): Point {
  const entry = Editor.above(
    editor,
    { at: p, match: n => Editor.isBlock(editor, n) }
  );
  return entry
    ? Editor.start(editor, entry[1])
    : Editor.start(editor, []);
}

/** point right before first non-WS on this line */
function firstNonWSOnLine(editor: Editor, p: Point): Point {
  const start = lineStart(editor, p);
  let cur = start;
  while (true) {
    const nxt = Editor.after(editor, cur, { unit: 'character' });
    if (!nxt) {
      return cur;
    }
    const ch = Editor.string(
      editor,
      { anchor: cur, focus: nxt }
    ); // '' across boundary
    if (ch !== '' && !/\s/.test(ch)) {
      return cur;
    } // just before first non-WS
    cur = nxt;
  }
}

/* NEXT: skip whitespace run; land at start of next word */
export function moveToNextWS(editor: Editor) {
  const sel = editor.selection;
  if (!sel || !Range.isCollapsed(sel)) {
    return;
  }

  let p: Point = sel.anchor;
  let inRun = false;

  while (true) {
    const n = Editor.after(editor, p, { unit: 'character' });
    if (!n) { return; } // end of doc
    const ch = Editor.string(
      editor,
      { anchor: p, focus: n }
    ); // '' across boundary
    const isWS = ch === '' || /\s/.test(ch);

    if (isWS) {
      inRun = true;
      p = n;
      continue;
    }
    if (inRun) {
      Transforms.select(editor, p);
      return;
    } // right edge of run
    p = n;
  }
}

/* PREV: usually land at LEFT edge of the previous whitespace run;
   EXCEPT if that run is the indent before the line’s first word,
   then land at the RIGHT edge (start of that word). */
export function moveToPrevWS(editor: Editor) {
  const sel = editor.selection;
  if (!sel || !Range.isCollapsed(sel)) {
    return;
  }

  const startPoint = sel.anchor;
  const firstNonWS = firstNonWSOnLine(editor, startPoint);

  let p: Point = startPoint;
  let seenWS = false;
  let rightEdge: Point | null = null; // first point we were at when we entered WS (start-of-word side)
  let leftEdge: Point | null = null; // far left of that WS run (before the spaces)

  while (true) {
    const n = Editor.before(editor, p, { unit: 'character' });
    if (!n) {
      // start of doc — if we were inside WS, decide where to land
      if (seenWS) {
        // if this WS run ends at line indent → land at rightEdge, else leftEdge
        const land = Point.equals(rightEdge!, firstNonWS) ? rightEdge! : (leftEdge ?? p);
        Transforms.select(editor, land);
      }
      return;
    }
    const ch = Editor.string(
      editor,
      { anchor: n, focus: p }
    ); // '' across node/line boundary
    const isWS = ch === '' || /\s/.test(ch);

    if (isWS) {
      if (!seenWS) {
        seenWS = true;
        rightEdge = p; // entering WS from the right → start-of-word side
      }
      leftEdge = n; // keep extending left edge through the run
      p = n;
      continue;
    }

    // hit non-WS
    if (seenWS) {
      // If that WS run was the indent directly before first word on this line,
      // land at start of word (rightEdge). Otherwise land before the spaces (leftEdge).
      const land = Point.equals(rightEdge!, firstNonWS) ? rightEdge! : leftEdge!;
      Transforms.select(editor, land);
      return;
    }

    // no whitespace encountered yet → keep going left
    p = n;
  }
}

export function onlyWhitespaceToLineStart(editor: Editor): boolean {
  const { selection } = editor;
  if (!selection) {
    return false;
  }

  const cursor = selection.anchor;

  // get start of current block/line
  const blockEntry = Editor.above(editor, {
    at: cursor,
    match: n => Editor.isBlock(editor, n),
  });
  if (!blockEntry) {
    return false;
  }
  const [, path] = blockEntry;
  const lineStart = Editor.start(editor, path);

  // walk left to line start, checking characters
  let p: Point | undefined = cursor;
  while (p && !Point.equals(p, lineStart)) {
    const prev = Editor.before(editor, p, { unit: 'character' });
    if (!prev) break;

    const ch = Editor.string(
      editor,
      { anchor: prev, focus: p }
    ); // char between
    if (ch !== '' && !/\s/.test(ch)) {
      return false;
    } // non-whitespace found

    p = prev;
  }
  return true; // no non-whitespace found
}

/**
 * Move the caret to the nearest occurrence of `targetChar`.
 * Caret lands **before** that character.
 * - direction: 'forward' | 'backward"'
 */
export function moveToNearestChar(
  editor: Editor,
  targetChar: string,
  direction: string
) {
  const { selection } = editor;
  if (!selection || !Range.isCollapsed(selection) || targetChar.length !== 1) {
    return;
  }

  const start = selection.anchor;
  let bestPoint: Point | null = null;
  let bestDist = Infinity;

  // ---- search backward ----
  if (direction === 'backward') {
    let p: Point | undefined = start;
    let dist = 0;
    while (true) {
      const prev = Editor.before(editor, p, { unit: 'character' });
      if (!prev) { break; }
      const ch = Editor.string(editor, { anchor: prev, focus: p });
      dist++;
      if (ch === targetChar && dist < bestDist) {
        bestPoint = prev; // before the matched char (prev..p yields that char)
        bestDist = dist;
        break;
      }
      p = prev;
    }
  }

  // ---- search forward ----
  if (direction === 'forward') {
    let p: Point | undefined = start;
    let dist = 0;

    const next = Editor.after(editor, p, { unit: 'character' });
    if (next) {
      const ch = Editor.string(editor, { anchor: p, focus: next });
      if (ch === targetChar) {
        // advance once to ignore this adjacent match
        p = next;
        dist++; // we've consumed one char
      }
    }

    while (true) {
      const next = Editor.after(editor, p, { unit: 'character' });
      if (!next) { break; }
      const ch = Editor.string(editor, { anchor: p, focus: next });
      dist++;
      if (ch === targetChar && dist <= bestDist) {
        bestPoint = p; // p is the point just BEFORE the matched char
        bestDist = dist;
        break;
      }
      p = next;
    }
  }

  if (bestPoint) Transforms.select(editor, bestPoint);
}

/**
 * If the caret is currently on whitespace, skip the whole whitespace run forward
 * and place the caret **before** the next non-whitespace character.
 * (Block/node boundaries are treated as whitespace.)
 */
export function moveForwardOutOfWhitespace(editor: Editor) {
  const sel = editor.selection;
  if (!sel || !Range.isCollapsed(sel)) {
    return;
  }

  let p: Point = sel.anchor;

  // Must be on whitespace to trigger
  let next = Editor.after(editor, p, { unit: 'character' });
  if (!next) { return; }
  const first = Editor.string(
    editor,
    { anchor: p, focus: next }
  ); // '' across boundary
  const firstIsWS = first === '' || /\s/.test(first);
  if (!firstIsWS) { return; } // not sitting on whitespace → do nothing

  // Consume the entire whitespace run
  while (next) {
    const ch = Editor.string(
      editor,
      { anchor: p, focus: next }
    ); // char between p..next
    const isWS = ch === '' || /\s/.test(ch);
    if (!isWS) {
      // p is now right before the first non-WS char
      Transforms.select(editor, p);
      return;
    }
    p = next;
    next = Editor.after(editor, p, { unit: "character" });
  }

  // If we consumed to the end of the doc and found no non-WS, leave caret at doc end.
  Transforms.select(editor, p);
}

// delete the entire line that the cursor is currently on
export function deleteCurrentLine(editor: Editor) {
  if (!editor.selection || !Range.isCollapsed(editor.selection)) {
    return; // only handle when cursor is collapsed
  }

  // find the nearest block node above the cursor
  const blockEntry = Editor.above(editor, {
    match: n => Editor.isBlock(editor, n),
    mode: 'lowest',
  });

  if (!blockEntry) {
    return;
  }

  const [, blockPath] = blockEntry;

  // get parent node (usually editor root)
  const parentPath = Path.parent(blockPath);
  const [parentNode] = Editor.node(editor, parentPath);

  // determine if this is the only child in parent
  const isOnlyNode = parentNode.children.length === 1;

  if (isOnlyNode) {
    // only block in the editor → clear its text instead of deleting
    Transforms.delete(editor, {
      at: Editor.range(editor, blockPath),
    });
    // move cursor to start
    Transforms.select(editor, Editor.start(editor, blockPath));
  } else {
    // normal case → delete the block
    Transforms.delete(editor, { at: blockPath });

    // move cursor to the beginning of the next line
    moveForwardOutOfWhitespace(editor);
    if (isCurrentLineLast(editor)) {
      Transforms.move(editor, { unit: 'line', reverse: true });
      moveForwardOutOfWhitespace(editor);
    }
  }
}

// check if the current line is the last line
export function isCurrentLineLast(editor: Editor) {
  if (!editor.selection) {
    return false;
  }

  // find the current block entry
  const blockEntry = Editor.above(editor, {
    match: n => Editor.isBlock(editor, n),
    mode: 'lowest',
  });

  if (!blockEntry) {
    return false;
  }

  const [, blockPath] = blockEntry;

  // get parent path
  const parentPath = Path.parent(blockPath);

  // get parent node using Editor.node (returns [node, path])
  const [parentNode] = Editor.node(editor, parentPath);

  if (!parentNode || !parentNode.children) {
    return false;
  }

  // compare the index of the current block with the last child index
  const lastIndex = parentNode.children.length - 1;

  return blockPath[blockPath.length - 1] === lastIndex;
}

// automatically adds indentation to the current line based on surrounding lines.
 export function autoIndentLine(editor) {
  if (!editor.selection) {
    return;
  }

  // find the current block (line)
  const currentEntry = Editor.above(editor, {
    match: n => Editor.isBlock(editor, n),
    mode: 'lowest',
  });

  if (!currentEntry) {
    return;
  }
  const [currentBlock, currentPath] = currentEntry;

  const parentPath = Path.parent(currentPath);
  const parentEntry = Editor.node(editor, parentPath);
  if (!parentEntry) {
    return;
  }
  const [parentNode] = parentEntry;

  const currentIndex = currentPath[currentPath.length - 1];

  // get previous and next sibling blocks
  const prevBlock = parentNode.children[currentIndex - 1];
  const nextBlock = parentNode.children[currentIndex + 1];

  // function to get leading whitespace count
  const leadingWS = (textNode) => {
    if (!textNode || !textNode.text) {
      return 0;
    }
    const match = textNode.text.match(/^\s*/);
    return match ? match[0].length : 0;
  };

  // compute indentation based on prev and next blocks
  const prevIndent = prevBlock?.children?.[0] ? leadingWS(prevBlock.children[0]) : 0;
  const nextIndent = nextBlock?.children?.[0] ? leadingWS(nextBlock.children[0]) : 0;

  const indent = Math.max(prevIndent, nextIndent);
  if (indent === 0) {
    return;
  }

  // insert leading spaces at the start of the current block
  Transforms.insertText(editor, ' '.repeat(indent), { at: Editor.start(editor, currentPath) });
}