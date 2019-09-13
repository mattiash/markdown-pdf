import { readFileSync, writeFileSync } from 'fs'
import * as puppeteer from 'puppeteer'
import { createHttpServer } from '@mattiash/http'
import { join, dirname, resolve } from 'path'

const { Remarkable } = require('remarkable')

const absoluteFilename = resolve(process.argv[2])
const basePath = dirname(absoluteFilename)
const markdown = readFileSync(absoluteFilename).toString()

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

const html = `
<html>
    <head>
        <meta charset="utf-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <title></title>
        <meta name="description" content="">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <link rel="stylesheet" href="/@mattiash/markdown-pdf/github-markdown.css">
        <link rel="stylesheet" href="/@mattiash/markdown-pdf/print.css">

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
      ${md.render(markdown)}
      </article>
    </body>
</html>`

writeFileSync('index.html', html)

let srv = createHttpServer((req, res) => {
    let file: string
    if (req.url === '/') {
        res.writeHead(200, {
            'Content-Length': Buffer.byteLength(html),
            'Content-Type': 'text/html',
        })
        res.end(html)
    } else if (
        ([, file] = req.url.match(/\/@mattiash\/markdown-pdf\/([^/]*)/) || [])
    ) {
        const filename =
            file === 'github-markdown.css'
                ? './node_modules/github-markdown-css/github-markdown.css'
                : './print.css'
        console.log('Fetching file', filename)
        const content = readFileSync(filename)
        res.writeHead(200, {
            'Content-Length': Buffer.byteLength(content),
            'Content-Type': 'text/css',
        })
        res.end(content)
    } else {
        // Return files referenced by markdown
    }
})

async function run() {
    let address = await srv.listenAsync()
    const url =
        address.family === 'IPv6'
            ? `http://[${address.address}]:${address.port}/`
            : `http://${address.address}:${address.port}/`
    console.log(`Listening on ${url}`)
    const browser = await puppeteer.launch()
    const page = await browser.newPage()
    await page.goto(url)
    await page.pdf({
        path: 'hn.pdf',
        format: 'A4',
        displayHeaderFooter: true,
        headerTemplate: '<div></div>',
        //     '<div id="header-template" style="font-size:10px !important; color:#808080; padding-left:10px"><span class="date"></span><span class="title"></span><span class="url"></span><span class="pageNumber"></span><span class="totalPages"></span></div>',
        footerTemplate:
            '<div id="footer-template" style="padding-bottom: 10px; font-family: Arial, Helvetica, sans-serif; width: 100%; padding-right: 30px; font-size: 8pt !important; text-align: right;" ><span class="pageNumber"></span></div>',
        // '<div id="footer-template" style="background-color: #aaa; font-size:10px !important; color:#808080; padding-left:10px"><span class="pageNumber"></span></div>',
        margin: {
            top: '50px',
            bottom: '70px',
            right: '30px',
            left: '30px',
        },
    })
    await browser.close()
    await srv.closeAsync()
}

run()
