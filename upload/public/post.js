import { createSpan } from './createElement.js';
import { loginErrorModal } from './modal.js';
//              글 삭제
function postDelete(element){
    const postNo = element.getAttribute("post-no");
    const userId = element.getAttribute("user-id");
    fetch(`/post`, {
        method: "DELETE",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ postNo: postNo, userId: userId })
    })
    .then(checkStatus)
    .then(()=>{
        location.reload();
    })
    .catch(err=>{
        console.log('delete post:', err);
    })
}
window.postDelete = postDelete;


//              글 수정 창 열기
function openPostUpdate(element, postNo){
    const postUpdateModal = document.querySelector(".post-update-modal");
    postUpdateModal.setAttribute("post-no", postNo);
    postUpdateModal.classList.add("post-update-modal-show");

    document.getElementById("update-text").textContent = (document.querySelector(`.description-text[post-no="${postNo}"]`)).textContent;
}
window.openPostUpdate = openPostUpdate;


//              글 수정
function postUpdate(element){
    const text = document.getElementById("update-text").value;
    const postNo = element.parentNode.parentNode.getAttribute("post-no");

    fetch('/post', {
        method: "PUT",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ postNo: postNo, text: text })
    })
    .then(checkStatus)
    .then(()=>{
        localStorage.setItem("postNo", postNo);
        location.reload();
    })
    .catch(err=>{
        console.log('update post:', err);
    })
}
window.postUpdate = postUpdate;



//              좋아요
function likeit(no, btn){
    if(!window.userId) return loginErrorModal()
    
    if(btn.classList.contains('likeit')){
        fetch('/post/like/' + no, {method: "DELETE"})
        .then(checkStatus)
        .then(()=>{
            const likeCnt = document.getElementById(`like-${no}`);
            likeCnt.textContent = Number(likeCnt.textContent)-1;
        })
        .catch(err=>{ console.log('like', err); })
    }
    else{
        fetch('/post/like/' + no, {method: "POST"})
        .then(checkStatus)
        .then(()=>{
            const likeCnt = document.getElementById(`like-${no}`);
            likeCnt.textContent = Number(likeCnt.textContent)+1;
        })
        .catch(err=>{ console.log('like', err); })
    }
    btn.classList.toggle('likeit');
}
window.likeit = likeit;

//              글 내용 "더 보기" 설정
const descText = document.querySelectorAll(`.description-text`);
descText.forEach((e)=>{
    if(e.scrollHeight != e.clientHeight){
        const span = createSpan({ className: "item-link-gray show-full-description", textContent: "더 보기", onclick: `showFullDescription(this)` });
        span.setAttribute("post-no", e.getAttribute("post-no"));

        e.parentNode.appendChild(span);
    }
})

//              글 내용 전체보기
function showFullDescription(element){
    const postNo = element.getAttribute("post-no");
    const target = document.querySelector(`.description-text[post-no="${postNo}"]`);

    element.classList.add("description-text-expand")
    target.classList.add("description-text-show");
}
window.showFullDescription = showFullDescription;

//              글 옵션 열기
function openPostOption(element){
    const postNo = element.getAttribute("post-no");
    const optionDiv = document.querySelector(`.post-option-div[post-no="${postNo}"]`);


    if(optionDiv.classList.contains("option-show")) return closePostOption();

    closePostOption();
    optionDiv.classList.add("option-show");
}
window.openPostOption = openPostOption;

//              글 옵션 닫기
export function closePostOption(){

    if(document.querySelector(".option-show")){
        document.querySelector(".option-show").classList.remove("option-show");
    }
}


//              글 공유
function postShare(postNo){
    if(!postNo) return alert("오류");
    navigator.clipboard.writeText("localhost/"+postNo);
    alert('주소 복사 완료');
}
window.postShare = postShare;



//              글 저장
function postStore(postNo){
    if(!window.userId) return loginErrorModal()
    console.log('store', postNo);
    const target = document.querySelector(".store-"+postNo);
    if(target.classList.contains("storeit")){
        console.log("삭제");
        fetch(`/post/store/${postNo}`, { method: 'DELETE' })
        .then(checkStatus)
        .then(()=>{
            target.classList.remove("storeit");
        })
        .catch(err=>{
            console.log('store post:', err);
        })
    }
    else{
        console.log("등록");
        fetch(`/post/store/${postNo}`, { method: 'POST' })
        .then(checkStatus)
        .then(()=>{
            target.classList.add("storeit");
        })
        .catch(err=>{
            console.log('store post:', err);
        })
    }
}
window.postStore = postStore;





const swiper = new Swiper('.swiper', {
    loop: true,
    pagination: {
        el: '.swiper-pagination',
    },
    navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
    },
});





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