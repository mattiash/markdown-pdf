import { readFileSync } from 'fs'

const { Remarkable } = require('remarkable')

const md = new Remarkable({
    html: true, // Enable HTML tags in source
    xhtmlOut: false, // Use '/' to close single tags (<br />)
    breaks: false, // Convert '\n' in paragraphs into <br>
    langPrefix: 'language-', // CSS language prefix for fenced blocks

    // Enable some language-neutral replacement + quotes beautification
    typographer: false,

    // Double + single quotes replacement pairs, when typographer enabled,
    // and smartquotes on. Set doubles to '«»' for Russian, '„“' for German.
    quotes: '“”‘’',

    // Highlighter function. Should return escaped HTML,
    // or '' if the source string is not changed
    highlight: function(/*str, lang*/) {
        return ''
    },
})

const markdown = readFileSync(process.argv[2]).toString()
console.log(`
<html>
    <head>
        <meta charset="utf-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <title></title>
        <meta name="description" content="">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <link rel="stylesheet" href="node_modules/github-markdown-css/github-markdown.css">
        <link rel="stylesheet" href="pdf-extra.css">

        <style>
            .markdown-body {
		        box-sizing: border-box;
		        min-width: 200px;
		        max-width: 980px;
		        margin: 0 auto;
		        padding: 45px;
	        }
        </style>
    </head>
    <body>
      <article class="markdown-body">
`)
console.log(md.render(markdown))

console.log(`</article></body></html>`)
