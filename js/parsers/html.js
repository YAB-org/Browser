export const nonTerminatingElements = ['hr','img','input','textarea','link','meta','script']

function subparse(content) {
  let list = [];
  for (let i = 0; i<content.length; i++) {
    let stack = [];
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
          stack = []
        }
      }
      stack.pop();

      let elem = stack.join('').trim().split(' ');
      temp.name = elem[0].toLocaleLowerCase();
      if (temp.name.startsWith('/')) {
        // ummmmm, lets ignore that
        continue;
      }
      if (temp.name.match(/^[a-zA-Z][a-zA-Z0-9-]*$/m)===null) {
        console.warn('[HTML PARSER] Invalid element name '+temp.name)
      }

      let attributes = elem.slice(1, elem.length).join(' ').match(/\b([a-zA-Z0-9]+)(=(".*?"|[^\s]+))?/g)??[];
      let tempattr = {};
      attributes.forEach(attr => {
        attr = attr.split('=');
        let val = attr.slice(1,attr.length).join('=');
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1,-1);
        tempattr[attr[0].toLocaleLowerCase()] = val;
      })
      temp.attributes = tempattr;

      if (nonTerminatingElements.includes(temp.name)) {
        list.push(temp)
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
            closingTag += char;
          }
          closingTag = closingTag.slice(1, -1).toLocaleLowerCase();
          if (closingTag === temp.name) {
            break;
          } else {
            innerContent += `</${closingTag}>`;
          }
        } else {
          innerContent += char;
        }
      }

      if (innerContent.trim()) {
        if (innerContent.includes('<')) {
          temp.content = subparse(innerContent.trim());
        } else {
          temp.content = innerContent;
        }
      }

      list.push(temp);
    }
  }
  return list;
}

export function parse(content) {
  let tree = [];
  content = content.replaceAll(/<!--([^¬]|.)*?-->/g, '');
  tree = subparse(content);
  return tree;
}