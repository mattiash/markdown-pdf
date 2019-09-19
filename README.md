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

Will replace the string `@git:lastUpdated` with
the date that the file was last updated according to `git log`.

### def

Will replace a string `@def Figure X This is the caption`
with a proper caption and wrap the caption and the element above it
in a div to keep them together and simplify styling.
The syntax is `@def <type> <id> <text>`.
Replaces the id with an incrementing counter per type.

### ref

Will replace a string `@ref Figure X` with the id used when `@def Figure X` was replaced.
The type of the reference is case insensitive, but case will be preserved in the replaced text. I.e. `@ref Figure X` will be replaced with `Figure 1` and `@ref figure X` will be replaced with `figure 1`.
