export function parse(content) {
  let rules = {};
  // Remove comments
  content = content.replaceAll(/\/\*([^¬]|.)*?\*\//g, '');
  // Get rules
  (content.match(/([^\{\n])+?{([^\{])*?}/g)??[])
    .forEach(rule => {
      // Selectors
      let selector = rule.split('{')[0].trim();
      selector = selector.split(',').map(s=>{
        s = s.replaceAll(/\.|\#/g, '').trim();
        if (s==='*') return '*';
        return `${s}, .${s}`;
      });
      // Properties
      let o = {};
      rule
        .match(/{(([^\{])*?)}/)[1]
        .trim()
        .split(';')
        .map(p=>{
          return p
            .trim()
            .split(':')
            .map(pp=>pp.trim());
        })
        .filter(e=>e.length>1)
        .forEach(p=>{
          o[p[0]] = p[1];
        })
      // Set
      selector.forEach(s=>{
        rules[s] = o;
      })
    });
  return rules;
}