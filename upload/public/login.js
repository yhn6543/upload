function login(){
    location.href = '/login';
}




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






async function checkStatus(res){
    console.log(res.status, res.ok);
    if(!res.ok) throw new Error(`Request failed with status: ${res.status}`);
    try{
        return await res.json();
    }
    catch{
        console.log("checkStatus - true")
        return true;
    }
}