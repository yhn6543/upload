export function createSpan({ className, id, textContent, onclick }){
    const spanDiv = document.createElement("span");

    if(className) spanDiv.className = className;
    if(id) spanDiv.id = id;
    if(textContent) spanDiv.textContent = textContent;
    if(onclick) spanDiv.setAttribute("onclick", onclick)

    return spanDiv;
}

export function createDiv({ id, className, textContent, onclick }){
    const divTag = document.createElement('div');

    if(className) divTag.className = className;
    if(id) divTag.id = id;
    if(textContent || textContent==0) divTag.textContent = textContent;
    if(onclick) divTag.setAttribute("onclick", onclick);

    return divTag;
}

export function createInput({ id, className, type, value, placeholder }){
    const inputTag = document.createElement('input');

    inputTag.type = type;
    if(className) inputTag.className = className;
    if(id) inputTag.id = id;
    if(placeholder) inputTag.placeholder = placeholder;
    if(value) inputTag.value = value;

    return inputTag;
}


export function createImg({ className, id, src }){
    const imgTag = document.createElement("img");

    if(className) imgTag.className = className;
    if(id) imgTag.id = id;
    if(src) imgTag.src = src;

    return imgTag;
}

export function createBtn({ className, textComment, onclick }){
    const btnTag = document.createElement("button");

    if(className) btnTag.className = className;
    if(textComment) btnTag.textContent = textComment;
    if(onclick) btnTag.setAttribute("onclick", onclick)

    return btnTag;
}

export function createUl({ className, id }){
    const ulTag = document.createElement("ul");

    if(className) ulTag.className = className;
    if(id) ulTag.id = id;

    return ulTag;
}

export function createLi({ className, id, textContent, onclick }){
    const liTag = document.createElement("li");

    if(className) liTag.className = className;
    if(id) liTag.id = id;
    if(textContent) liTag.textContent = textContent;
    if(onclick) liTag.setAttribute("onclick", onclick);

    return liTag
}