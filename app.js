const dotenv = require('dotenv');
const express = require('express');
const path = require('path');
const nunjucks = require('nunjucks');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const session = require("express-session");
const multer = require("multer");
const fs = require("fs");

// DB 연결
const { sequelize } = require('./models');

//===============================
// 익스프레스 객체 생성
//===============================
dotenv.config();

const indexRouter = require('./routes/index');
const userRouter = require('./routes/user');

const app = express();

//===============================
// 포트 설정
//===============================
app.set('port', process.env.PORT || 3000);


//===============================
// 탬플릿 엔진 설정
//===============================
app.set("view engine", "html"); 
//app.set('views', path.join(__dirname, 'views'));
nunjucks.configure('views', {
  express: app,
  watch: true,
});

// DB 연결
sequelize.sync({ force: false })
  .then(() => {
    console.log('데이터베이스 연결 성공');
  })
  .catch((err) => {
    console.error(err);
  });


//===============================
// 미들웨어 설정(순서가 중요함!)
//===============================
app.use(morgan('dev'));     // 개발모드 dev, 배포모드  combined
app.use("/", express.static(path.join(__dirname, 'public-0405'))); // 정적 파일 제공
app.use(cookieParser(process.env.COOKIE_SECRET));    // 쿠키 설정
app.use(express.json());                  // JSON 형식의 본문 처리
app.use(express.urlencoded({ extended: true })); // form 형식의 본문 처리 - true: qs, false: querystring
app.use(session({                         // 세션 설정
  resave: false,                          // 요청이 올 때 세션에 수정사항이 생기지 않더라도 세션을 다시 저장할지 설정
  saveUninitialized: false,               // 세션에 저장할 내역이 없더라도 세션을 저장할지 설정
  secret: process.env.COOKIE_SECRET,      // 필수 항목. cookie-parser의 비밀키와 같은 역할
  cookie : {
    httpOnly: true,                       // 클라이언트에서 쿠키 확인 불가
  },
  // name: 'session-cookie',
}));         
app.use(multer().array());  // 폼 데이터 파일 업로드 처리

try{
  fs.readdirSync('upload');
} catch(error) {
  console.error('upload 폴더가 없어 upload 폴더를 생성합니다.');
  fs.mkdirSync('upload');
}

const upload = multer({
  // 1. 업로드한 파일 위치 지정
  storage: multer.diskStorage({
    destination(req, file, done) {   
      done(null, 'upload/');          // 첫 번째 인수: 에러 발생 시 사용, 두 번째 인수: 실제 경로
    },
    filename(req, file, done) {
      const ext = path.extname(file.originalname);
      done(null, path.basename(file.originalname, ext) + Date.now() + ext);
    },
  }),
  // 2. 파일 크기 제한
  limits: { fileSize: 5 * 1024 * 1024 },
});

//===============================
// 공통 미들웨어 설정
//===============================
app.use((req, res, next) => { 
  console.log("모든 요청에 실행하고 싶어요.");
  req.data = "데이터 전달";                     // req 객체에 데이터를 담아서 다음 미들웨어로 전달
  next();
});

//===============================
// 라우터 설정
//===============================
app.get('/', indexRouter);

app.use('/user', userRouter);

app.post("/", (req, res) => {  
  res.send("POST 요청");
});

app.get("/upload", (req, res) => {
  res.sendFile(path.join(__dirname + '/multipart.html'));
});

app.post("/upload", upload.single('image'), (req, res) => {
  console.log(req.files);
  res.send("ok");
});

app.get("/about", (req, res) => {  
  res.status(200).send("about 페이지");
});

app.get("/category/:name", (req, res) => {  
  res.send(`hello ${req.params.name}`);
});

//===============================
// 404 에러 처리 미들웨어
//===============================
app.use((req, res, next) => {
  const error =  new Error(`${req.method} ${req.url} 라우터가 없습니다.`);
  error.status = 404;
  next(error);
});

//===============================
// 에러 처리 미들웨어
//===============================
app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = process.env.NODE_ENV !== 'production' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

//===============================
// 서버 실행
//===============================
app.listen(app.get('port'), () => {
  console.log(app.get('port'), '번 포트에서 대기 중');
});