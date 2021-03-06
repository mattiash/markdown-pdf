#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs'
import * as puppeteer from 'puppeteer'
import { createHttpServer } from '@mattiash/http'
import { join, dirname, resolve } from 'path'
const { Remarkable } = require('remarkable')
import * as hljs from 'highlight.js'
const mime = require('mime-types')

import * as yargs from 'yargs'
import { execSync } from 'child_process'

const argv = yargs
    .usage('Usage: $0 <inputfile>')
    .demandCommand(1)
    .options({
        style: { type: 'string', describe: 'Custom stylesheet' },
        browser: {
            type: 'boolean',
            default: false,
            describe: 'Show html in browser',
        },
        output: {
            type: 'string',
            describe: 'Output filename',
            default: '<inputfile>.pdf',
        },
        paper: { type: 'string', default: 'A4', describe: 'Paper size' },
    }).argv

const absoluteFilename = resolve(process.argv[2])
const basePath = dirname(absoluteFilename)
let markdown = readFileSync(absoluteFilename).toString()

// Map each reference type to an array of references
const refMap = new Map<string, string[]>()

markdown = markdown
    .replace(
        /@git:lastUpdated/g,
        () =>
            (
                execSync(
                    `cd ${basePath} ; git log --format=format:%ai -n 1 -- ${absoluteFilename}`,
                ) || 'Error!'
            )
                .toString()
                .split(' ')[0],
    )
    .replace(
        /@def\s+(\S+)\s+([a-zA-Z0-9]+)(.*)/g,
        (_: string, type: string, id: string, caption: string) => {
            const lctype = type.toLowerCase()
            let ref = refMap.get(lctype)
            if (!ref) {
                ref = []
                refMap.set(lctype, ref)
            }
            ref.push(id)
            return `<div class="caption ${lctype}"><span>${type} ${ref.length}</span>${caption}</div>`
        },
    )
    .replace(
        /@ref\s+(\S+)\s+([a-zA-Z0-9]+)/g,
        (_: string, type: string, id: string) => {
            const lctype = type.toLowerCase()
            const ref = refMap.get(lctype) || []
            const documentId = ref.indexOf(id) + 1
            return `<span class="ref ${lctype}">${type} ${documentId ||
                'Error!'}</span>`
        },
    )

const printcss = readFileSync(require.resolve('../print.css'))
const githubcss = readFileSync(require.resolve('github-markdown-css'))
const highlightcss = readFileSync(
    require.resolve('highlight.js/styles/github.css'),
)
argv.output =
    argv.output === '<inputfile>.pdf' ? absoluteFilename + '.pdf' : argv.output

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
    highlight: function(str: string, lang: string) {
        if (lang && hljs.getLanguage(lang)) {
            try {
                return hljs.highlight(lang, str).value
            } catch (err) {}
        }

        try {
            return hljs.highlightAuto(str).value
        } catch (err) {}

        return '' // use external default escaping
    },
})

const html = `
<html>
    <head>
        <meta charset="utf-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <title></title>
        <meta name="description" content="">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <link rel="stylesheet" href="/@mattiash/markdown-pdf/github-markdown.css">
        <link rel="stylesheet" href="/@mattiash/markdown-pdf/highlight.css">
        <link rel="stylesheet" href="/@mattiash/markdown-pdf/print.css">
        <link rel="stylesheet" href="/@mattiash/markdown-pdf/style.css">

        <style>
            .markdown-body {
		        box-sizing: border-box;
		        min-width: 200px;
		        max-width: 980px;
		        margin: 0 auto;
		        padding: 45px;
	        }
        </style>
        <script type="text/javascript">
            function wrapCaptions() {
                // Wrap div.caption and the element before it in
                // a div.captioned
                let captions = document.getElementsByClassName('caption')
                for( let i=0; i < captions.length; i++ ) {
                    const caption = captions[i]
                    let e = document.createElement('div')
                    e.setAttribute('class',caption.getAttribute('class').replace('caption', 'captioned'))
                    e.appendChild(caption.previousElementSibling)
                    caption.parentElement.insertBefore(e,caption)
                    e.appendChild(caption)
                }

                // Wrap div.captioned and any heading before it in
                // a div.keeptogether
                let captioned = document.getElementsByClassName('captioned')
                for( let i=0; i < captioned.length; i++ ) {
                    const elem = captioned[i]
                    if(
                        elem.previousElementSibling
                        && ['H2','H3','H4','H5','H6'].includes(elem.previousElementSibling.tagName)
                    ) {
                        let e = document.createElement('div')
                        e.setAttribute('class','keeptogether')
                        e.appendChild(elem.previousElementSibling)
                        elem.parentElement.insertBefore(e,elem)
                        e.appendChild(elem)

                    }
                }

            }
        </script>
    </head>
    <body onload="wrapCaptions()">
      <article class="markdown-body">
      ${md.render(markdown)}
      </article>
    </body>
</html>`

let srv = createHttpServer((req, res) => {
    let [, file] = req.url.match(/\/@mattiash\/markdown-pdf\/([^/]*)/) || []
    if (req.url === '/') {
        res.writeHead(200, {
            'Content-Length': Buffer.byteLength(html),
            'Content-Type': 'text/html',
        })
        res.end(html)
    } else if (req.url === '/favicon.ico') {
        res.writeHead(404)
        res.end()
    } else if (file) {
        let content: any
        switch (file) {
            case 'github-markdown.css':
                content = githubcss
                break
            case 'highlight.css':
                content = highlightcss
                break
            case 'print.css':
                content = printcss
                break
            case 'style.css':
                content = argv.style ? readFileSync(argv.style) : ''
        }

        if (content !== undefined) {
            res.writeHead(200, {
                'Content-Length': Buffer.byteLength(content),
                'Content-Type': 'text/css',
            })
            res.end(content)
        } else {
            console.log('Internal file not found', file)
            res.writeHead(200, {
                'Content-Length': 0,
                'Content-Type': 'text/css',
            })
            res.end()
        }
    } else {
        // Return files referenced by markdown
        const filename = join(basePath, req.url)
        try {
            const content = readFileSync(filename)
            res.writeHead(200, {
                'Content-Length': Buffer.byteLength(content),
                'Content-Type':
                    mime.lookup(filename) || 'application/octet-stream',
            })
            res.end(content)
        } catch (e) {
            console.log('Not found', filename)
            res.writeHead(404)
            res.end()
        }
    }
})

async function run() {
    let address = await srv.listenAsync()
    const url =
        address.family === 'IPv6'
            ? `http://[${address.address}]:${address.port}/`
            : `http://${address.address}:${address.port}/`

    if (argv.browser) {
        console.log(`Open ${url} in a browser to see output`)
        console.log('Ctrl-c to exit')
    } else {
        const browser = await puppeteer.launch()
        const page = await browser.newPage()
        await page.goto(url, { waitUntil: 'networkidle0' })
        await page.pdf({
            path: argv.output,
            format: argv.paper as any,
            displayHeaderFooter: true,
            headerTemplate: '<div></div>',
            footerTemplate:
                '<div id="footer-template" style="padding-bottom: 5mm; font-family: Roboto, Arial, Helvetica, sans-serif; width: 100%; padding-right: 10mm; font-size: 8pt !important; text-align: right;" ><span class="pageNumber"></span></div>',
            margin: {
                top: '20mm',
                bottom: '25mm',
                right: '10mm',
                left: '10mm',
            },
        })
        await browser.close()
        await srv.closeAsync()
    }
}

run()
