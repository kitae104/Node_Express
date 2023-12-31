const express = require('express')  //③번 단계에서 다운받았던 express 모듈을 가져온다.
const fs = require('fs');
const path = require('path');
const qs = require('querystring');
const bodyParser = require('body-parser');
const sanitizeHtml = require('sanitize-html');
const compression = require('compression');
let template = require('./lib/template.js');

const app = express()               //가져온 express 모듈의 function을 이용해서 새로운 express 앱을 만든다. 🔥
const port = 3000                   //포트는 3000번 해도되고, 5000번 해도 된다. -> 이번엔 3000번 포트를 백 서버로 두겠다.

//==============================
// 미들웨어
//==============================
// parse application/x-www-form-urlencoded 
app.use(bodyParser.urlencoded({ extended: false }));  //body-parser를 이용해서, post 방식으로 전송된 데이터를, 원래의 데이터로 변환한다.
app.use(compression());                               //압축을 해서, 전송한다. (속도가 빨라진다.



// 미들웨어의 사용으로 불필요한 코드의 내용을 줄일 수 있다.
// get 방식으로 들어오는 모든 요청에 대해서, 미들웨어를 실행한다.
app.get("*", function(req, res, next){                     //미들웨어를 이용
  fs.readdir('./data', function(error, filelist){
    req.list = filelist;    // req.list를 만들어서, filelist를 넣는다.
    next();                 // next()를 호출해야, 다음 미들웨어로 넘어간다.
  });
});

//==============================
// 라우트
//==============================
app.get('/', (req, res) => {        //express 앱(app)을 넣고, root directory에 오면, 
  
  let title = 'Welcome';
  let description = 'Hello, Node.js';
  let list = template.list(req.list);
  let html = template.HTML(title, list,
    `<h2>${title}</h2>${description}`,
    `<a href="/create">create</a>`
  );
  res.send(html);
  
});

// URL에 따라 다른 페이지를 보여주는 기능
app.get('/page/:pageId', function(req, res){
  
  let filteredId = path.parse(req.params.pageId).base;                    //파일 목록에서, 사용자가 요청한 페이지를 찾는다.
  fs.readFile(`data/${filteredId}`, 'utf8', function(err, description){   //파일을 읽는다.
    let title = req.params.pageId;                                        
    let sanitizedTitle = sanitizeHtml(title);                             //사용자가 요청한 페이지의 제목을, sanitizeHtml을 이용해서, 보안을 한다.
    let sanitizedDescription = sanitizeHtml(description, {                // 사용자가 요청한 페이지의 본문을, sanitizeHtml을 이용해서, 보안을 한다.
      allowedTags:['h1']
    });
    let list = template.list(req.list);
    let html = template.HTML(sanitizedTitle, list,
      `<h2>${sanitizedTitle}</h2>${sanitizedDescription}`,
      ` <a href="/create">create</a>
        <a href="/update/${sanitizedTitle}">update</a>
        <form action="/delete_process" method="post">
          <input type="hidden" name="id" value="${sanitizedTitle}">
          <input type="submit" value="delete">
        </form>`
    );      
    res.send(html);
  });  
});

app.get('/create', function(req, res){
  
  var title = 'WEB - create';
  var list = template.list(req.list);
  var html = template.HTML(title, list, `
    <form action="/create_process" method="post">
      <p><input type="text" name="title" placeholder="title"></p>
      <p>
        <textarea name="description" placeholder="description"></textarea>
      </p>
      <p>
        <input type="submit">
      </p>
    </form>
  `, '');
  res.send(html);
  
});

app.post('/create_process', function(req, res){
  var post = req.body;          // body-parser를 이용해서, post 방식으로 전송된 데이터를, 원래의 데이터로 변환한다.
  var title = post.title;
  var description = post.description;
  fs.writeFile(`data/${title}`, description, 'utf8', function(err){
    res.writeHead(302, {Location: `/?id=${title}`});
    res.end();
  }); 
}); 

app.get('/update/:pageId', function(req, res){
  
    var filteredId = path.parse(req.params.pageId).base;
    fs.readFile(`data/${filteredId}`, 'utf8', function(err, description){
      var title = req.params.pageId;
      var list = template.list(req.list);
      var html = template.HTML(title, list,
        `
        <form action="/update_process" method="post">
          <input type="hidden" name="id" value="${title}">
          <p><input type="text" name="title" placeholder="title" value="${title}"></p>
          <p>
            <textarea name="description" placeholder="description">${description}</textarea>
          </p>
          <p>
            <input type="submit">
          </p>
        </form>
        `,
        `<a href="/create">create</a> <a href="/update?id=${title}">update</a>`
      );
      res.send(html);
    });
  
});

app.post('/update_process', function(req, res){  
  var post = req.body;        // body-parser를 이용해서, post 방식으로 전송된 데이터를, 원래의 데이터로 변환한다.
  var id = post.id;
  var title = post.title;
  var description = post.description;
  fs.rename(`data/${id}`, `data/${title}`, function(error){
    fs.writeFile(`data/${title}`, description, 'utf8', function(err){
      res.redirect(`/?id=${title}`)
    })
  });
  
});

app.post('/delete_process', function(req, res){  
  var post = req.body;      // body-parser를 이용해서, post 방식으로 전송된 데이터를, 원래의 데이터로 변환한다.
  var id = post.id;
  var filteredId = path.parse(id).base;
  fs.unlink(`data/${filteredId}`, function(error){
    res.redirect('/');
  });  
});

//==============================
// 서버 실행
//==============================
app.listen(port, () => {
  console.log(`>>>> 실행 at http://localhost:${port}`)
}) //포트 3000번에서 이 앱을 실행한다.