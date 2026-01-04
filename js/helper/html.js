export function objToString(obj) {
  /** Turns any valid html++ obj into a string. */
  if (Array.isArray(obj)) {
    return obj.map(item => objToString(item)).join('');
  }

  const { name, attributes = {}, content = '' } = obj;

  const attrs = Object.entries(attributes)
    .map(([k, v]) => ` ${k}="${v}"`)
    .join('');

  let inner = '';
  if (typeof content === 'string') {
    inner = content;
  } else if (Array.isArray(content)) {
    inner = content.map(child => objToString(child)).join('');
  }

  return `<${name}${attrs}>${inner}</${name}>`;
}


export const nonTerminatingElements = ['hr','img','input','textarea','link','meta','script'];

function htmlpToObjParser(content) {
  let tree = [];
  for (let i = 0; i<content.length; i++) {
    let stack = [];
    let level = 0;
    let temp = {
      name: '',
      attributes: {},
      content: []
    };
    let char = content[i];
    if (char === '<') {
      while (char !== '>' && i<content.length) {
        i++;
        char = content[i];
        stack.push(char);
        if (char==='<') {
          stack = [];
        }
      }
      stack.pop();

      let elem = stack.join('').trim().split(' ');
      temp.name = elem[0].toLowerCase();
      if (temp.name.startsWith('/')) {
        console.warn('[HTML PARSER] Closing tag found as start tag: '+temp.name.slice(1));
        continue;
      }
      if (temp.name.match(/^[a-zA-Z][a-zA-Z0-9-]*$/m)===null) {
        console.warn('[HTML PARSER] Invalid element name '+temp.name);
      }

      let attributes = elem.slice(1, elem.length).join(' ').match(/\b([a-zA-Z][a-zA-Z0-9\-]*)(=(".*?"|[^\s]+))?/g)??[];
      let tempattr = {};
      attributes.forEach(attr => {
        attr = attr.split('=');
        let val = attr.slice(1,attr.length).join('=');
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1,-1);
        tempattr[attr[0].toLowerCase()] = val;
      })
      temp.attributes = tempattr;

      if (nonTerminatingElements.includes(temp.name)) {
        tree.push(temp)
        continue;
      }

      let innerContent = '';
      while (i < content.length) {
        i++;
        char = content[i];

        if (char === '<' && content.slice(i, i+2) === '</') {
          let closingTag = '';
          while (char !== '>' && i < content.length) {
            i++;
            char = content[i];
            closingTag += char??'';
          }
          closingTag = closingTag.slice(1, -1).toLowerCase();
          if (closingTag === temp.name) {
            if (level === 0) break;
            level--;
            innerContent += `</${closingTag}>`;
          } else {
            innerContent += `</${closingTag}>`;
          }
        } else if (char === '<' && content.slice(i, i+temp.name.length+1)===('<'+temp.name)) {
          level++;
          innerContent += '<';
        } else {
          innerContent += char??'';
        }
      }

      if (innerContent.trim()) {
        if (innerContent.includes('<')) {
          temp.content = htmlpToObjParser(innerContent.trim());
        } else {
          temp.content = innerContent;
        }
      }

      tree.push(temp);
    }
  }
  return tree;
}

export function htmlpToObj(content) {
  /** Turns html++ string into an object. */
  // Remove comments
  content = content.replaceAll(/<!--([^¬]|.)*?-->/g, '');
  // Handle ***INVALID*** html doctype
  if ((/<!DOCTYPE html>/gi).test(content)) {
    console.warn('[HTML PARSER] Invalid doctype html');
    content = content.replaceAll(/<!DOCTYPE html>/gi, '');
  }
  // Parse
  return htmlpToObjParser(content);
}


export function fragmentToString(fragment) {
  /** Turns html fragments into an object. */
  const container = document.createElement('div');
  container.appendChild(fragment.cloneNode(true));
  return container.innerHTML;
}

export function fixScripts(obj) {
  for (const node of obj) {
    if (node.name === "script") {
      // here
    }
    if (Array.isArray(node.content)) {
      fixScripts(node.content);
    }
  }
  return obj;
}

export function getScripts(obj) {
  let scripts = [];
  for (const node of obj) {
    if (node.name === "script") {
      scripts.push({
        src: node.attributes.src,
        api: node.attributes.api || "legacy"
      });
    }
    if (Array.isArray(node.content)) {
      scripts.push(...getScripts(node.content));
    }
  }
  return scripts;
}

export function normalizePaths(paths) {
  
}