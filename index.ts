#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs'
import * as puppeteer from 'puppeteer'
import { createHttpServer } from '@mattiash/http'
import { join, dirname, resolve } from 'path'
const { Remarkable } = require('remarkable')
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

markdown = markdown.replace(
    /@git:lastUpdated/g,
    () =>
        execSync(
            `cd ${basePath} ; git log --format=format:%ai -n 1 -- ${absoluteFilename}`,
        )
            .toString()
            .split(' ')[0],
)

const printcss = readFileSync(require.resolve('../print.css'))
const githubcss = readFileSync(require.resolve('github-markdown-css'))
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
    </head>
    <body>
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
    } else if (file) {
        let content: any
        switch (file) {
            case 'github-markdown.css':
                content = githubcss
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
                'Content-Type': mime.contentType(filename),
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
}

run()
