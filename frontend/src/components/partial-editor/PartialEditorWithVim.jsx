import { useState, useCallback, useEffect } from 'react';
import { createEditor, Editor, Transforms, Node } from 'slate';
import { Slate, Editable, withReact } from 'slate-react';
import { FaExclamation } from 'react-icons/fa';
import { IoMdTrash } from 'react-icons/io'
import './PartialEditor.scss';

export default function PartialEditorWithVim({ ...props }) {
  const [editor] = useState(() => withReact(createEditor()));
  const [editorAux] = useState(() => withReact(createEditor()));
  const [isInsertMode, setIsInsertMode] = useState(false);
  const [commandPrefix, setCommandPrefix] = useState('');

  useEffect(() => {
    if (!props.isActivePartial) {
      setIsInsertMode(false);
    }
  }, [props.isActivePartial]);

  const renderElement = useCallback((props) => {
    return <Vim {...props} />;
  }, []);

  const renderLeaf = useCallback((props) => {
    return <Leaf {...props} />
  }, []);

  function toggleIsPrompt(value) {
    props.onIsPromptChange(value);
  }

  function handleKeyDown(value, whichEditor) {
    const editor = whichEditor;

    if (value.key !== 'i' && !isInsertMode) {
      value.preventDefault();
    }

    if (value.key === 'i' && !isInsertMode) {
      value.preventDefault();
      setIsInsertMode(true);
    }

    if (value.key === 'Escape' && isInsertMode) {
      value.preventDefault();
      setIsInsertMode(false);
      setCommandPrefix('');
      // Transforms.collapse(editor, { edge: 'focus' });
    }

    if (!isInsertMode) {
      if (value.shiftKey && value.key === 'D') {
        Transforms.delete(editor, { unit: 'line' });
      }
      if (value.shiftKey && value.key === 'C') {
        Transforms.delete(editor, { unit: 'line' });
        setIsInsertMode(true);
      }

      if (value.key === 'c') {
        setCommandPrefix('c');
      }
      if (value.key === 'w') {
        if (commandPrefix === 'c') {
          Transforms.delete(editor, { unit: 'word' });
          setIsInsertMode(true);
          setCommandPrefix('');
        }
        if (commandPrefix === '') {
          Transforms.move(editor, { distance: 2, unit: 'word' });
          Transforms.move(editor, { unit: 'word', reverse: true });
        }
      }
      if (value.key === 'b') {
        Transforms.move(editor, { unit: 'word', reverse: true });
        setCommandPrefix('');
      }
      if (value.key === 'l') {
        Transforms.move(editor, { unit: 'character' });
        setCommandPrefix('');
      }
      if (value.key === 'j') {
        const offset = editor.selection.focus.offset;
        const lineLength
          = Editor.node(editor, editor.selection.focus)[0].text.length;
        
        if (offset === 0) {
          Transforms.move(editor, { distance: 2, unit: 'line' });
        }
        if (offset !== 0 && offset !== lineLength && lineLength !== 0) {
          Transforms.move(editor, { distance: 2, unit: 'line' });
          const newLineLength
            = Editor.node(editor, editor.selection.focus)[0].text.length;
          if (offset > newLineLength) {
            Transforms.move(editor, { unit: 'line' });
          } else {
            Transforms.move(editor, {
              distance: offset
            });
          }
        }
        if (offset === lineLength && lineLength !== 0) {
          Transforms.move(editor, { distance: 1, unit: 'line' });
          const newLineLength
            = Editor.node(editor, editor.selection.focus)[0].text.length;
          if (offset > newLineLength) {
            Transforms.move(editor, { distance: 1, unit: 'line' });
          } else {
            Transforms.move(editor, {
              distance: offset
            });
          }
        }
        setCommandPrefix('');
      }
      if (value.key === 'k') {
        const offset = editor.selection.focus.offset;
        const lineLength
          = Editor.node(editor, editor.selection.focus)[0].text.length;

        if (offset === 0) {
          Transforms.move(editor, { distance: 2, unit: 'line', reverse: true });
        }
        if (offset !== 0 && offset !== lineLength && lineLength !== 0) {
          Transforms.move(editor, { distance: 3, unit: 'line', reverse: true });
          const newLineLength
            = Editor.node(editor, editor.selection.focus)[0].text.length;
          if (offset > newLineLength) {
            Transforms.move(editor, { unit: 'line', reverse: true });
          } else {
            Transforms.move(editor, {
              distance: offset
            });
          }
        }
        if (offset === lineLength && lineLength !== 0) {
          Transforms.move(editor, { distance: 3, unit: 'line', reverse: true });
          const newLineLength
            = Editor.node(editor, editor.selection.focus)[0].text.length;
          if (offset > newLineLength) {
            Transforms.move(editor, { distance: 1, unit: 'line', reverse: true });
          } else {
            Transforms.move(editor, {
              distance: offset
            });
          }
        }
        setCommandPrefix('');
      }
      if (value.key === 'h') {
        Transforms.move(editor, { unit: 'character', reverse: true });
        setCommandPrefix('');
      }
      if (value.shiftKey && value.key === 'L') {
        Transforms.move(editor, { unit: 'line' });
        setCommandPrefix('');
      }
      if (value.shiftKey && value.key === 'H') {
        Transforms.move(editor, { unit: 'line', reverse: true });
        setCommandPrefix('');
      }
      if (value.shiftKey && value.key === 'I') {
        Transforms.move(editor, { unit: 'line', reverse: true });
        setIsInsertMode(true);
        setCommandPrefix('');
      }
      if (value.shiftKey && value.key === 'A') {
        Transforms.move(editor, { unit: 'line' });
        setIsInsertMode(true);
        setCommandPrefix('');
      }

      if (value.key === 'o') {
        Transforms.move(editor, { unit: 'line' });
        Transforms.insertNodes(
          editor,
          { type: 'vim', children: [{ text: '' }] }
        );
        setIsInsertMode(true);
        setCommandPrefix('');
      }
      if (value.shiftKey && value.key === 'O') {
        Transforms.move(editor, { unit: 'line', reverse: true });
        Transforms.insertNodes(
          editor,
          { type: 'vim', children: [{ text: '' }] }
        );
        setIsInsertMode(true);
        setCommandPrefix('');
      }

      // if (value.shiftKey && value.key === 'V') {
      //   setCommandPrefix('V');
      //   // Move selection to start of line
      //   Transforms.move(editor, { unit: 'line', reverse: true });
      //   const start = editor.selection.anchor;
      //   // Move cursor to end of line
      //   Transforms.move(editor, { unit: 'line' });
      //   const end = editor.selection.anchor;
      //   // Select text from start of line to end of line
      //   Transforms.select(editor, {
      //     anchor: { path: start.path, offset: start.offset },
      //     focus: { path: end.path, offset: end.offset },
      //   });
      // }

      if (value.key === 'p') {
        navigator.clipboard
          .readText()
          .then((text) => Transforms.insertText(editor, text));
        setCommandPrefix('');
      }
      if (value.key === 'P') {
        Transforms.move(editor, { unit: 'line' });
        Transforms.insertNodes(
          editor,
          { type: 'vim', children: [{ text: '' }] }
        );
        navigator.clipboard
          .readText()
          .then((text) => Transforms.insertText(editor, text));
        setCommandPrefix('');
      }
      if (value.key === 'y') {
        if (commandPrefix === 'V') {
          navigator.clipboard.writeText(
            Editor.node(editor, editor.selection.focus)[0].text
          );
        } else {
          setCommandPrefix('y');
        }
      }
      if (value.key === 'y') {
        if (commandPrefix === 'y') {
          setCommandPrefix('');
          const originalPosition = editor.selection;
          // Move selection to start of line
          Transforms.move(editor, { unit: 'line', reverse: true });
          const start = editor.selection.anchor;
          // Move cursor to end of line
          Transforms.move(editor, { unit: 'line' });
          const end = editor.selection.anchor;
          // Select text from start of line to end of line
          Transforms.select(editor, {
            anchor: { path: start.path, offset: start.offset },
            focus: { path: end.path, offset: end.offset },
          });
          navigator.clipboard.writeText(
            Editor.node(editor, editor.selection.focus)[0].text
          );
          // Move cursor back to original position
          Transforms.select(editor, originalPosition);
        }
      }
    }
  }
  
  return (
    <>
      {!props.isRevising && (
        <ul className="flex flex-row mb-2.5">
          <li
            className="mr-2 bg-red kn-base-btn"
            onClick={() => props.onDelete()}
          >
            <IoMdTrash />
          </li>
          {
            props.isPrompt
            ? (
              <li
                className="relative mr-2 bg-blue
                  kn-base-btn toggle-off-is-prompt-btn"
                onClick={() => toggleIsPrompt(false)}
              >
                <FaExclamation
                  className="fill-white"
                />
              </li>
            )
            : (
              <li
                className="mr-2 bg-blue kn-base-btn"
                onClick={() => toggleIsPrompt(true)}
              >
                <FaExclamation
                  className="fill-white"
                />
              </li>
            )
          }
        </ul>
      )}
      <div className="relative flex partial-editors-wrapper">
        <Slate
          editor={editor}
          initialValue={props.content}
          onChange={props.onContentChange}
        >
          <Editable
            className={`flex-1 p-4 pb-5 bg-brown-light shadow-md
              outline-none partial-editor
              ${props.isActivePartial ? 'active-partial' : 'inactive-partial'}`}
            renderElement={renderElement}
            renderLeaf={renderLeaf}
            spellCheck={false}
            onKeyDown={(e) => handleKeyDown(e, editor)}
            onFocus={props.onPartialFocus}
          />
          <div className={`absolute
            ${props.isPrompt ? 'right-[50%]' : 'right-[-3px]'}
            ${props.isActivePartial ? '' : 'hidden' }
            bottom-0 px-2
            text-sm text-black font-semibold bg-blue-light
            mode-indicator`}>
            {isInsertMode ? 'insert' : 'normal'}
          </div>
        </Slate>
        {props.isPrompt
          && (
            <Slate
              editor={editorAux}
              initialValue={props.promptInitialContent}
              onChange={props.onPromptInitialContentChange}
            >
              <Editable
                className={`flex-1 ml-2 p-4 !bg-green outline-none
                  partial-editor
                  ${props.isActivePartial ? 'active-partial' : 'inactive-partial'}`}
                renderElement={renderElement}
                renderLeaf={renderLeaf}
                spellCheck={false}
                onKeyDown={(e) => handleKeyDown(e, editorAux)}
                onFocus={props.onPartialFocus}
              />
              <div className={`absolute right-[-3px]
                bottom-0 px-2
                text-sm text-black font-semibold bg-blue-light
                mode-indicator`}>
                {isInsertMode ? 'insert' : 'normal'}
              </div>
            </Slate>
          )
        }
      </div>
    </>
  );

  function Vim({ ...props }) {
    return <pre className="code"><code>{props.children}</code></pre>;
  }

  function Leaf(props) {
    return (
      <>
        <span
          {...props.attributes}
          className={`
            ${props.leaf.insetQuestion
              ? 'inset-question'
              : ''}
          `}
        >
          {props.children}
        </span>
      </>
    )
  }
}