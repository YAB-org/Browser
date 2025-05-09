ace.define("ace/mode/htmlpp_highlight_rules", ["require", "exports", "module", "ace/lib/oop", "ace/mode/text_highlight_rules"], function(require, exports, module) {
    var oop = require("ace/lib/oop");
    var TextHighlightRules = require("ace/mode/text_highlight_rules").TextHighlightRules;

    var HtmlppHighlightRules = function() {
        this.$rules = {
            "start": [
                {
                    token: "meta.tag",
                    regex: "<\\/?(?=\\w)",
                    next: "tag"
                },
                {
                    token: "text",
                    regex: "\\s+"
                },
                {
                    token: "text",
                    regex: "[^<]+"
                }
            ],
            "tag": [
                {
                    token: "entity.name.tag", // tags
                    regex: "[a-zA-Z0-9\\-]+"
                },
                {
                    token: "entity.other.attribute-name", // attribute
                    regex: "\\s+[a-zA-Z\\-:]+"
                },
                {
                    token: "keyword.operator", // equal sign
                    regex: "="
                },
                {
                    token: "string.quoted.double", // quotes
                    regex: '"[^"]*"'
                },
                {
                    token: "string.quoted.single",
                    regex: "'[^']*'"
                },
                {
                    token: "text",
                    regex: "\\s+"
                }
            ]
        };
    };

    oop.inherits(HtmlppHighlightRules, TextHighlightRules);
    exports.HtmlppHighlightRules = HtmlppHighlightRules;
});



const htmlAttributes = {
    "a": ["class", "id", "href"],
    "body": ["class", "id"],
    "button": ["class", "id"],
    "div": ["class", "id"],
    "h1": ["class", "id"],
    "h2": ["class", "id"],
    "h3": ["class", "id"],
    "h4": ["class", "id"],
    "h5": ["class", "id"],
    "h6": ["class", "id"],
    "head": ["class", "id"],
    "hr": ["class", "id"],
    "html": ["class", "id"],
    "img": ["class", "id"],
    "input": ["class", "id", "placeholder", "text"],
    "li": ["class", "id"],
    "link": ["class", "id", "href"],
    "meta": ["class", "id", "name", "content"],
    "ol": ["class", "id"],
    "option": ["class", "id"],
    "p": ["class", "id"],
    "script": ["class", "id", "src", "version"],
    "select": ["class", "id"],
    "textarea": ["class", "id"],
    "title": ["class", "id"],
    "ul": ["class", "id"]
};

const htmlElementSnippets = {
    "a": "<a href=\"$1\">$0</a>",
    "body": "<body>$0</body>",
    "button": "<button>$0</butto",
    "div": "<div>$1</div>$0",
    "h1": "<h1>$0</h1>",
    "h2": "<h2>$0</h2>",
    "h3": "<h3>$0</h3>",
    "h4": "<h4>$0</h4>",
    "h5": "<h5>$0</h5>",
    "h6": "<h6>$0</h6>",
    "head": "<head>$0</head>",
    "hr": "<hr>$0</hr>",
    "html": "<html>$0</html>",
    "img": "<img src=\"$1\">$0",
    "input": "<input>$0",
    "li": "<li>$0</li>",
    "link": "<link href=\"$1\">$0",
    "meta": "<meta name=\"$1\" content=\"$2\">$0",
    "ol": "<ol>$0</ol>",
    "option": "<option>$0</option>",
    "p": "<p>$0</p>",
    "script": "<script src=\"$1\">$0",
    "select": "<select>$0</select>",
    "textarea": "<textarea>$0",
    "title": "<title>$0</title>",
    "ul": "<ul>$0</ul>"
};

const htmlElementCompleter = {
    getCompletions: function(editor, session, pos, prefix, callback) {
      const suggestions = Object.keys(htmlElementSnippets)
        .filter(tag => tag.startsWith(prefix))
        .map(tag => ({
          caption: tag,
          value: tag,
          snippet: htmlElementSnippets[tag],
          meta: "HTML Element",
          score: 1000
        }));
      callback(null, suggestions);
    }
  };

const htmlppAttributeCompleter = {
    getCompletions: function(editor, session, pos, prefix, callback) {
        const currentLine = session.getLine(pos.row);
        const tagMatch = currentLine.match(/<(\w+)/);
        if (tagMatch) {
            const tagName = tagMatch[1].toLowerCase();
            const attributes = htmlAttributes[tagName] || [];
            const suggestions = attributes.filter(attr => attr.startsWith(prefix)).map(attr => ({
                caption: attr,
                value: attr,
                meta: "attribute",
                score: 1000
            }));
            callback(null, suggestions);
        }
    }
};


ace.define("ace/mode/htmlpp", ["require", "exports", "module", "ace/lib/oop", "ace/mode/text", "ace/mode/htmlpp_highlight_rules"], function(require, exports, module) {
    var oop = require("ace/lib/oop");
    var TextMode = require("ace/mode/text").Mode;
    var HtmlppHighlightRules = require("ace/mode/htmlpp_highlight_rules").HtmlppHighlightRules;

    var Mode = function() {
        this.HighlightRules = HtmlppHighlightRules;
    };
    oop.inherits(Mode, TextMode);

    (function() {
        this.$id = "ace/mode/htmlpp";

        
    }).call(Mode.prototype);

    exports.Mode = Mode;
});


ace.require("ace/ext/language_tools").addCompleter(htmlppAttributeCompleter);
ace.require("ace/ext/language_tools").addCompleter(htmlElementCompleter);