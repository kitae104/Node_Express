const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const sanitizeHtml = require('sanitize-html');
const template = require('../lib/template.js');

router.get('/create', function(req, res){
  
  var title = 'WEB - create';
  var list = template.list(req.list);
  var html = template.HTML(title, list, `
    <form action="/topic/create_process" method="post">
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

router.post('/create_process', function(req, res){
  var post = req.body;          // body-parser를 이용해서, post 방식으로 전송된 데이터를, 원래의 데이터로 변환한다.
  var title = post.title;
  var description = post.description;
  fs.writeFile(`data/${title}`, description, 'utf8', function(err){   
    res.redirect(`/topic/${title}`);  //redirect를 이용해서, 사용자를 다른 페이지로 보낸다.
  }); 
}); 

router.get('/update/:pageId', function(req, res, next){
  
  var filteredId = path.parse(req.params.pageId).base;
  fs.readFile(`data/${filteredId}`, 'utf8', function(err, description){

    if(err){
      next(err);
    } else {
      var title = req.params.pageId;
      var list = template.list(req.list);
      var html = template.HTML(title, list,
        `
        <form action="/topic/update_process" method="post">
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
        `<a href="/topic/create">create</a> <a href="/topic/update/${title}">update</a>`
      );
      res.send(html);
    }      
  });  
});

router.post('/update_process', function(req, res){  
  var post = req.body;        // body-parser를 이용해서, post 방식으로 전송된 데이터를, 원래의 데이터로 변환한다.
  var id = post.id;
  var title = post.title;
  var description = post.description;
  fs.rename(`data/${id}`, `data/${title}`, function(error){
    fs.writeFile(`data/${title}`, description, 'utf8', function(err){
      res.redirect(`/topic/${title}`)
    })
  });
  
});

router.post('/delete_process', function(req, res){  
  var post = req.body;      // body-parser를 이용해서, post 방식으로 전송된 데이터를, 원래의 데이터로 변환한다.
  var id = post.id;
  var filteredId = path.parse(id).base;
  fs.unlink(`data/${filteredId}`, function(error){
    res.redirect('/');
  });  
});

// URL에 따라 다른 페이지를 보여주는 기능
router.get('/:pageId', function(req, res, next){
  
  let filteredId = path.parse(req.params.pageId).base;                    //파일 목록에서, 사용자가 요청한 페이지를 찾는다.
  fs.readFile(`data/${filteredId}`, 'utf8', function(err, description){   //파일을 읽는다.
    
    if(err){
      next(err);
    } else {
    
      let title = req.params.pageId;                                        
      let sanitizedTitle = sanitizeHtml(title);                             //사용자가 요청한 페이지의 제목을, sanitizeHtml을 이용해서, 보안을 한다.
      let sanitizedDescription = sanitizeHtml(description, {                // 사용자가 요청한 페이지의 본문을, sanitizeHtml을 이용해서, 보안을 한다.
        allowedTags:['h1']
      });
      let list = template.list(req.list);
      let html = template.HTML(sanitizedTitle, list,
        `<h2>${sanitizedTitle}</h2>${sanitizedDescription}`,
        ` <a href="/topic/create">create</a>
          <a href="/topic/update/${sanitizedTitle}">update</a>
          <form action="/topic/delete_process" method="post">
            <input type="hidden" name="id" value="${sanitizedTitle}">
            <input type="submit" value="delete">
          </form>`
      );      
      res.send(html);
    }
  });  
});

module.exports = router;