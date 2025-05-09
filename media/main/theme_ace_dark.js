ace.define('ace/theme/yab-dark', ['require', 'exports', 'module', 'ace/lib/dom'], function (acequire, exports, module) {
    // Soft Colors theme for Ace Editor
    exports.isDark = true;
    exports.cssClass = 'ace-yab-dark';
    exports.cssText =
    // Gutter
    '.ace-yab-dark .ace_gutter {\
        background: #14171a;\
        color: #3d4752\
    }\
    ' +
    '.ace-yab-dark .ace_scrollbar {\
     scrollbar-color:rgb(58, 67, 76) #14171a;\
    }\
    ' +
    // Print margin
    '.ace-yab-dark .ace_print-margin {\
        width: 1px;\
        background: #343d4a\
    }\
    ' +
    // "("
    '.ace-yab-dark .ace_lparen {\
        color: #3d91de\
    }\
    '+
    // "("
    '.ace-yab-dark .ace_rparen {\
        color: #3d91de\
    }\
    ' +
    '.ace-yab-dark .ace_fold {\
        color: #949494 !important;\
        border: none !important;\
        background: none !important;\
    }\
    ' + 
    '.ace-yab-dark .ace_fold:hover {\
        background:rgba(237, 237, 237, 0.11) !important;\
    }\
    ' + 
    '.ace-yab-dark .ace_error {\
        background: #7d2c2c !important;\
        color: #ececec !important;\
    }\
    '+ 
    '.ace-yab-dark .ace_warning {\
        background:rgb(178 157 64) !important;\
        color:rgb(24, 24, 24) !important;\
    }\
    '+ 
    '.ace-yab-dark .ace_info {\
        background: #2c5b7d !important;\
        color: #ececec !important;\
    }\
    ' +
    // Editor background and default text
    '.ace-yab-dark {\
        background-color:rgb(17, 19, 21);\
        color: #FFFFFFA8\
    }\
    ' +
    // Cursor
    '.ace-yab-dark .ace_cursor {\
        color: #FFD580BF\
    }\
    ' +
    // Selection
    '.ace-yab-dark .ace_marker-layer .ace_selection {\
        background:rgb(58 67 76)\
    }\
    ' +
    '.ace-yab-dark.ace_multiselect .ace_selection.ace_start {\
        box-shadow: 0 0 3px 0px #212733;\
        border-radius: 2px\
    }\
    ' +
    // Steps (e.g., debugger)
    '.ace-yab-dark .ace_marker-layer .ace_step {\
        background:rgb(230, 209, 126)\
    }\
    ' +
    // Bracket match
    '.ace-yab-dark .ace_marker-layer .ace_bracket {\
        margin: -1px 0 0 -1px;\
        border: 1px solid #3d4752\
    }\
    ' +
    // Active line and gutter
    '.ace-yab-dark .ace_marker-layer .ace_active-line,\
     .ace-yab-dark .ace_gutter-active-line {\
        background:rgb(34, 39, 44)\
    }\
    ' +
    // Selected word highlight
    '.ace-yab-dark .ace_marker-layer .ace_selected-word {\
        border: 1px solid #343f4c\
    }\
    ' +
    // Keywords & operators
    '.ace-yab-dark .ace_keyword.ace_operator {\
        color: #C7AA6D\
    }\
    '+
    // Keywords & operators
    '.ace-yab-dark .ace_keyword {\
        color: #A37742\
    }\
    '
     +
    // Constants & numbers
    '.ace-yab-dark .ace_constant.ace_language,\
     .ace-yab-dark .ace_constant.ace_numeric,\
     .ace-yab-dark .ace_constant.ace_character,\
     .ace-yab-dark .ace_constant.ace_other {\
        color: #6C90B9CC\
    }\
    ' +
    '.ace-yab-dark .ace_constant.ace_character.ace_escape,\
    .ace-yab-dark .ace_string.ace_regexp {\
        color: #5CCFE6CC\
    }\
    ' +
    // Strings
    '.ace-yab-dark .ace_string {\
        color: #6C90B9CC\
    }\
    ' +
    // Functions & methods
    '.ace-yab-dark .ace_support.ace_function,\
    .ace-yab-dark .ace_entity.ace_name.ace_function {\
        color: #FFD580BF\
    }\
    ' +
    // Classes & types
    '.ace-yab-dark .ace_support.ace_class,\
    .ace-yab-dark .ace_support.ace_type,\
    .ace-yab-dark .ace_entity.ace_name.ace_tag {\
        color: #5CCFE6CC\
    }\
    ' +
    // Storage (e.g., var, let, const)
    '.ace-yab-dark .ace_storage,\
    .ace-yab-dark .ace_storage.ace_type {\
        color: #FFAE57\
    }\
    ' +
    // Invalid & deprecated
    '.ace-yab-dark .ace_invalid {\
        color: #FF3333\
    }\
    ' +
    '.ace-yab-dark .ace_invalid.ace_deprecated {\
        color: #FFFFFFA8;\
        background-color: #FFAE57\
    }\
    ' +
    // Comments
    '.ace-yab-dark .ace_comment {\
        font-style: italic;\
        color: #5C6773\
    }\
    ' +
    // Variables & parameters
    '.ace-yab-dark .ace_variable {\
        color: #D9D7CE\
    }\
    ' +
    '.ace-yab-dark .ace_variable.ace_language {\
        font-style: italic;\
        color: #5CCFE6CC\
    }\
    ' +
    '.ace-yab-dark .ace_variable.ace_parameter {\
        color: #6C90B9CC\
    }' +
    '.ace-yab-dark.ace_editor.ace_autocomplete .ace_marker-layer .ace_active-line {\
        background-color: #3a4867 !important;\
    }\
    ' +
    '.ace-yab-dark.ace_editor.ace_autocomplete .ace_completion-highlight {\
        color: #639bc5 !important;\
    }\
    ' +
    '.ace-yab-dark.ace_editor.ace_autocomplete .ace_line-hover {\
        border: 1px solid rgb(13 83 150 / 80%) !important;\
        background: rgb(58 84 103 / 62%) !important;\
    }\
    ' +
    '.ace-yab-dark .ace_tooltip {\
        background-color: #22262b;\
        border: 1px solid #3d3d3d;\
        color: #9b9b9b;\
    }\
    ' +
    '.ace-yab-dark .ace_snippet-marker {\
    background: none !important; \
    border: none !important;\
    }\
    ';

    var dom = acequire('../lib/dom');
    dom.importCssString(exports.cssText, exports.cssClass);
});