const Sequelize = require('sequelize');
const User = require('./user');
const Comment = require('./comment');

const env = process.env.NODE_ENV || 'development';    // NODE_ENV 환경변수가 설정되어 있지 않다면 development 모드로 설정
const config = require('../config/config')[env];      // config.json 파일에서 development 항목을 불러옴
const db = {};                                        // db 객체 생성

const sequelize = new Sequelize(config.database, config.username, config.password, config);   // Sequelize 생성자를 통해 MySQL 연결 객체 생성

db.sequelize = sequelize;       // db 객체에 sequelize 속성 추가
db.Sequelize = Sequelize;       // db 객체에 Sequelize 속성 추가

db.User = User;                 // db 객체에 User 모델 연결
db.Comment = Comment;           // db 객체에 Comment 모델 연결

User.init(sequelize);           // User 모델과 MySQL 연결
Comment.init(sequelize);        // Comment 모델과 MySQL 연결

User.associate(db);             // User 모델과 Comment 모델의 관계를 정의
Comment.associate(db);          // Comment 모델과 User 모델의 관계를 정의

module.exports = db;            // db 객체를 모듈로 반환