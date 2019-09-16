## Captions

Replace 

```
@caption Figure x This is the caption
```

with

<span class="caption"><span>Figure 1</span> This is the caption</span>

and keep track of x=1. Then replace *@ref figure x* with figure 1. This can be done by pre-processing the markup.

Add css to keep span.caption together with whatever comes before it.
Will probably not work... Write a remarkable plugin and place caption before image instead?

## Git integration

Replace **git:date** with the date of the last modification according to git.
