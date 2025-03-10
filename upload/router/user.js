const express = require('express');
const router = express.Router();


const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const bcrypt = require('bcrypt');
const { promisify } = require('util');

const db = new sqlite3.Database('./fc-insta-db.db');

const dbAllAsync = promisify(db.all).bind(db);
const dbGetAsync = promisify(db.get).bind(db);




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








router.get('/join', (req, res)=>{
    return res.render('join');
})

router.get('/login', (req,res)=>{
    if (req.session.username) res.redirect('/');
    else res.render('login');
})

router.post('/login', async (req,res)=>{
    const id = req.body.id;
    const password = await dbGetAsync("SELECT pw FROM user where id=?", [id]);
    
    if(password?.pw && bcrypt.compareSync(req.body.pw, password.pw)){
        req.session.username = id;
        res.send(`<script> alert("${id} 로그인 성공"); location.href="/"; </script>`);
    }
    else{
        res.send('<script> alert("로그인 실패"); location.href="/user/login"; </script>');
    }
})


router.post('/logout', (req, res)=>{
    console.log("로그아웃 ", req.session.username);
    req.session.destroy();
    
    res.status(200).json({ message: "OK" });
})






router.post('/', upload.single('profile'), async (req, res)=>{                            // 회원가입
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










router.get(`/page/:userId`, async (req, res)=>{
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













module.exports = router;