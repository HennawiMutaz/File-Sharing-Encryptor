require('dotenv').config();
const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const File = require('./models/File');


//* DB
mongoose.connect(process.env.DATABASE_URL);

//* app
const app = express();

//* middleware
const upload = multer({ dest: 'uploads' });
app.use(express.urlencoded({ extended: true }));

//* view engine
app.set('view engine', 'ejs');

//* root
app.get('/', (req,res) => {
    res.render('index');
});

//* download file
app.route('/file/:id').get(handleDownload).post(handleDownload);

//* upload file
app.post('/upload', upload.single('file'), async (req,res) => { 
    const data = {
        path: req.file.path,
        name: req.file.originalname
    }
    if (req.body.password != null && req.body.password !== '') {
        data.password = await bcrypt.hash(req.body.password, 5);
    }

    const file = await File.create(data);

    res.render('index', { link: `${req.headers.origin}/file/${file.id}` });
});

//* handle downloads with/without passwords
async function handleDownload(req, res) {
     
    const file = await File.findById(req.params.id);

    if (file.password != null) { //* if file has password
        if (req.body.password == null) { //* if user didn't enter password input
            res.render('password');
            return;
        }

        if (!await bcrypt.compare(req.body.password, file.password)) { //* if user enters incorrect password
            res.render('password', { error: true });
            return;
        }
    }

    file.downloadCount++;

    await file.save();

    res.download(file.path, file.name);
}

app.listen(process.env.PORT || 3000);