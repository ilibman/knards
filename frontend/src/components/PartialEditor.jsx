import { memo, useState, useEffect } from 'react';
import VanillaCaret from 'vanilla-caret-js';
import './PartialEditor.scss';

function PartialEditorComponent({ ...props }) {
  const [content, setContent] = useState(props.content);

  useEffect(() => {
    setContent([]);

    setTimeout(() => {
      setContent(props.content);
    }, 0)
  }, [props.content]);

  function emitClick() {
    props.onClick(props.partialPosition - 1);
  }

  function emitChange(originalEvent, caretPosition) {
    // this is where we will format the textContent of the whole partial element
    // into the right JSON format that we save on BE
    const newContent = Array.from(
      originalEvent.target.parentElement.parentElement.childNodes
    ).map((_) => Array.from(_.childNodes).flat()).flat();
    
    const event = Object.assign({}, originalEvent, {
      target: {
        value: formatContent(newContent)
      }
    });
    props.onChange(event);

    if (caretPosition) {
      setTimeout(() => {
        const caret = new VanillaCaret(originalEvent.target);
        caret.setPos(caretPosition);
      });
    }
  }

  function formatContent(nodes) {
    return Array.from(nodes).map((_) => {
      const node = {};
      if (_.className.includes('text')) {
        node['type'] = 'text';
        node['content'] = _.textContent;
      }
      if (_.className.includes('inset-question')) {
        node['type'] = 'inset-question';
        node['content'] = _.textContent;
      }
      if (_.className.includes('first-node-in-line')) {
        node['firstNodeInLine'] = true;
      } else {
        node['firstNodeInLine'] = false;
      }
      if (_.className.includes('last-node-in-line')) {
        node['lastNodeInLine'] = true;
      } else {
        node['lastNodeInLine'] = false;
      }
      return node;
    });
  }

  function handleKeyPress(event) {
    const selection = document.getSelection();
    const caretPosition = selection.anchorOffset;
    const textContent = selection.anchorNode.textContent;
    
    let allNodes, nodeId, nodeClass;
    if (selection.anchorNode.parentElement.className.includes('partial-line')) {
      // because if span contains any text - it's considered a parent element
      // and if not - div is considered a parent element
      allNodes = Array.from(
        selection.anchorNode.parentElement.parentElement.childNodes
      ).map((_) => Array.from(_.childNodes).flat()).flat();
      nodeId = selection.anchorNode.id.substring(5);
      nodeClass = selection.anchorNode.className;
    } else {
      allNodes = Array.from(
        selection.anchorNode.parentElement.parentElement.parentElement.childNodes
      ).map((_) => Array.from(_.childNodes).flat()).flat();
      nodeId = selection.anchorNode.parentElement.id.substring(5);
      nodeClass = selection.anchorNode.parentElement.className;
    }
    
    if (event.ctrlKey && event.key === '[' && nodeClass.includes('text')) {
      const newNodes = startInsetQuestionNode(
        nodeId,
        caretPosition,
        textContent,
        allNodes,
        nodeClass.includes('first-node-in-line'),
        nodeClass.includes('last-node-in-line')
      );
      props.onChange({
        target: {
          value: newNodes
        }
      });
      
      setTimeout(() => {
        document.getElementById(`node-${nodeId}`).nextSibling.focus();
      }, 50);
    }
    
    if (event.ctrlKey && event.key === ']' && nodeClass.includes('inset-question')) {
      setTimeout(() => {
        document.getElementById(`node-${nodeId}`).nextSibling.focus();
      }, 0);
    }

    if (event.ctrlKey && event.key === ',') {
      setTimeout(() => {
        if (document.getElementById(`node-${nodeId}`).previousSibling) {
          document.getElementById(`node-${nodeId}`).previousSibling.focus();
        }
      }, 0);
    }
    
    if (event.ctrlKey && event.key === '.') {
      setTimeout(() => {
        if (document.getElementById(`node-${nodeId}`).nextSibling) {
          document.getElementById(`node-${nodeId}`).nextSibling.focus();
        }
      }, 0);
    }
    
    if (event.key === 'Enter' && nodeClass.includes('text')) {
      event.preventDefault();
      const newNodes = startNewLine(
        nodeId,
        caretPosition,
        textContent,
        allNodes,
        nodeClass.includes('first-node-in-line')
      );
      props.onChange({
        target: {
          value: newNodes
        }
      });
      
      setTimeout(() => {
        const partialIndex = +nodeId.substring(
          nodeId.indexOf('p') + 1, nodeId.indexOf('p') + 2
        );
        const lineIndex = +nodeId.substring(
          nodeId.indexOf('l') + 1, nodeId.indexOf('l') + 2
        );
        document.getElementById(`line-p${partialIndex}l${lineIndex + 1}`)
          .childNodes[0].focus();
      }, 50);
    }

    if (event.key === 'Enter' && !nodeClass.includes('text')) {
      event.preventDefault();
    }

    if (event.key === 'Tab') {
      event.preventDefault();
      let newText = textContent.substring(0, caretPosition);
      newText += '\u00a0\u00a0\u00a0\u00a0';
      newText += textContent.substring(caretPosition);

      document.getElementById(`node-${nodeId}`).innerText = newText;
      setTimeout(() => {
        const caret = new VanillaCaret(event.target);
        caret.setPos(caretPosition + 4);
      }, 0);
    }

    if (event.key === 'Backspace') {
      if (nodeClass.includes('first-node-in-line') && caretPosition === 0) {
        const newNodes = removeEmptyLine(nodeId, allNodes);
        props.onChange({
          target: {
            value: newNodes
          }
        });

        setTimeout(() => {
          const partialIndex = +nodeId.substring(
            nodeId.indexOf('p') + 1, nodeId.indexOf('p') + 2
          );
          const lineIndex = +nodeId.substring(
            nodeId.indexOf('l') + 1, nodeId.indexOf('l') + 2
          );
          const childNodesLength
            = document.getElementById(`line-p${partialIndex}l${lineIndex - 1}`)
              .childNodes.length;
          const lastChildNodeLength
            = document.getElementById(`line-p${partialIndex}l${lineIndex - 1}`)
              .childNodes[childNodesLength - 1].textContent.length;
          const lastChildNodeElement
            = document.getElementById(`line-p${partialIndex}l${lineIndex - 1}`)
              .childNodes[childNodesLength - 1];
          lastChildNodeElement.focus();
          const caret = new VanillaCaret(lastChildNodeElement);
          caret.setPos(lastChildNodeLength);
        }, 50);
      }
    }
  }

  function handlePaste(event) {
    event.preventDefault();

    const textToPaste = event.clipboardData.getData('text');
    const selection = document.getSelection();
    const caretPosition = selection.anchorOffset;
    const textContent = selection.anchorNode.textContent;

    selection.anchorNode.textContent
      = textContent.substring(0, caretPosition)
        + textToPaste
        + textContent.substring(caretPosition);
        
    emitChange({
      target: selection.anchorNode.parentElement
    }, caretPosition + textToPaste.length);
  }
  
  function startInsetQuestionNode(
    nodeId,
    caretPosition,
    textContent,
    allNodes,
    isFirstNodeInLine,
    isLastNodeInLine
  ) {
    const nodeIndex = allNodes.findIndex((_) => _.id === `node-${nodeId}`);
    const leftContent = textContent.substring(0, caretPosition);
    const rightContent = textContent.substring(caretPosition);
    return Array.from(allNodes).map((_, i) => {
      if (i === nodeIndex) {
        return [
          {
            type: 'text',
            content: leftContent,
            firstNodeInLine: isFirstNodeInLine,
            lastNodeInLine: false
          },
          {
            type: 'inset-question',
            content: '',
            firstNodeInLine: false,
            lastNodeInLine: false
          },
          {
            type: 'text',
            content: rightContent,
            firstNodeInLine: false,
            lastNodeInLine: isLastNodeInLine
          },
        ];
      } else {
        return {
          type: _.className.includes('text') ? 'text' : 'inset-question',
          content: _.innerText,
          firstNodeInLine:
            _.className.includes('first-node-in-line') ? true : false,
          lastNodeInLine:
            _.className.includes('last-node-in-line') ? true : false,
        };
      }
    }).flat();
  }

  function startNewLine(
    nodeId,
    caretPosition,
    textContent,
    allNodes,
    isFirstNodeInLine
  ) {
    const nodeIndex = allNodes.findIndex((_) => _.id === `node-${nodeId}`);
    let leftContent, rightContent;
    if (caretPosition === textContent.length) {
      leftContent = textContent;
      rightContent = '';
    } else {
      leftContent = textContent.substring(0, caretPosition);
      rightContent = textContent.substring(caretPosition);
    }
    return Array.from(allNodes).map((_, i) => {
      if (i === nodeIndex) {
        return [
          {
            type: 'text',
            content: leftContent,
            firstNodeInLine: isFirstNodeInLine,
            lastNodeInLine: true
          },
          {
            type: 'text',
            content: rightContent,
            firstNodeInLine: true,
            lastNodeInLine: true
          },
        ];
      } else {
        return {
          type: _.className.includes('text') ? 'text' : 'inset-question',
          content: _.innerText,
          firstNodeInLine:
            _.className.includes('first-node-in-line') ? true : false,
          lastNodeInLine:
            _.className.includes('last-node-in-line') ? true : false,
        };
      }
    }).flat();
  }

  function removeEmptyLine(nodeId, allNodes) {
    const nodeIndex = allNodes.findIndex((_) => _.id === `node-${nodeId}`);
    return Array.from(allNodes).map((_, i) => {
      if (i === nodeIndex) {
        return [];
      } else {
        return {
          type: _.className.includes('text') ? 'text' : 'inset-question',
          content: _.innerText,
          firstNodeInLine:
            _.className.includes('first-node-in-line') ? true : false,
          lastNodeInLine:
            _.className.includes('last-node-in-line') ? true : false,
        };
      }
    }).flat();
  }

  function splitLines(json) {
    const lines = [];
    if (!json) {
      lines[0] = [];
    }

    let lineIndex = 0;
    json.map((_) => {
      if (!lines[lineIndex]) {
        lines.push([]);
      }

      lines[lineIndex].push(_);
      if (_.lastNodeInLine) {
        lineIndex++;
      }
    });
    return lines;
  }

  return (
    <div
      className={`min-h-[60px] p-4
        ${props.className} partial-editor`}
      onClick={emitClick}
    >
      {splitLines(content).map((line, lineIndex) => (
        <div
          className="flex flex-wrap partial-line"
          id={`line-p${props.partialPosition}l${lineIndex}`}
          key={`line-p${props.partialPosition}l${lineIndex}a`}
        >
          {line.map((_, nodeIndex) => (
            <span
              className={`flex items-center
                ${_.type === 'text' ? 'text' : ''}
                ${_.type === 'inset-question' ? 'inset-question' : ''}
                ${_.firstNodeInLine ? 'first-node-in-line' : ''}
                ${_.lastNodeInLine ? 'last-node-in-line' : ''}
                ${content.length
                  === nodeIndex + 1
                    ? 'last-node-in-partial'
                    : ''}
              `.replace(/\s+/g, ' ').trim()}
              id={`node-p${props.partialPosition}l${lineIndex}n${nodeIndex}`}
              contentEditable="true"
              suppressContentEditableWarning={true}
              spellCheck={false}
              key={`node-p${props.partialPosition}l${lineIndex}n${nodeIndex}a`}
              onInput={emitChange}
              onKeyDown={handleKeyPress}
              onPaste={handlePaste}
            >
              {_.content}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

function checkRerender(prevProps, nextProps) {
  // we only want to re-render if the json structure of content is changed
  // otherwise we just want to update value on parent component
  // otherwise the caret jumps to the start of the textbox
  if (prevProps.content.length !== nextProps.content.length) {
    return false;
  }

  if (prevProps.className !== nextProps.className) {
    return false;
  }

  return true;
}

const PartialEditor = memo(PartialEditorComponent, checkRerender);
export default PartialEditor;