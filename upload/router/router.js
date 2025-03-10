const express = require('express');
const router = express.Router();

const postRouter = require('./post');
const userRouter = require('./user');
const commentRouter = require('./comment');


const sqlite3 = require('sqlite3').verbose();
const { promisify } = require('util');

const db = new sqlite3.Database('./fc-insta-db.db');

const dbAllAsync = promisify(db.all).bind(db);
const dbGetAsync = promisify(db.get).bind(db);






router.use('/', postRouter);

router.use('/post', postRouter);
router.use('/user', userRouter);
router.use('/comment', commentRouter);










router.get('/', async (req, res) => {
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
        store = await dbAllAsync("SELECT * FROM store WHERE user_id=?;", [req.session.username]);
    }
    
    return res.status(200).render('index', { username: req.session.username, cnt: cnt['count(*)'], post:post, groupBy:groupBy, post_desc:post_desc, user:user, like:like, store: store});
})


router.get('/:postNo', (req, res) => {
    return res.send(`
        <script>
            localStorage.setItem("postNo", ${req.params.postNo});
            location.href = "/";
        </script>
    `);
});





module.exports = router;