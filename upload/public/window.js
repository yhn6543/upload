import { createLi } from './createElement.js';
import { closePostOption } from './post.js'



const userInfo = document.getElementById("user-info-div");
window.addEventListener("scroll", ()=>{
    setTimeout(()=>{
        userInfo.style.top = Number(document.documentElement.scrollTop)+120+"px"
    }, 300)
})




function login(){
    location.href = '/login';
}
window.login = login;




function logout(){
    fetch('/logout', {
        method: "POST",
        headers: {"Content-Type": "application/json"}
    })
    .then(checkStatus)
    .then(()=>{
        console.log("로그아웃 성공, 페이지 새로고침");
        location.reload();
    })
    .catch(err=>{
        console.log('logout:', err);
    })
}
window.logout = logout;





window.onload = function(){
    userInfo.style.top = Number(document.documentElement.scrollTop)+120+"px";

    if(localStorage.getItem("postNo")){
        const target = document.querySelector(`.item[post-no="${localStorage.getItem("postNo")}"]`);
        if(!target){
            localStorage.removeItem("postNo");
            return alert("없는 게시글입니다.");
        }
        scrollToPost(localStorage.getItem("postNo"));
        localStorage.removeItem("postNo");
    }
}




function scrollToPost(postNo){
    const target = document.querySelector(`.item[post-no="${postNo}"]`);
    
    target.scrollIntoView({ behavior: "smooth", block: "center" });
}
window.scrollToPost = scrollToPost;




function userProfile(element){
    location.href = `/user-page/${element.getAttribute("user-id")}`;
}
window.userProfile = userProfile;




const body = document.getElementById("body");
body.addEventListener("click", (e)=>{
    if(!(e.target.getAttribute("aria-label") == "옵션 더 보기") && document.querySelector(".option-show")){
        closePostOption();
    }
    else if(e.target.classList.contains("search")){
        setSerach(e);
    }
    setSearchUl();
})




const serach = document.querySelector(".search");
const searchUl = document.querySelector(".search-ul")
serach.addEventListener("input", (e)=>{
    setSerach(e);
})




function setSerach(e){
    fetch(`/search`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ search: e.target.value })
    })
    .then(checkStatus)
    .then((res)=>{
        setSearchUl(res);
    })
    .catch(err=>{
        console.log('search:', err);
    })
}




function setSearchUl(data){
    searchUl.innerHTML = "";
    if(!data)return;

    data = data.userList;
    data.forEach((each)=>{
        const li = createLi({ textContent: each.id, onclick: `toProfile("${each}")` });
        searchUl.appendChild(li);
    })
}




function toProfile(userId){
    location.href = `/user-page/${userId}`;
}
window.toProfile = toProfile;




window.onbeforeunload = function(){
    closeChildeWindow();
}


export function closeChildeWindow(){
    if(window.childWindow){
        window.childWindow.close();
        delete window.childWindow;
    }
}



export function cntComment(postNo, n){
    const target = document.querySelectorAll(`.item-comment.item-link-gray.open-modal[post-no="${postNo}"]`);

    if(target[0].childNodes[1].innerHTML == "댓글 없음"){                                                       // 댓글 없음: 추가
        target[0].childNodes[1].innerHTML = `댓글 <span id="comment-<%= post[cur].post_no %>">1</span>개 모두 보기`
    }
    else{                                                                                                       // 댓글 있음
        const no = target[0].childNodes[1].childNodes[1];
        if(Number(no.innerHTML) == 1 && n == -1){
            target[0].childNodes[1].innerHTML = "댓글 없음";
        }
        else{
            no.innerHTML = Number(no.innerHTML)+n;
        }
    }
}




function myPage(userId){
    setMyPage(userId);

    const myPage = document.getElementById("user-profile-page");
    const myPageText = document.getElementById("my-page-text");

    if(myPage.classList.contains("user-profile-page-show")){
        myPageText.textContent = "나의 글"
        myPage.classList.remove("user-profile-page-show");
    }
    else{
        myPageText.textContent = "닫기"
        myPage.classList.add("user-profile-page-show");
    }
}
window.myPage = myPage;





function setMyPage(userId){
    fetch(`/post-list/${userId}`, { method: "GET" })
    .then(checkStatus)
    .then((res)=>{
        const list = document.getElementById("page-my-post-list");
        list.innerHTML = "";
        res.forEach((data)=>{
            const li = createLi({ className: "post-list-li", textContent: data.description, onclick: `scrollToPost(${data.no})` });
            li.setAttribute("post-no", data.no);
            list.appendChild(li);
        })
    })
    .catch(err=>{
        console.log('set my page:', err)
    })
}





function openUserCommentList(element){
    const userId = element.getAttribute("user-id");
    const page = document.getElementById("user-post-list-page");

    if(page.classList.contains("user-post-list-page-show")){
        page.classList.remove("user-post-list-page-show");
        setUserCommentList(page, userId, 2700);
    }
    else{
        setUserCommentList(page, userId, 0);
    }
}
window.openUserCommentList = openUserCommentList;






function setUserCommentList(page, userId, timer){
    setTimeout(() => {
        fetch(`/post-list/${userId}`, { method: "GET" })
        .then(checkStatus)
        .then((res)=>{
            const id = document.querySelector(".page-user-id-text");
            id.textContent = userId;

            const list = document.getElementById("page-user-post-list");
            list.textContent = "";
            
            res.forEach((data)=>{
                const li = createLi({ className: "post-list-li" , textContent: data.description, onclick: `scrollToPost(${data.no})` })
                li.setAttribute("post-no", data.no)
                list.appendChild(li);
            })
        })
        .then(()=>{
            page.classList.add("user-post-list-page-show");
        })
        .catch(err=>{
            console.log('user comment list:', err);
        })
    }, timer);
}






async function checkStatus(res){
    console.log(res.status, res.ok);
    if(!res.ok) throw new Error(`Request failed with status: ${res.status}`);
    try{
        return await res.json();
    }
    catch{
        return true;
    }
}