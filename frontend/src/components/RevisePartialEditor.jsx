import React, { useState, useCallback } from 'react';
import { createEditor } from 'slate';
import { Slate, Editable, withReact } from 'slate-react';
import './PartialEditor.scss';

export default function RevisePartialEditor({ ...props }) {
  const [editor] = useState(() => withReact(createEditor()));

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

  function renderPartialWithInsetQuestions(content) {
    return (
      <>
        {content.map((_, i) => {
          if (_.type === 'text') {
            return (
              <p
                className={`
                  ${props.readOnly ? 'answer-partial' : '' }
                `}
                key={i}
              >{_.children.map((__, j) => (
                <span
                  className={`relative
                    ${__.insetQuestion ? '' : ''}
                  `}
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
      <div className="flex w-full">
        {props.content.some((_) => _.children.some((__) => __.insetQuestion))
          && (
            <div
              className={`w-full p-4 bg-brown-light shadow-md outline-none
                ${props.readOnly ? '!bg-green' : '!bg-brown-light'}
                ${props.isActivePartial ? 'active-partial' : 'inactive-partial'}
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