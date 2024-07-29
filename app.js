const express = require('express');
const path = require('path');
const app = express();

function html(filename)
{
    return path.join(__dirname, `/www/html/${filename}`);
}

function css(filename)
{
    return path.join(__dirname, `/www/css/${filename}`);
}

function js(filename)
{
    return path.join(__dirname, `/www/js/${filename}`);
}

app.get('/', (req, res)=>{
    console.log(`Rendering file: ${html("index.html")}\nRequested by ${req.ip}`);
    res.sendFile(html("index.html"));
});

app.listen(8080, ()=>{
    console.log("Listening on port 8080");
});