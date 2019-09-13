# markdown-html

Takes markdown as input and generates an html file that includes all resources except the images that markdown links to.

Puppeteer has a page.pdf option that allows you to set custom headers / footers.

await page.pdf({
  path: 'example.pdf',
  displayHeaderFooter: true,
  headerTemplate: '<div id="header-template" style="font-size:10px !important; color:#808080; padding-left:10px"><span class="date"></span><span class="title"></span><span class="url"></span><span class="pageNumber"></span><span class="totalPages"></span></div>',
  footerTemplate: '<div id="footer-template" style="font-size:10px !important; color:#808080; padding-left:10px"><span class="date"></span><span class="title"></span><span class="url"></span><span class="pageNumber"></span><span class="totalPages"></span></div>',
  margin: {
    top: '100px',
    bottom: '200px',
    right: '30px',
    left: '30px',
  },
});


https://stackoverflow.com/questions/9238868/how-do-i-avoid-a-page-break-immediately-after-a-heading

h1 {
    page-break-inside: avoid;
}
h1::after {
    content: "";
    display: block;
    height: 100px;
    margin-bottom: -100px;
}

## Captions

Replace 

**Figure x** This is the caption

with

<span class="caption"><span>Figure 1</span> This is the caption</span>

and keep track of x=1. Then replace *figure x* with figure 1. This can be done by pre-processing the markup.

Add css to keep span.caption together with whatever comes before it.
Will probably not work... Write a remarkable plugin and place caption before image instead?

## Git integration

Replace **git:date** with the date of the last modification according to git.

## Page breaks

Convert --- to manual page-breaks by css for hr tag?