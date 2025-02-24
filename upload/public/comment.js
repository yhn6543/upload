import { cntComment } from './window.js';
import { closeCommentModal } from './modal.js';

export function CLickCommentEmpathy(postNo, commentNo, e){
    if(e.className == "empathy-icon"){
        fetch(`/comments/empathy/${commentNo}`, {  method: "POST" })
        .then(checkStatus)
        .then(()=>{
            e.classList.toggle("empathizing");
            updateEmpathyCount(commentNo, 1);
        })
        .catch(err=>{
            console.log('empathy:', err);
        })
    }
    else{
        fetch(`/comments/empathy/${commentNo}`, {  method: "DELETE" })
        .then(checkStatus)
        .then(()=>{
            e.classList.toggle("empathizing");
            updateEmpathyCount(commentNo, -1);
        })
        .catch(err=>{
            console.log('empathy:', err);
        })
    }
}
window.CLickCommentEmpathy = CLickCommentEmpathy;




export function updateCommentModal(postNo, userId){
    const tempElement = document.createElement("div");
    tempElement.setAttribute("post-no", postNo);
    tempElement.setAttribute("user-id", userId);
    
    if(document.querySelector(".comment-modal-footer")){
        tempElement.setAttribute("aria-label", "댓글 달기");
        closeCommentModal();
        openCommentModalWithInput(tempElement);
    }
    else{
        closeCommentModal();
        openCommentModal(tempElement);
    }
}
window.updateCommentModal = updateCommentModal




function commentUpdate(postNo, commentNo){
    window.childWindow = window.open(`/comments-update?postNo=${postNo}&commentNo=${commentNo}`, "_blank", "width=700px, height=500px, top=50%, left=50%");
}
window.commentUpdate = commentUpdate;



function commentDelete(postNo, commentNo){
    fetch("/comments", {
        method: "DELETE",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ postNo: postNo, commentNo: commentNo })
    })
    .then(checkStatus)
    .then(()=>{
        cntComment(postNo, -1);
        updateCommentModal(postNo, window.userId);
    })
    .catch(err=>{
        console.log('delete comment:', err);
    })
}
window.commentDelete = commentDelete;



function openCommentMenu(x, y, commentNo, e){
    const commentMenu = document.getElementById("commentMenu-"+commentNo);

    commentMenu.classList.add("comment-menu-show")
    commentMenu.style.top = `${y}px`;
    commentMenu.style.left = `${x}px`;

    window.commentNo = commentNo;
}
window.openCommentMenu = openCommentMenu;



function updateEmpathyCount(commentNo, cnt){
    const target = document.querySelector(`[empathy-comment-no="${commentNo}"]`)
    target.innerHTML = Number(target.innerHTML)+cnt;
}




export function closeCommentMenu(){
    const commentMenu = document.getElementById("commentMenu-"+window.commentNo);
    if(commentMenu) commentMenu.classList.remove("comment-menu-show")
}
window.closeCommentMenu = closeCommentMenu;






export function clickImgToPage(){
    const commentUserProfile = document.querySelectorAll(".comment-user-profile");
    const userIdSpan = document.querySelectorAll(".user-id-span");
    commentUserProfile.forEach((each)=>{
        each.addEventListener("click", (e)=>{
            location.href = `/user-page/${each.id}`;
        })
    })
    userIdSpan.forEach((each)=>{
        each.addEventListener("click", (e)=>{
            location.href = `/user-page/${each.id}`;
        })
    })
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
window.checkStatus = checkStatus;