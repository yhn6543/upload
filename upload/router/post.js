const express = require('express');
const router = express.Router();



const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
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



router.post('/search', async (req, res)=>{
    const search = `%${req.body.search}%`

    const userList = await dbAllAsync("SELECT id FROM user WHERE id LIKE ?;", [search]);
    const postList = await dbAllAsync("SELECT no, description, id FROM post JOIN user ON post.user_no=user.user_no WHERE description LIKE ?;", [search]);

    userList.map((user)=>{ user.sortValue = user.id })
    postList.map((post)=>{ post.sortValue = post.description })
    
    const list = [...userList.slice(0, 9), ...postList.slice(0, 9)];
    list.sort(function(a, b){
        return a.sortValue- b.sortValue;
    });

    return res.status(200).json({ list: list });
})





router.get('/form', (req, res)=>{
    console.log('form');
    if(!req.session.username){
        res.send("<script>alert('로그인이 필요합니다.'); location.href='/user/login'; </script>");
    }
    else{
        res.render('form');
    }
})


router.post('/', upload.array('imgs'), async (req, res) => {
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



router.delete('/', (req, res)=>{
    if(req.session.username != req.body.userId) return;

    db.run("DELETE FROM comment_empathy WHERE comment_no IN (SELECT comment_no FROM comment WHERE post_no=?)", [req.body.postNo]);
    db.run("DELETE FROM comment WHERE post_no=?", [req.body.postNo]);
    db.run("DELETE FROM like WHERE post_no=?", [req.body.postNo]);
    db.run("DELETE FROM img WHERE post_no=?", [req.body.postNo]);
    db.run("DELETE FROM post WHERE no=?", [req.body.postNo]);

    return res.sendStatus(204);
})

router.put('/', (req, res)=>{
    if(!checkSession(req, res)) return checkSession(req, res);

    db.run("UPDATE post SET description=? WHERE no=?", [req.body.text, req.body.postNo]);

    return res.sendStatus(200);
})










router.post('/like/:postNo', async (req, res)=>{
    const userId = req.session.username;
    const postNo = req.params.postNo;
    const timestamp = (new Date()).getTime();
    
    db.run("INSERT INTO like (post_no, user_id, timestamp) VALUES (?, ?, ?)", [postNo, userId, timestamp]);
    db.run("UPDATE post SET like=like+1 WHERE no=?", [postNo]);

    return res.sendStatus(201);
})

router.delete('/like/:postNo', async (req, res)=>{
    const userId = req.session.username;
    const postNo = req.params.postNo;
    
    db.run("DELETE FROM like WHERE post_no=? and user_id=?", [postNo, userId]);
    db.run("UPDATE post SET like=like-1 WHERE no=?", [postNo]);

    return res.sendStatus(204);

})




router.post('/store/:postNo', async (req, res)=>{
    const userId = req.session.username;
    const postNo = req.params.postNo;
    const timestamp = (new Date()).getTime();
    
    db.run("INSERT INTO store (post_no, user_id, timestamp) VALUES (?, ?, ?)", [postNo, userId, timestamp]);

    return res.sendStatus(201);
})

router.delete('/store/:postNo', async (req, res)=>{
    const userId = req.session.username;
    const postNo = req.params.postNo;

    db.run("DELETE FROM store WHERE post_no=? and user_id=?", [postNo, userId]);

    return res.sendStatus(204);
})















router.get(`/list/:userId`, async (req, res)=>{
    if(!req.params.userId) console.log("나의 글");
    const postList = await dbAllAsync("SELECT post.description, post.no FROM post JOIN user USING (user_no) WHERE user_no=(SELECT user_no FROM user WHERE id=?)", [req.params.userId]);
    return res.status(200).json(postList);
})




function checkSession(req, res){
    if(req.session.username) return true;
    else return res.send("<script>alert('로그인이 필요합니다.'); location.href='/login'; </script>");
}






module.exports = router;