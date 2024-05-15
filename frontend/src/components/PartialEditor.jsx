import { useState, useCallback } from 'react';
import { createEditor, Editor, Transforms } from 'slate';
import { Slate, Editable, withReact } from 'slate-react';
import { FaQuestion, FaExclamation } from 'react-icons/fa';
import { IoMdTrash } from 'react-icons/io'
import './PartialEditor.scss';

export default function PartialEditor({ ...props }) {
  const [editor] = useState(() => withReact(createEditor()));
  const [selectedNodeType, setSelectedNodeType] = useState('');
  const [hintElement, setHintElement] = useState(null);

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
      } else {     
        Transforms.setNodes(
          editor,
          { insetQuestion: true },
          {
            at: selectedNode[1],
            match: (node, path) => (
              node.insetQuestion !== true
            ),
          }
        );
      }
    }
  }

  function handleCursorChange() {
    setHintElement(() => null);

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
      setSelectedNodeType('');
      return false;
    }

    if (selectedNode && selectedNode[0].insetQuestion) {
      setSelectedNodeType('inset-question');
      setTimeout(() => {
        showHintInput(selectedNode);
      });
    } else {
      setSelectedNodeType('text');
    }
  }

  function showHintInput(selectedNode) {
    // let's find the relevant inset question wrapper element
    // for code formatted partials the structure is a bit different
    let questionElement;
    if (document.getElementsByClassName('active-partial')[0]
      .childNodes[selectedNode[1][0]].className === 'code') {
      questionElement = document.getElementsByClassName('active-partial')[0]
        .childNodes[selectedNode[1][0]]
        .childNodes[0]
        .childNodes[selectedNode[1][1]];
    } else {
      questionElement = document.getElementsByClassName('active-partial')[0]
        .childNodes[selectedNode[1][0]]
        .childNodes[selectedNode[1][1]];
    }

    // get element's coordinates and stuff
    const coords = questionElement.getBoundingClientRect();
    const containerCoords
      = document.getElementsByClassName('active-partial')[0]
        .getBoundingClientRect();
    const yDistance = coords.y - containerCoords.y;

    // create the input element for the relevant hint
    setHintElement(
      <div
        className="hint"
        style={{
          top: yDistance - 32,
          left: coords.x - 10.36
        }}
        contentEditable={true}
        suppressContentEditableWarning={true}
        spellCheck={false}
        onInput={(e) => handleHintChange(e, selectedNode[1])}
      >
        {selectedNode[0].hint}
      </div>
    );
  }

  function toggleIsPrompt(value) {
    props.onIsPromptChange(value);
  }

  function handleHintChange(event, path) {
    Transforms.setNodes(
      editor,
      { hint: event.target.textContent },
      { at: path }
    );
  }

  return (
    <>
      <ul className="flex flex-row mb-2">
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
        {
          selectedNodeType === 'text'
          && (
            <li
              className="mr-2 bg-blue kn-base-btn"
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
                className="relative mr-2 bg-blue
                  kn-base-btn cancel-inset-question-btn"
                onClick={toggleInsetQuestion}
              >
                <FaQuestion
                  className="fill-white"
                />
              </li>
            </>
          )
        }
      </ul>
      <div className="relative hints-container">
        {hintElement}
      </div>
      <Slate
        editor={editor}
        initialValue={props.content}
        onChange={props.onContentChange}
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
        >
          {props.children}
        </span>
      </>
    )
  }
}