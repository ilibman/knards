import { useState, useEffect, useCallback } from 'react';
import { createEditor, Editor, Transforms } from 'slate';
import { Slate, Editable, withReact } from 'slate-react';
import uuid4 from 'uuid4';
import { FaQuestion, FaExclamation } from 'react-icons/fa';
import { IoMdTrash } from 'react-icons/io'
import './PartialEditor.scss';

export default function PartialEditor({ ...props }) {
  const [editor] = useState(() => withReact(createEditor()));
  const [selectedNodeType, setselectedNodeType] = useState('');
  const [areHintsShown, setAreHintsShown] = useState(false);
  const [hintElements, setHintElements] = useState();

  const renderElement = useCallback((props) => {
    switch (props.element.type) {
      case 'code':
        return <Code {...props} />;
      default:
        return <Text {...props} />;
    }
  }, []);

  const renderLeaf = useCallback((props) => {
    return <Leaf {...props} />
  }, []);

  function toggleInsetQuestion() {
    const selectedNode
      = editor.selection && Editor.node(editor, editor.selection.focus);

    if (selectedNode && selectedNodeType === 'inset-question') {
      // if we've got a selection, mark that selection
      // otherwise - the whole node
      if (editor.selection.anchor.offset !== editor.selection.focus.offset) {
        Editor.removeMark(editor, 'insetQuestion');
      } else {
        Transforms.setNodes(
          editor,
          { insetQuestion: false },
          {
            at: selectedNode[1],
            match: (node, path) => (
              node.insetQuestion === true
            ),
          }
        );
        Transforms.mergeNodes(editor, {
          at: selectedNode[1]
        });
      }
    } else {
      if (editor.selection.anchor.offset !== editor.selection.focus.offset) {
        Editor.addMark(editor, 'insetQuestion', true);
        Editor.addMark(editor, 'hintId', uuid4());
      } else {     
        Transforms.setNodes(
          editor,
          { insetQuestion: true, hintId: uuid4() },
          {
            at: selectedNode[1],
            match: (node, path) => (
              node.insetQuestion !== true
            ),
          }
        );
      }
    }
    editor.normalize();

    setTimeout(() => {
      manageHints();
    });
  }

  function handleCursorChange() {
    if (!editor.selection) {
      return false;
    }

    const selectedNode
      = editor.selection && Editor.node(editor, editor.selection.focus);
      
    // if we're selecting various different nodes,
    // restrict any operations
    // TODO: check if there are inset questions, if not, merge text nodes or smth
    if (
      editor.selection.anchor.path[0] !== editor.selection.focus.path[0]
      || editor.selection.anchor.path[1] !== editor.selection.focus.path[1]
    ) {
      setselectedNodeType('');
      return false;
    }

    if (selectedNode && selectedNode[0].insetQuestion) {
      setselectedNodeType('inset-question');
    } else {
      setselectedNodeType('text');
    }
  }

  function handleChange(value) {
    manageHints();
    props.onChange(value);
  }

  function handleHintChange(event, hintId) {
    const newContent = props.content.map((_) => (
      {
        ..._,
        children: _.children.map((__) => {
          if (__.hintId === hintId) {
            return {
              ...__,
              hint: event.target.textContent
            }
          } else {
            return {
              ...__
            }
          }
        })
      }
    ));
    props.content = newContent;
    props.onChange(newContent);
  }

  useEffect(() => {
    manageHints();
  }, [areHintsShown]);

  function manageHints() {
    setHintElements([]);

    if (!areHintsShown) {
      return false;
    }

    const questionsOnPage = Array.from(
      document
        .getElementsByClassName('active-partial')[0]
        .getElementsByClassName('inset-question')
    );
    const questionsInContent = {};
    questionsOnPage.forEach((_) => {
       props.content.forEach((__) => {
        const child = __.children.find((___) => (
          ___.hintId === _.id
        ));
        if (child) {
          questionsInContent[_.id] = child;
        } else {
          return false;
        }
      });
    });

    const containerCoords
      = document.getElementsByClassName('hints-container')[0]
        .getBoundingClientRect();
    let hints = [];
    questionsOnPage.forEach((_, i) => {
      const coords = _.getBoundingClientRect();
      const yDistance = coords.y - containerCoords.y;
      hints.push(
        <div
          className="hint"
          key={i}
          style={{
            top: yDistance - 31,
            left: coords.x - 14.36
          }}
          contentEditable={true}
          suppressContentEditableWarning={true}
          spellCheck={false}
          onBlur={(e) => handleHintChange(e, _.id)}
        >
          {questionsInContent[_.id]?.hint}
        </div>
      );
    });
    setHintElements(hints);
  }

  return (
    <>
      <ul className="flex flex-row mb-2">
        <li
          className="mr-2 p-2 bg-red shadow-md cursor-pointer
            hover:opacity-80"
          onClick={() => props.onDelete()}
        >
          <IoMdTrash />
        </li>
        {
          selectedNodeType === 'text'
          && (
            <li
              className="mr-2 p-2 bg-blue shadow-md cursor-pointer
                hover:opacity-80"
              onClick={toggleInsetQuestion}
            >
              <FaQuestion
                className="fill-white"
              />
            </li>
          )
        }
        {
          selectedNodeType === 'inset-question'
          && (
            <>
              <li
                className="relative mr-2 p-2 bg-blue shadow-md cursor-pointer
                  cancel-inset-question-btn
                  hover:opacity-80"
                onClick={toggleInsetQuestion}
              >
                <FaQuestion
                  className="fill-white"
                />
              </li>
            </>
          )
        }
        {
          !areHintsShown
          && (
            <li
              className="mr-2 p-2 bg-green shadow-md cursor-pointer
                hover:opacity-80"
              onClick={() => setAreHintsShown(true)}
            >
              <FaExclamation
                className="fill-white"
              />
            </li>
          )
        }
        {
          areHintsShown
          && (
            <>
              <li
                className="relative mr-2 p-2 bg-green shadow-md cursor-pointer
                  cancel-hints-btn
                  hover:opacity-80"
                onClick={() => setAreHintsShown(false)}
              >
                <FaExclamation
                  className="fill-white"
                />
              </li>
            </>
          )
        }
      </ul>
      <div className="relative hints-container">
        {hintElements}
      </div>
      <Slate
        editor={editor}
        initialValue={props.content}
        onChange={handleChange}
      >
        <Editable
          className="p-4 bg-brown-light shadow-md
            outline-none partial-editor active-partial"
          renderElement={renderElement}
          renderLeaf={renderLeaf}
          spellCheck={false}
          onClick={handleCursorChange}
        />
      </Slate>
    </>
  );

  function Text({ ...props }) {
    return <p className="text">{props.children}</p>;
  }

  function Code({ ...props }) {
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
          id={props.leaf.hintId}
        >
          {props.children}
        </span>
      </>
    )
  }
}