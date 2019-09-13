import * as puppeteer from 'puppeteer'
import { readFileSync } from 'fs'
import { createHttpServer } from '@mattiash/http'
import { join } from 'path'

const html = readFileSync(0, 'utf-8')

let srv = createHttpServer((req, res) => {
    if (req.url === '/') {
        res.writeHead(200, {
            'Content-Length': Buffer.byteLength(html),
            'Content-Type': 'text/html',
        })
        res.end(html)
    } else {
        const filename = join('.', req.url)
        const file = readFileSync(filename)
        res.writeHead(200, {
            'Content-Length': Buffer.byteLength(file),
            'Content-Type': 'text/css',
        })
        res.end(file)
    }
})

async function run() {
    let address = await srv.listenAsync()
    console.log(`Listening on http://${address.address}:${address.port}/`)
    const browser = await puppeteer.launch()
    const page = await browser.newPage()
    await page.goto(`http://[${address.address}]:${address.port}/`)
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
