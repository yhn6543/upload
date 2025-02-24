// 1. 폴더생성
// 2. server.js 생성
// npm init -y
// npm i express ejs multer 
const { group, time } = require('console');
const express = require('express');
const app = express();
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcrypt');
app.set('view engine', 'ejs');
app.use(express.static('public')); // public 폴더는 파일을 서비스한다
app.use(express.static('images'));
app.use(express.urlencoded({ extended: true })); // form 데이터 post로 받기
app.use(express.json());
const { promisify } = require('util');
const { render } = require('ejs');

const db = new sqlite3.Database('./fc-insta-db.db');

const dbAllAsync = promisify(db.all).bind(db);
const dbGetAsync = promisify(db.get).bind(db);

app.use(session({
    secret:'test',
    resave: false,
    saveUninitialized: false,
    cookie:{maxage:3600000000}
}))

app.post('/llogin', (req,res)=>{
    req.session.username = 'admin';
    res.redirect('/');
})






// 메인 페이지
app.get('/', async (req, res) => {
    const post = await dbAllAsync("SELECT * FROM img JOIN post on img.post_no=post.no;");
    const cnt = await dbGetAsync("SELECT count(*) FROM post;");
    const groupBy = await dbAllAsync("SELECT post_no,count(*) FROM img GROUP BY post_no;");
    const post_desc = await dbAllAsync("SELECT description FROM post;");
    const user = await dbAllAsync("SELECT * FROM user;");
    const comment = await dbAllAsync("SELECT * FROM comment");
    let store = [];
    let like = [];
    if(req.session.username){
        like = await dbAllAsync("SELECT post_no FROM like WHERE user_id=? ORDER BY post_no ASC;", [req.session.username]);
        store = await dbAllAsync("SELECT * FROM store;");
    }

    return res.status(200).render('index', { username: req.session.username, cnt: cnt['count(*)'], post:post, groupBy:groupBy, post_desc:post_desc, user:user, like:like, store: store});
})







app.get('/posts/form', (req,res)=>{
    if(!req.session.username){
        res.send("<script>alert('로그인이 필요합니다.'); location.href='/login'; </script>");
    }
    else{
        res.render('form');
    }
})








app.get('/join', (req,res)=>{
    res.render('join');
})










const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images/'); // 업로드된 파일을 저장할 경로
    },
    filename: (req, file, cb) => {
        file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
        if(req.originalUrl == '/posts'){
            cb(null, `${Date.now()}_${file.originalname}`); // 현재 시간을 파일명으로
        }
        else{
            cb(null, `profile_${req.body.id}_${file.originalname}`);
        }
    }
});
const upload = multer({ storage });




app.post('/posts', upload.array('imgs'), async (req, res) => {
    const insert_no = (await dbGetAsync("SELECT max(no) FROM post;"))['max(no)']+1;
    const user = await dbAllAsync("SELECT * FROM user");
    const timestamp = (new Date()).getTime();
    const user_no = user.find(u => u.id == req.session.username).user_no;
    
    db.run("INSERT INTO post (no, description, user_no, timestamp) VALUES (?, ?, ?, ?)", [insert_no, req.body.description, user_no, timestamp]);

    for(f in req.files){
        db.run("INSERT INTO img (post_no, filename, timestamp) VALUES (?, ?, ?)", [insert_no, req.files[f].filename, timestamp]);
    }


    res.redirect('/');
})

app.delete('/posts', (req, res)=>{
    if(req.session.username != req.body.userId) return;

    db.run("DELETE FROM comment_empathy WHERE comment_no IN (SELECT comment_no FROM comment WHERE post_no=?)", [req.body.postNo]);
    db.run("DELETE FROM comment WHERE post_no=?", [req.body.postNo]);
    db.run("DELETE FROM like WHERE post_no=?", [req.body.postNo]);
    db.run("DELETE FROM img WHERE post_no=?", [req.body.postNo]);
    db.run("DELETE FROM post WHERE no=?", [req.body.postNo]);

    return res.sendStatus(204);
})


app.put('/posts', (req, res)=>{
    if(!checkSession(req, res)) return checkSession(req, res);

    db.run("UPDATE post SET description=? WHERE no=?", [req.body.text, req.body.postNo]);

    return res.sendStatus(200);
})







app.get(`/user-page/:userId`, async (req, res)=>{
    const userId = req.params.userId;
    const loginId = req.session.username;
    
    const user = await dbGetAsync("SELECT user_no, profile FROM user WHERE id=?", [userId]);
    const post = await dbAllAsync("SELECT description, no FROM post WHERE user_no=?", [user?.user_no]);
    const comment = await dbAllAsync("SELECT text, comment_no, post_no FROM comment WHERE user_id=?", [userId]);
    const like = await dbAllAsync("SELECT description, post_no FROM post JOIN like ON post.no=like.post_no WHERE like.user_id=?", [userId]);
    const empathy = await dbAllAsync("SELECT text, comment_empathy.comment_no, comment.post_no FROM comment JOIN comment_empathy ON comment.comment_no=comment_empathy.comment_no WHERE comment_empathy.user_id=?", [userId]);
    const store = await dbAllAsync("SELECT description, post_no FROM post JOIN store ON post.no=store.post_no WHERE store.user_id=?", [userId]);
    
    return res.render('user-page', { userId: userId, profile: user.profile, post: post, comment: comment, like: like, empathy: empathy, loginId: loginId, store: store });
})









app.post('/users', upload.single('profile'), async (req, res)=>{                            // 회원가입
    const id = req.body.id;
    const pw = bcrypt.hashSync(req.body.pw, 10);
    const filename = req.file?.filename ? req.file?.filename : "default.png";
    const timestamp = (new Date()).getTime();

    const regExp = /[ \{\}\[\]\/?.,;:|\)*~`!^\-_+┼<>@\#$%&\'\"\\\(\=]/gi;                   // 특수문자 체크
    
    if(regExp.test(id)){
        return res.send('<script> alert("특수문자 사용 불가능"); location.href="/join"; </script>');
    }

    const unique = (await dbGetAsync("SELECT count(*) FROM user WHERE id=?", [id]))['count(*)'];            // 아이디 중복 체크
    if(unique) return res.send('<script> alert("사용 중인 아이디"); location.href="/join"; </script>');
    

    db.run('INSERT INTO user (id, pw, profile, timestamp) VALUES (?, ?, ?, ?)', [id, pw, filename, timestamp]);
    
    res.send('<script> alert("회원 등록이 완료되었습니다."); location.href="/"; </script>');
})








app.get('/login', (req,res)=>{
    if (req.session.username) res.redirect('/');
    else res.render('login');
})

app.post('/login', async (req,res)=>{
    const id = req.body.id;
    const password = await dbGetAsync("SELECT pw FROM user where id=?", [id]);
    
    if(password?.pw && bcrypt.compareSync(req.body.pw, password.pw)){
        req.session.username = id;
        res.send(`<script> alert("${id} 로그인 성공"); location.href="/"; </script>`);
    }
    else{
        res.send('<script> alert("로그인 실패"); location.href="/login"; </script>');
    }
})


app.post('/logout', (req, res)=>{
    console.log("로그아웃 ", req.session.username);
    req.session.destroy();
    
    res.status(200).json({ message: "OK" });
})








app.post('/post/like/:postNo', async (req, res)=>{
    const userId = req.session.username;
    const postNo = req.params.postNo;
    const timestamp = (new Date()).getTime();
    
    db.run("INSERT INTO like (post_no, user_id, timestamp) VALUES (?, ?, ?)", [postNo, userId, timestamp]);
    db.run("UPDATE post SET like=like+1 WHERE no=?", [postNo]);

    return res.sendStatus(201);
})

app.delete('/post/like/:postNo', async (req, res)=>{
    const userId = req.session.username;
    const postNo = req.params.postNo;
    
    db.run("DELETE FROM like WHERE post_no=? and user_id=?", [postNo, userId]);
    db.run("UPDATE post SET like=like-1 WHERE no=?", [postNo]);

    return res.sendStatus(204);

})








app.post('/post/store/:postNo', async (req, res)=>{
    const userId = req.session.username;
    const postNo = req.params.postNo;
    const timestamp = (new Date()).getTime();
    
    db.run("INSERT INTO store (post_no, user_id, timestamp) VALUES (?, ?, ?)", [postNo, userId, timestamp]);

    return res.sendStatus(201);
})

app.delete('/post/store/:postNo', async (req, res)=>{
    const userId = req.session.username;
    const postNo = req.params.postNo;

    db.run("DELETE FROM store WHERE post_no=? and user_id=?", [postNo, userId]);

    return res.sendStatus(204);
})










app.get('/comments/:postNo', async (req, res)=>{
    const comments = await dbAllAsync("SELECT * FROM comment WHERE post_no=?", [req.params.postNo]);
    const commentEmpathy = await dbAllAsync("SELECT * FROM comment_empathy WHERE user_id=?", [req.session.username]);
    const user = await dbAllAsync("SELECT * FROM user;");

    comments.forEach(comment => { comment.profile = user.find(u=>u.id == comment.user_id)?.profile });
    return res.status(200).json({ message: "데이터 수신 성공", receivedPostNo: req.params.postNo, commentData: comments, commentEmpathyList: commentEmpathy});
})

app.post('/comments', (req, res)=>{
    if(!checkSession(req, res)) return checkSession(req, res);

    db.run("BEGIN TRANSACTION");
    const timestamp = (new Date()).getTime();
    db.run("INSERT INTO comment (text, post_no, user_id, timestamp) VALUES (?, ?, ?, ?)", [req.body.comment, req.body.postNo, req.body.userId, timestamp]);
    db.run("UPDATE post SET comments=comments+1 WHERE no=?", [req.body.postNo]);

    db.run("COMMIT");

    return res.sendStatus(201);
})

app.get('/comments-update', (req, res)=>{
    res.status(200).render(`comments-update`, { postNo: req.query.postNo, commentNo: req.query.commentNo, userId: req.session.username });
})


app.put('/comments', (req, res)=>{
    db.run("UPDATE comment SET text=? WHERE comment_no=?", [req.body.text, req.body.commentNo]);

    return res.sendStatus(201);
})


app.delete('/comments', (req, res)=>{

    db.run("UPDATE post SET comments=comments-1 WHERE no=?", [req.body.postNo]);
    db.run("DELETE FROM comment WHERE comment_no=?", [req.body.commentNo]);
    db.run("DELETE FROM comment_empathy WHERE comment_no=?", [req.body.commentNo]);
    

    return res.sendStatus(204);
})











app.post('/comments/empathy/:commentNo', (req, res)=>{
    if(!checkSession(req, res)) return checkSession(req, res);

    const timestamp = (new Date()).getTime();
    db.run("INSERT INTO comment_empathy (comment_no, user_id, timestamp) VALUES (?, ?, ?)", [req.params.commentNo, req.session.username, timestamp]);
    db.run("UPDATE comment SET empathy=empathy+1 WHERE comment_no=?", [req.params.commentNo]);
    
    return res.sendStatus(201);
})

app.delete('/comments/empathy/:commentNo', (req, res)=>{
    if(!checkSession(req, res)) return checkSession(req, res);

    db.run("DELETE FROM comment_empathy WHERE comment_no=? and user_id=?", [req.params.commentNo, req.session.username]);
    db.run("UPDATE comment SET empathy=empathy-1 WHERE comment_no=?", [req.params.commentNo]);

    return res.sendStatus(204);
})






app.get(`/post-list/:userId`, async (req, res)=>{
    if(!req.params.userId) console.log("나의 글");
    const postList = await dbAllAsync("SELECT post.description, post.no FROM post JOIN user USING (user_no) WHERE user_no=(SELECT user_no FROM user WHERE id=?)", [req.params.userId]);
    return res.status(200).json(postList);
})





app.get('/:postNo', (req, res) => {
    return res.send(`
        <script>
            localStorage.setItem("postNo", ${req.params.postNo});
            location.href = "/";
        </script>
    `);
});



app.post('/search', async (req, res)=>{
    const search = `%${req.body.search}%`
    const userList = await dbAllAsync("SELECT * FROM user WHERE id LIKE ?", [search]);

    return res.status(200).json({ userList: userList });
})






function checkSession(req, res){
    if(req.session.username) return true;
    else return res.send("<script>alert('로그인이 필요합니다.'); location.href='/login'; </script>");
}







app.listen(80); // 서버 실행





/*
status
200 get             요청 정상처리
201 put / post      새 리소스 생성
202                 요청은 받음 / 아직 처리 X
204 delete          삭제, 응답 x


401                 로그인 필요
403                 권한 없음
404                 요청한 리소스 없음






*/