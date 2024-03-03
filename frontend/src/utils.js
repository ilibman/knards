function sanitizeContent(content) {
  let text = content.replaceAll('<', '&lt;');
  text = text.replaceAll('>', '&gt;');
  text = text.replaceAll('′', '&prime;');
  text = text.replaceAll('″', '&Prime;');
  text = text.replaceAll('‘', '&lsquo;');
  text = text.replaceAll('’', '&rsquo;');
  text = text.replaceAll('‚', '&sbquo;');
  text = text.replaceAll('“', '&ldquo;');
  text = text.replaceAll('”', '&rdquo;');
  text = text.replaceAll('„', '&bdquo;');
  text = text.replaceAll('"', '&quot;');
  text = text.replaceAll('\'', '&apos;');
  text = text.replaceAll('«', '&laquo;');
  text = text.replaceAll('»', '&raquo;');
  return text;
}

export function stringifyPartialContent(json, onlyText) {
  if (!json) {
    return '<span id="0" class="text"></span>';
  }

  return json.map((_, i) => {
    const text = sanitizeContent(_.content);

    if (onlyText) {
      return text;
    }

    if (_.type === 'text') {  
      return `<span id="${i}" class="text">${text}</span>`;
    } else {
      return `<span id="${i}" class="inset-question">${text}</span>`;
    }
  }).join('');
}