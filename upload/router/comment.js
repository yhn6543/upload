const express = require('express');
const router = express.Router();


const sqlite3 = require('sqlite3').verbose();
const { promisify } = require('util');

const db = new sqlite3.Database('./fc-insta-db.db');

const dbAllAsync = promisify(db.all).bind(db);
const dbGetAsync = promisify(db.get).bind(db);


router.get('/:postNo', async (req, res)=>{
    const comments = await dbAllAsync("SELECT * FROM comment WHERE post_no=?", [req.params.postNo]);
    const commentEmpathy = await dbAllAsync("SELECT * FROM comment_empathy WHERE user_id=?", [req.session.username]);
    const user = await dbAllAsync("SELECT * FROM user;");

    comments.forEach(comment => { comment.profile = user.find(u=>u.id == comment.user_id)?.profile });
    return res.status(200).json({ message: "데이터 수신 성공", receivedPostNo: req.params.postNo, commentData: comments, commentEmpathyList: commentEmpathy});
})

router.post('/', (req, res)=>{
    if(!checkSession(req, res)) return checkSession(req, res);

    db.run("BEGIN TRANSACTION");
    const timestamp = (new Date()).getTime();
    db.run("INSERT INTO comment (text, post_no, user_id, timestamp) VALUES (?, ?, ?, ?)", [req.body.comment, req.body.postNo, req.body.userId, timestamp]);
    db.run("UPDATE post SET comments=comments+1 WHERE no=?", [req.body.postNo]);

    db.run("COMMIT");

    return res.sendStatus(201);
})




router.put('/', (req, res)=>{
    db.run("UPDATE comment SET text=? WHERE comment_no=?", [req.body.text, req.body.commentNo]);

    return res.sendStatus(201);
})


router.delete('/', (req, res)=>{

    db.run("UPDATE post SET comments=comments-1 WHERE no=?", [req.body.postNo]);
    db.run("DELETE FROM comment WHERE comment_no=?", [req.body.commentNo]);
    db.run("DELETE FROM comment_empathy WHERE comment_no=?", [req.body.commentNo]);
    

    return res.sendStatus(204);
})





// refresh
router.get('/comments-update', (req, res)=>{
    res.status(200).render(`comments-update`, { postNo: req.query.postNo, commentNo: req.query.commentNo, userId: req.session.username });
})













router.post('/empathy/:commentNo', (req, res)=>{
    if(!checkSession(req, res)) return checkSession(req, res);

    const timestamp = (new Date()).getTime();
    db.run("INSERT INTO comment_empathy (comment_no, user_id, timestamp) VALUES (?, ?, ?)", [req.params.commentNo, req.session.username, timestamp]);
    db.run("UPDATE comment SET empathy=empathy+1 WHERE comment_no=?", [req.params.commentNo]);
    
    return res.sendStatus(201);
})

router.delete('/empathy/:commentNo', (req, res)=>{
    if(!checkSession(req, res)) return checkSession(req, res);

    db.run("DELETE FROM comment_empathy WHERE comment_no=? and user_id=?", [req.params.commentNo, req.session.username]);
    db.run("UPDATE comment SET empathy=empathy-1 WHERE comment_no=?", [req.params.commentNo]);

    return res.sendStatus(204);
})





function checkSession(req, res){
    if(req.session.username) return true;
    else return res.send("<script>alert('로그인이 필요합니다.'); location.href='/login'; </script>");
}



module.exports = router;