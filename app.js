var express = require('express');
var app = express();
var path = require('path');

app.use(express.static(path.join(__dirname , 'public')));

app.use('/build/', express.static(path.join(__dirname , 'node_modules/three/build')));
app.use('/jsm/', express.static(path.join(__dirname , 'node_modules/three/examples/jsm')));

app.listen(3000,()=>console.log('Server started on port 3000'));