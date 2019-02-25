# Gallery

# Usage

At the moment it has not been pushed to npm but I will be completing this in the next days.

```html
<!DOCTYPE html>
<html>

    <head>
        <title>

        </title>

        <link href="/layout.css" rel="stylesheet"/>
        <script src="/index.js" type="text/javascript"></script>
    </head>

    <body>

        <gallery gallery-id="picsum-gallery">
            <url source="https://picsum.photos/2000/2000/?image=1023"/>
            <url source="https://picsum.photos/2000/2000/?image=1027"/>
        </gallery>

        <div gallery-ref="picsum-gallery">
            When clicked will open the gallery with the id picsum-gallery
        </div>
    </body>

</html>
```