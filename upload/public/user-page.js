const countNo = document.querySelectorAll(".count-no");
countNo.forEach((no)=>{
    no.addEventListener("click", (e)=>{
        document.querySelector(`.list-modal.${e.target.id}`).style.bottom = "10%";
    })
})


function exit(element){
    const modal = document.querySelector(`.list-modal.${element.id}`);
    modal.style.bottom = "-100%";
}



function toPost(postNo){
    location.href = `/${postNo}`;
}




function delPost(element, postNo, userId){
    // console.log(element.parentNode.parentNode, postNo, userId);
    if(element.parentNode.parentNode.classList.contains("deleted")) alert("이미 삭제됨");

    fetch(`/posts`, {
        method: "DELETE",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ postNo: postNo, userId: userId })
    })
    .then(checkStatus)
    .then(()=>{
        console.log("삭제 완료")
        element.parentNode.parentNode.classList.add("deleted");
    })
    .catch(err=>{
        console.log('delete post:', err);
    })
}






function delComment(element, postNo, commentNo){
    // console.log(postNo, commentNo);
    if(element.parentNode.parentNode.classList.contains("deleted")) alert("이미 삭제됨");

    fetch("/comments", {
        method: "DELETE",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ postNo: postNo, commentNo: commentNo })
    })
    .then(checkStatus)
    .then(()=>{
        console.log("삭제 완료")
        element.parentNode.parentNode.classList.add("deleted");
    })
    .catch(err=>{
        console.log('delete comment:', err);
    })
}






function delLike(element, postNo){
    // console.log(postNo);
    if(element.parentNode.parentNode.classList.contains("deleted")) alert("이미 삭제됨");

    fetch('/post/like/' + postNo, {method:"DELETE"})
    .then(checkStatus)
    .then(()=>{
        console.log("삭제 완료")
        element.parentNode.parentNode.classList.add("deleted");
    })
    .catch(err=>{
        console.log('delete like:', err);
    })
}






function delEmpathy(element, commentNo){
    // console.log(commentNo);
    if(element.parentNode.parentNode.classList.contains("deleted")) alert("이미 삭제됨");

    fetch(`/comments/empathy/${commentNo}`, {  method: "DELETE" })
    .then(checkStatus)
    .then(()=>{
        console.log("삭제 완료")
        element.parentNode.parentNode.classList.add("deleted");
    })
    .catch(err=>{
        console.log('delete empathy:', err);
    })
}






function delStore(element, postNo){
    if(element.parentNode.parentNode.classList.contains("deleted")) alert("이미 삭제됨");

    fetch(`/post/store/${postNo}`, {  method: "DELETE" })
    .then(checkStatus)
    .then(()=>{
        console.log("삭제 완료")
        element.parentNode.parentNode.classList.add("deleted");
    })
    .catch(err=>{
        console.log('delete store:', err);
    })
}








const del = document.querySelectorAll(".delete");

del.forEach((d)=>{
    d.addEventListener("mouseover", (e)=>{
        const li = e.target.parentNode.parentNode;
        if(li.classList.contains("deleted")) return;
        
        li.classList.add("li-del");
    })
    d.addEventListener("mouseleave", (e)=>{
        const li = e.target.parentNode.parentNode;
        if(li.classList.contains("deleted")) return;
        
        li.classList.remove("li-del") ;
    })
})




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