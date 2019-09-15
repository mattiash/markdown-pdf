# markdown-html

Takes markdown as input and generates a pdf file by printing it with puppeteer.

## Usage

```
markdown-pdf README.md
```

Produces a README.md.pdf in the same directory as README.md

## Options

```
--style <filename>  Includes a custom stylesheet
--output <filename> Specify name of pdf file
--browser           Allow you to see the generated html in a browser
--paper <size>      Set the paper-size. Default A4. See puppeteer documentation for page.pdf()
```

## Macros

### git:lastUpdated

Will replace the string `@mattiash/markdown-pdf/git:lastUpdated` with
the date that the file was last updated according to `git log`.