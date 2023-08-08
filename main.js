const express = require('express')  //express 모듈을 가져온다.
const fs = require('fs');
const bodyParser = require('body-parser');
const compression = require('compression');
const helmet = require('helmet');
app.use(helmet());                  //보안을 위한 미들웨어

const indexRouter = require('./routes/index');
const topicRouter = require('./routes/topic');

const app = express()               //가져온 express 모듈의 function을 이용해서 새로운 express 앱을 만든다. 🔥
const port = 3000                   //포트는 3000번 해도되고, 5000번 해도 된다. -> 이번엔 3000번 포트를 백 서버로 두겠다.

//==============================
// 정적인 파일 경로 설정
//==============================
app.use(express.static('public'));  //public 디렉토리 안에서, static 파일을 찾겠다. (정적인 파일들을, public 디렉토리 안에서 찾겠다.)

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
// 라우터
//==============================
app.use("/", indexRouter);          //indexRouter에게, "/"로 시작하는 주소들을 맡긴다. ("/"는 생략 가능하다.
app.use('/topic', topicRouter);     //topic으로 시작하는 주소들은, topicRouter에게 맡긴다.

//==============================
// 오류 처리
//==============================
app.use(function(req, res, next) {
  res.status(404).send('죄송합니다. 해당 페이지를 찾을 수 없습니다.');
});

app.use(function(err, req, res, next) {
  console.error(err.stack);
  res.status(500).send('죄송합니다. 서버에 오류가 있습니다.');
});

//==============================
// 서버 실행
//==============================
app.listen(port, () => {
  console.log(`>>>> 실행 at http://localhost:${port}`)
}) //포트 3000번에서 이 앱을 실행한다.