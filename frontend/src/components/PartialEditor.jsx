import { useState, useCallback } from 'react';
import { createEditor, Editor } from 'slate';
import { Slate, Editable, withReact } from 'slate-react';
import { FaQuestion } from 'react-icons/fa';
import { IoMdTrash } from 'react-icons/io'
import './PartialEditor.scss';

export default function PartialEditor({ ...props }) {
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

  function handleKeyDown(event) {
    if (event.key === '[' && event.ctrlKey) {
      // prevent [ from being inserted
      event.preventDefault();
      Editor.addMark(editor, 'insetQuestion', true);
    }

    if (event.key === ']' && event.ctrlKey) {
      // prevent ] from being inserted
      event.preventDefault();
      Editor.addMark(editor, 'insetQuestion', false);
    }
  }

  function toggleInsetQuestion() {
    Editor.addMark(editor, 'insetQuestion', true);
  }

  function handleChange(value) {
    props.onChange(value);
  }

  return (
    <>
      <ul className="flex flex-row mb-2">
        <li
          className="mr-2 p-2 bg-red shadow-md cursor-pointer
            hover:opacity-80"
        >
          <IoMdTrash />
        </li>
        <li
          className="mr-2 p-2 bg-blue-default shadow-md cursor-pointer
            hover:opacity-80"
          onClick={toggleInsetQuestion}
        >
          <FaQuestion
            className="fill-white"
          />
        </li>
      </ul>
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
          onKeyDown={handleKeyDown}
        />
      </Slate>
    </>
  );
}

function Text({ ...props }) {
  return <p className="text">{props.children}</p>;
}

function Code({ ...props }) {
  return <pre className="code"><code>{props.children}</code></pre>;
}

function Leaf(props) {
  return (
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
  )
}