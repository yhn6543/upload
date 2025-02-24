const userInfo = document.getElementById("user-info-div");
window.addEventListener("scroll", ()=>{
    setTimeout(()=>{
        userInfo.style.top = Number(document.documentElement.scrollTop)+120+"px"
    }, 300)
})