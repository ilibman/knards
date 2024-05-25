import React, { useState, useCallback } from 'react';
import { createEditor, Editor } from 'slate';
import { Slate, Editable, withReact } from 'slate-react';
import './PartialEditor.scss';

export default function RevisePartialEditor({ ...props }) {
  const [editor] = useState(() => withReact(createEditor()));
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

  function handleCursorChange() {
    setHintElement(() => null);

    if (!editor.selection) {
      return false;
    }

    const selectedNode
      = editor.selection && Editor.node(editor, editor.selection.focus);

    if (selectedNode
      && selectedNode[0].insetQuestion
      && selectedNode[0].hint) {
      showHintInput(selectedNode);
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
          top: yDistance - 28,
          left: coords.x - 12
        }}
      >
        {selectedNode[0].hint}
      </div>
    );
  }

  function renderPartialWithInsetQuestions(content) {
    return (
      <>
        {content.map((_, i) => {
          if (_.type === 'text') {
            return (
              <p
                className="min-h-[27px]"
                key={i}
              >{_.children.map((__, j) => (
                <span
                  className="relative"
                  key={i + j}
                >
                  <span
                    className={`outline-none
                      ${__.insetQuestion ? 'inset-question' : ''}
                    `}
                    contentEditable={__.insetQuestion}
                    suppressContentEditableWarning
                    spellCheck={false}
                  >
                    {__.text}
                  </span>
                  {__.hint && (
                    <span className="revise-hint">{__.hint}</span>
                  )}
                </span>
              ))}</p>
            );
          } else {
            return (
              <pre
                className="min-h-[27px] code"
                key={i}
              >
                <code>{_.children.map((__, j) => (
                  <span
                    className={`outline-none
                      ${__.insetQuestion ? 'inset-question' : ''}
                    `}
                    key={i + j}
                    contentEditable={__.insetQuestion}
                    suppressContentEditableWarning
                    spellCheck={false}
                  >{__.text}</span>
                ))}</code>
              </pre>
            );
          }
        })}
      </>
    );
  }
  
  return (
    <>
      <div className="relative hints-container">
        {hintElement}
      </div>
      <div className="flex w-full">
        {props.content.some((_) => _.children.some((__) => __.insetQuestion))
          && (
            <div
              className={`w-full p-4 bg-brown-light shadow-md outline-none
                ${props.readOnly ? '!bg-green' : '!bg-brown-light'}
                revise-partial-editor inactive-partial`}
            >{renderPartialWithInsetQuestions(props.content)}</div>
          )
        }
        {props.content.every((_) => _.children.every((__) => !__.insetQuestion))
          && (
            <Slate
              editor={editor}
              initialValue={props.content}
            >
              <Editable
                className={`flex-1 p-4 shadow-md
                  outline-none revise-partial-editor
                  ${props.readOnly ? '!bg-green' : '!bg-brown-light'}
                  ${props.isActivePartial ? 'active-partial' : 'inactive-partial'}`}
                renderElement={renderElement}
                renderLeaf={renderLeaf}
                spellCheck={false}
                onClick={(e) => !props.readOnly && handleCursorChange(e)}
                onFocus={props.onPartialFocus}
              />
            </Slate>
          )
        }
      </div>
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