'use strict';

require('dotenv').config();
const express = require('express');

const PORT = process.env.PORT || 3030;
const app = express();
const superagent = require('superagent');
const pg = require('pg');
const client = new pg.Client(process.env.DATABASE_URL);
const methodOverride = require('method-override');



// static resources
app.use(express.static('./public'));

// for post
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(methodOverride('_method'));

// to set the render engine
app.set('view engine', 'ejs');

//Home page
app.get('/', (req, res) => {
  let SQL = 'SELECT * FROM books_info;';
  let numberOfSelectedBooks;
  client.query(SQL)
    .then(data => {
      // console.log(data.rows);
      numberOfSelectedBooks=data.rows.length;
      res.render('./pages/index',{books:data.rows , count: numberOfSelectedBooks} );
    });

});


//searches/new   the Form
app.get('/searches/new', (req,res) =>{
  res.render('pages/searches/new');
});


//searches    the results
let arrofObj=[];
app.post('/searches', (req, res) =>{
  let url;
  console.log(req.body); // what did user choose! an object
  console.log(req.body.search); // title or author
  console.log(req.body.catagory); // the title or the author name

  if (req.body.search === 'title'){
    url = `https://www.googleapis.com/books/v1/volumes?q=search+intitle:${req.body.catagory}`;
  }

  if (req.body.search === 'author') {
    url = `https://www.googleapis.com/books/v1/volumes?q=search+inauthor:${req.body.catagory}`;
  }
  superagent.get(url)
    .then(data =>{
      data.body.items.map( element =>{
        const book= new Book(element);
        arrofObj.push(book);
      });
      res.render('pages/searches/show', { books: arrofObj });
    });
});

// add selected book to DB
app.get('/addBook/:id',(req,res)=>{
  let unique = req.params.id;
  arrofObj.forEach(val =>{
    if(unique === val.id){
      let selectedBook = val;
      let SQL = 'INSERT INTO books_info (img_url,title,author,description,ISBN,bookshelf) VALUES ($1,$2,$3,$4,$5,$6);';
      let safeValues = [val.img,val.title,val.authors,val.description,val.ISBN,req.body.book];
      client.query(SQL,safeValues)
        .then(data =>{
          res.redirect('/addBook/:id');
        });
    }
  });
});


app.post('/book/:id', (req, res)=>{
  let unique = req.params.id;
  arrofObj.forEach(val =>{
    if(unique === val.id){
      let selectedBook = val;
      let SQL = 'INSERT INTO books_info (img_url,title,author,description,ISBN,bookshelf) VALUES ($1,$2,$3,$4,$5,$6);';
      let safeValues = [val.img,val.title,val.authors,val.description,val.ISBN,req.body.book];
      client.query(SQL,safeValues)
        .then(data =>{
          res.redirect('/');
        });
    }
  });
});

// Get book details
app.get('/books/:id',(request, response) =>{
  let id = request.params.id;
  let sql = 'SELECT * FROM books_info WHERE id = $1;';
  let safeValues = [id];

  client.query(sql, safeValues)
    .then(results => {
      let chosenBook = results.rows[0];
      console.log('data',results.rows);
      response.render('pages/details', {book:chosenBook});
    });
});


app.put('/update/:id', (req,res) =>{
  let {img_url,title,author,description,ISBN,bookshelf} = req.body;
  let SQL = 'UPDATE books_info SET img_url=$1,title=$2,author=$3,description=$4,ISBN=$5,bookshelf=$6 WHERE id=$7;';
  let safeValues = [img_url,title,author,description,ISBN,bookshelf,req.params.id];
  client.query(SQL,safeValues)
    .then(res.redirect(`/books/${req.params.id}`));
});

app.delete('/delete/:id', (req,res) =>{
  let SQL = 'DELETE FROM books_info WHERE id=$1';
  let value = [req.params.id];
  client.query(SQL,value)
    .then(res.redirect('/'));
});


function Book(data){
  if (data.volumeInfo.imageLinks ){

    this.img = data.volumeInfo.imageLinks.smallThumbnail;

  }else {
    this.img = 'https://images.vexels.com/media/users/3/157545/isolated/preview/057098b4a63e172134e0f04bbbcd6e8b-school-book-icon-by-vexels.png';
  }
  if (data.volumeInfo.title){ this.title = data.volumeInfo.title; }
  else{
    this.title= 'can\'t find the Title ';
  }
  if ( data.volumeInfo.authors){ this.authors = data.volumeInfo.authors;}
  else {
    this.authors= 'can\'t find the Authors ';
  }
  if (data.volumeInfo.description){ this.description = data.volumeInfo.description;}
  else {
    this.description = 'no description ';
  }
  if (data.volumeInfo.industryIdentifiers[0].identifier ) {this.ISBN=data.volumeInfo.industryIdentifiers[0].identifier;}
  else {this.ISBN = 'ISBN';}
  this.bookshelf=data.volumeInfo.categories;
  this.id=data.id;
}










// erorr routes
app.get('*',(req,res)=>{
  res.render('pages/error');
});


client.connect()
  .then (()=>{
    app.listen(PORT, ()=>{
      console.log('listening from port ', PORT);
    });

  });
