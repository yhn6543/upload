import { createDiv, createSpan, createBtn, createUl, createLi, createInput, createImg } from './createElement.js';
import { closeCommentMenu, updateCommentModal, clickImgToPage } from './comment.js';
import { cntComment, closeChildeWindow } from './window.js';

const openModal = document.querySelectorAll(".open-modal");
openModal.forEach((openComment)=>{
    openComment.addEventListener("click", ()=>{
        openCommentModal(openComment);
    })
})




const closeModal = document.querySelectorAll(".modal-background");
closeModal.forEach((closeComment)=>{
    closeComment.addEventListener("click", ()=>{
        closeCommentModal(closeComment);
    })
})






function exit(element){
    if(element.id == "user-post-list-exit"){
        element.parentNode.classList.remove("user-post-list-page-show");
    }
    else if(element.id == "post-update-modal-exit"){
        element.parentNode.parentNode.classList.remove("post-update-modal-show");
    }
}
window.exit = exit;




async function openCommentModal(sourceElement){
    const res = await appendCommentToModal(sourceElement);

    document.getElementById("comment-modal-body").classList.add("comment-modal-body-show");
}
window.openCommentModal = openCommentModal;




async function openCommentModalWithInput(sourceElement){
    if(!sourceElement.getAttribute("user-id") && sourceElement.getAttribute("aria-label")){
        alert('로그인이 필요합니다.');
        return location.href='/login';
    }
    const res = await appendCommentToModal(sourceElement);
    
    document.getElementById("comment-modal-body").classList.add("comment-modal-body-show-with-input");
    openWriteComment(sourceElement.getAttribute("post-no"), sourceElement.getAttribute("user-id"));
}
window.openCommentModalWithInput = openCommentModalWithInput;




async function appendCommentToModal(sourceElement){
    const postNo = sourceElement.getAttribute("post-no");
    
    document.getElementById("modal-overlay").classList.add("modal-overlay-show");
    document.getElementById("body").classList.add("scroll-lock");
    
    const comments = await initComment(postNo);        // 댓글 창에 표시할 댓글들 세팅

    clickImgToPage();
}









function openWriteComment(postNo, userId){      // 댓글 입력창 생성
    const commentModalFooter = createDiv({ className: "comment-modal-footer" });
    const commentInputDiv = createDiv({ className: "comment-input-div" });

    const hiddenPostNO = createInput({ type: "hidden", id: "post-no", value: postNo });
    const hiddenUserId = createInput({ type: "hidden", id: "user-id", value: userId });
    const textComment = createInput({ type: 'text', id: 'comment', className: 'comment-input', placeholder: "댓글 입력" });

    const commentInputBtn = createBtn({ className: "comment-input-btn", textComment: "입력", onclick: `uploadComment(${postNo})` });

    commentInputDiv.append(textComment, commentInputBtn);
    commentModalFooter.appendChild(commentInputDiv);
    modalContent.appendChild(commentModalFooter);
}



function uploadComment(postNo){
    const comment = document.getElementById("comment").value;
    document.getElementById("comment").value = "";

    fetch('/comments', {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({postNo: postNo, userId: window.userId, comment: comment})
    })
    .then(checkStatus)
    .then(()=>{
        cntComment(postNo, 1);
        updateCommentModal(postNo, window.userId);
    })
    .catch(err=>{
        console.log('upload comment:', err);
    })
}
window.uploadComment = uploadComment;




//              댓글 창 위 빈 화면 클릭 시 닫기
export function closeCommentModal(closeComment){

    document.getElementById("modal-overlay").classList.remove("modal-overlay-show");
    document.getElementById("body").classList.remove("scroll-lock");
    if(window.childWindow) closeChildeWindow();
    clearModalContent();
}




function initComment(postNo){             // 댓글 창에 댓글들 표시
    return fetch(`/comments/${postNo}`, { method: 'GET' })
    .then(checkStatus)
    .then((res)=>{
        const commentModalBody = createDiv({ className: "comment-modal-body", id: "comment-modal-body" });

        if(res.commentData.length > 0){        // 댓글이 있을 때 표시할 내용
            const commentUl = createUl({ id:"comment-field" });

            res.commentData.forEach((eachData)=>{
                const commentLi = createCommentLi(eachData, res.commentEmpathyList.find(e=>e.comment_no == eachData.comment_no));
                commentUl.appendChild(commentLi);
            })

            commentModalBody.appendChild(commentUl);
            modalContent.appendChild(commentModalBody);
        }
        else{       // 댓글이 없을 경우 표시할 내용
            const noComment = createSpan({ id: "no-comment", textContent: "댓글 없음" });

            commentModalBody.appendChild(noComment);
            modalContent.appendChild(commentModalBody);

            return [];
        }
        
    });
}




function clearModalContent(){
    modalContent.innerHTML = `<div class="comment-modal-header">
                                    <hr class="hr1">
                                    <div class="comment-header">댓글</div>
                                    <hr class="hr2">
                                </div>`;
}











const modalContent = document.getElementById("modal-content");
modalContent.addEventListener("click", (e)=>{                                                                   // 댓글 모달 클릭 이벤트
    closeCommentMenu();
    if(e.target.getAttribute("user-id") == window.userId && e.target.className == "text-span"){             // 댓글 텍스트 구역 클릭 > 메뉴 오픈
        const x = e.clientX;
        const y = e.clientY;

        return openCommentMenu(x, y, e.target.getAttribute("comment-no"), e);
    }
    else if(e.target.className.includes("empathy-icon")){                                                       // 댓글 공감 클릭
        if(!window.userId) loginErrorModal();
        else CLickCommentEmpathy(e.target.getAttribute("post-no"), e.target.getAttribute("comment-no"), e.target);
    }
})





function createCommentLi(data, commentEmpathy){
    const commentLi = createLi({ className: "comment-li" });
    if(window.userId == data.user_id) commentLi.classList.add("my-comment");
    
    appendProfileToCommentLi(commentLi, data);
    appendContentToCommentLi(commentLi, data, commentEmpathy);
    
    
    appendMenuDiv(commentLi, data);

    return commentLi;
}




function appendProfileToCommentLi(commentLi, data){
    const profileDiv = createDiv({ className: "profile-div" });
    const profileImg = createImg({ className: "comment-user-profile", id: `${data.user_id}`, src: data.profile });

    profileDiv.appendChild(profileImg);
    commentLi.appendChild(profileDiv);
}




function appendContentToCommentLi(commentLi, data, commentEmpathy){
    const contentDiv = createDiv({ className: "content-div" });
    
    const userIdDiv = createDiv({ className: "user-id-div" });
    const textDiv = createDiv({ className: "text-div" });
    const textActionDiv = createDiv({ className: "text-action-div" });

    const userIdSpan = createSpan({ className: "user-id-span",id: `${data.user_id}`, textContent: data.user_id });
    const textSpan = createSpan({ className: "text-span", id: "commentNo-"+data.comment_no, textContent: data.text });
    textSpan.setAttribute("user-id", data.user_id);
    textSpan.setAttribute("comment-no", data.comment_no);
    textSpan.setAttribute("post-no", data.post_no);
    
    
    userIdDiv.appendChild(userIdSpan);
    textDiv.appendChild(textSpan);

    contentDiv.append(userIdDiv, textDiv, textActionDiv);
    commentLi.appendChild(contentDiv);

    createTextActionSpan(textActionDiv, data, commentEmpathy);
}




function createTextActionSpan(textActionDiv, data, commentEmpathy){
    const textActionSpan = createSpan({ className: "text-action-span", id: "commentNo-"+data.comment_no });
    textActionSpan.setAttribute("comment-no", data.comment_no);

    appendEmpathyIcon(textActionSpan, data, commentEmpathy);
    appendEmpathyCount(textActionSpan, data)

    textActionDiv.appendChild(textActionSpan);
}




function appendEmpathyIcon(textActionSpan, data, commentEmpathy){
    const empathySpan = createSpan({ className: "empathy-icon"});
    empathySpan.setAttribute("post-no", data.post_no);
    empathySpan.setAttribute("comment-no", data.comment_no);
    if(commentEmpathy) empathySpan.classList.toggle("empathizing");
    
    const svgNS = "http://www.w3.org/2000/svg";

    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("post-no", data.post_no);
    svg.setAttribute("comment-no", data.comment_no);
    svg.setAttribute("enable-background", "new 0 0 24 24");
    svg.setAttribute("height", "100%");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("width", "100%");
    svg.setAttribute("focusable", "false");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("style", "pointer-events: none; display: inherit;");

    const path = document.createElementNS(svgNS, "path");
    path.setAttribute("d", "M18.77,11h-4.23l1.52-4.94C16.38,5.03,15.54,4,14.38,4c-0.58,0-1.14,0.24-1.52,0.65L7,11H3v10h4h1h9.43c1.06,0,1.98-0.67,2.19-1.61l1.34-6C21.23,12.15,20.18,11,18.77,11z M7,20H4v-8h3V20z M19.98,13.17l-1.34,6C18.54,19.65,18.03,20,17.43,20H8v-8.61l5.6-6.06C13.79,5.12,14.08,5,14.38,5c0.26,0,0.5,0.11,0.63,0.3 c0.07,0.1,0.15,0.26,0.09,0.47l-1.52,4.94L13.18,12h1.35h4.23c0.41,0,0.8,0.17,1.03,0.46C19.92,12.61,20.05,12.86,19.98,13.17z");

    svg.appendChild(path);

    empathySpan.appendChild(svg);

    textActionSpan.appendChild(empathySpan);
}




function appendEmpathyCount(textActionSpan, data){
    const empathyCountDiv = createDiv({ className: "empathy-count-div", textContent: data.empathy });
    empathyCountDiv.setAttribute("post-no", data.post_no);
    empathyCountDiv.setAttribute("empathy-comment-no", data.comment_no);

    textActionSpan.appendChild(empathyCountDiv);
}




function appendMenuDiv(commentLi, data){
    const menuDiv = createDiv({ className: "comment-menu", id: "commentMenu-"+data.comment_no });
    
    const menuItemUpdate = createDiv({ className: "comment-menu-item comment-update", id: data.comment_no, textContent: "수정", onclick: `commentUpdate(${data.post_no}, ${data.comment_no})` });
    const menuItemDelete = createDiv({ className: "comment-menu-item comment-delete", id: data.comment_no, textContent: "삭제", onclick: `commentDelete(${data.post_no}, ${data.comment_no})` });

    menuDiv.append(menuItemUpdate, menuItemDelete);
    commentLi.appendChild(menuDiv);
}




export function loginErrorModal(){
    const errorModal = document.getElementById("error-modal");
    
    errorModal.classList.add("error-modal-show");
    setTimeout(() => {
        errorModal.classList.remove("error-modal-show");
    }, 800);
}




//              fetch 응답 확인
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