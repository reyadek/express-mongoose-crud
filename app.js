const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const { body, validationResult, check } = require('express-validator');
const methodOverride = require('method-override');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const flash = require('connect-flash');

//Require connction database
require('./utils/db.js');

//Require model Student
const Student = require('./models/Student.js');

//Configuration express
const app = express();
const port = 3000;
app.set('view engine', 'ejs');

//Use express-ejs-layouts package
app.use(expressLayouts);

//Set file public
app.use(express.static(__dirname + '/public'));

app.use(express.urlencoded({ extended: true }));
app.listen(port, () => {
  console.log(`Application run at http://localhost:${port}`);
});

//Configuratio flash
app.use(cookieParser('secret'));
app.use(
  session({
    cookie: { maxAge: 6000 },
    secret: 'secret',
    resave: true,
    saveUninitialized: true,
  })
);
app.use(flash());

//Setup method override, use DELETE and PUT
app.use(methodOverride('_method'));

app.get('/', (req, res) => {
  res.render('index', {
    title: 'index',
    layout: 'layouts/main-layout',
  });
});

app.get('/student/add', (req, res) => {
  res.render('add-student', {
    title: 'Add student',
    layout: 'layouts/main-layout',
  });
});

app.post(
  '/student/store',
  [
    body('email').custom(async (valEmail) => {
      const duplicate = await Student.findOne({ email: valEmail });
      if (duplicate) {
        throw new Error('Email duplicated!');
      }
      return true;
    }),
    check('email', 'Email not valid').isEmail(),
    check('phone', 'Phone not valid').isMobilePhone('id-ID'),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      //   return res.status(400).json({ errors: errors.array() });
      res.render('add-student', {
        title: 'Add Data',
        layout: 'layouts/main-layout',
        errors: errors.array(),
      });
    } else {
      Student.insertMany(req.body, (error, result) => {
        //Sent flash
        req.flash('msgSuccess', 'Data success saved!');
        res.redirect('/student');
      });
    }
  }
);

app.get('/student', async (req, res) => {
  const list = await Student.find();

  res.render('student', {
    title: 'list student',
    layout: 'layouts/main-layout',
    list: list,
    message: req.flash('msgSuccess'),
  });
});

app.delete('/student/delete/:_id', (req, res) => {
  Student.deleteOne({ _id: req.params._id }).then((error, result) => {
    req.flash('msgSuccess', 'Data success delete!');
    res.redirect('/student');
  });
});

app.get('/student/edit/:_id', async (req, res) => {
  const find = await Student.findOne({ _id: req.params._id });
  res.render('edit-student', {
    title: 'Edit data',
    layout: 'layouts/main-layout',
    find: find,
  });
});

app.put(
  '/student/update/:_id',
  [
    check('email', 'Email not valid').isEmail(),
    check('phone', 'Phone not valid').isMobilePhone('id-ID'),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.render('edit-student', {
        title: 'Edit Data',
        layout: 'layouts/main-layout',
        errors: errors.array(),
        find: req.body,
      });
    } else {
      Student.updateOne(
        { _id: req.params._id },
        {
          $set: {
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
          },
        }
      ).then((result) => {
        //Sent flash
        req.flash('msgSuccess', 'Data success saved!');
        res.redirect('/student');
      });
    }
  }
);
