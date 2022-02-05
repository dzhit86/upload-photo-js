const browserButton = document.querySelector(".section__postAnAdUpload-browse");
const uploadButton = document.querySelector(".section__postAnAdUpload-upload");
const galleryField = document.querySelector(".section__postAnAdUpload-gallery");
const inputField = document.querySelector("#browseImage");
const actionField = document.querySelector(".section__postAnAdUpload-action");
const fileNameField = document.querySelector(".section__postAnAdUpload-browserName");

let file = [];

browserButton.addEventListener("click", browserImage);
uploadButton.addEventListener("click", uploadImage);
inputField.addEventListener("change", changeHandler);
galleryField.addEventListener("click", imageHandler);

function browserImage () {
    inputField.click();
}

function changeHandler (event) {    
    if (!event.target.files.length) {
      return;
    }
    file = Array.from(event.target.files)[0];
    if (!file.type.match("image")) {
        return; 
    }
    changeStateButtons(false);
    const reader = new FileReader();
    
    reader.onload = (event) => {
        document.querySelector(".section__postAnAdUpload-action_preview").innerHTML = `
        <div class="section__postAnAdUpload-gallery-item _preview" id="" data-img-position="" data-img-name="${file.name}">
            <img src="${event.target.result}" alt="${file.name}">
        </div>
        `;
      }
      inputField.value = "";
      reader.readAsDataURL(file);
      fileNameField.innerText = file.name;
}

function imageHandler (event) {
    if (event.target.classList.contains("section__postAnAdUpload-gallery-action_remove")) {
        removePreviewImage(event)
    }
    if (event.target.classList.contains("_change_position")) {
        changePosition(event)
    }
}

function removePreviewImage (element) {
    if (element.target && element.target.hasAttribute("data-img-id")) {
        const id = element.target.getAttribute("data-img-id");
        const name = document.getElementById(id).getAttribute("data-img-name");
        const formData = new FormData();
        const headers = new Headers();
        headers.append('X-CSRFToken', csrf);
        formData.append("delete", id);        
        sendPhoto(deleteImageHandler, headers, formData)
        .then( data => {
            if (!data.error) {
                galleryField.innerHTML = "";
                for (let index = 0; index < data.length; index++) {
                    let min = data[0].position
                    let max = data[data.length-1].position;
                    const element = data[index];
                    if (data.length) {insertImage(element, min, max)}
                    else {insertImage(element, min)};
                }
            } else {
                alert(data.error);
            }
        });
        
    }
    if (element.classList && element.classList.contains("_preview")) {
        element.remove();
    }
    file = [];
    inputField.value = "";
    changeStateButtons();
}

function uploadImage () {
    const formData = new FormData();
    const headers = new Headers();
    headers.append('X-CSRFToken', csrf);
    formData.append("image", file);
    
    sendPhoto(uploadImageHandler, headers, formData)
    .then(data => {        
        if (!data.error) {
            data.sort(comparePositions);
            removePreviewImage(document.querySelector(`[data-img-name="${file.name}"]`));
            changeStateButtons();
            galleryField.innerHTML = "";
            fileNameField.innerText = "";
            for (let index = 0; index < data.length; index++) {
                let min = data[0].position
                let max = data[data.length-1].position;
                const element = data[index];
                if (data.length) {insertImage(element, min, max)}
                else {insertImage(element, min)};
            } 
        } else {
            alert(data.error + " Please refresh the page");
        }        
    });
}

function changeStateButtons (state = true) {
    if (state) {
        // browserButton.removeAttribute("disabled");
        // inputField.removeAttribute("disabled");
        uploadButton.style.display = "none";
        uploadButton.setAttribute("disabled", true);
    } else {
        // browserButton.setAttribute("disabled", true);
        // inputField.setAttribute("disabled", true);
        uploadButton.style.display = "inline-flex";
        uploadButton.removeAttribute("disabled");
    }
}

function insertImage (data, min, max=0 ) {       
    let up = "";
    let down = "";
    let state = "";
    if (data.is_verified !== "False") {
        state = `<span class="_verify">Photo is verified</span>`;
    } else {
        state = `<span class="_unverify">Photo is not verified</span><a href="#rulesBlock">(Why?)</a>`;
    }

    if (data.position > min) {
        up = `<button class="_change_position section__postAnAdUpload-gallery-action_btn section__postAnAdUpload-gallery-action_up">Up</button>`;
    }
    if (data.position < max) {
        down = `<button class="_change_position section__postAnAdUpload-gallery-action_btn section__postAnAdUpload-gallery-action_down">Down</button>`;
    }
    document.querySelector(".section__postAnAdUpload-gallery").insertAdjacentHTML('beforeend', `
    <div class="section__postAnAdUpload-gallery-item" id="${data.id}" data-img-position="${data.position}" data-img-name="${data.name}">
      <img src="${data.url}" alt="${data.name}">
      <div class="section__postAnAdUpload-gallery-action">
          ${up}
          ${down}
          <button class="section__postAnAdUpload-gallery-action_btn section__postAnAdUpload-gallery-action_remove" data-img-id="${data.id}">Delete</button>
      </div>
      <div class="section__postAnAdUpload-gallery-state">${state}</div>
    </div>
    `);
}

function changePosition(event) {
    const currentId = event.target.closest(".section__postAnAdUpload-gallery-item").id;
    const currentPosition = document.getElementById(currentId).getAttribute("data-img-position");

    const allItems = document.querySelectorAll(".section__postAnAdUpload-gallery-item");
    let sortedAllItems = [];

    for (let index = 0; index < allItems.length; index++) {
        const element = allItems[index];
        sortedAllItems[index] = element.getAttribute("data-img-position");
    }
    sortedAllItems.sort(function(a, b) {
        return a - b;
    });
    const maxPosition = allItems[allItems.length - 1].getAttribute("data-img-position");
    const minPosition = sortedAllItems[0];

    let anotherPosition = "";
    let anotherId = false;

    if (event.target.classList.contains("section__postAnAdUpload-gallery-action_up")) {        
        anotherPosition = +currentPosition - 1;
        while (!anotherId) {            
            if (galleryField.querySelector(`[data-img-position="${anotherPosition}"]`)) {
                anotherId = galleryField.querySelector(`[data-img-position="${anotherPosition}"]`).id;
                break;
            } else {
                anotherPosition--;
            }
        }
    }
    if (event.target.classList.contains("section__postAnAdUpload-gallery-action_down")) {
        anotherPosition = +currentPosition + 1;
        while (!anotherId) {
            if (galleryField.querySelector(`[data-img-position="${anotherPosition}"]`)) {
                anotherId = galleryField.querySelector(`[data-img-position="${anotherPosition}"]`).id;
                break;
            } else {
                anotherPosition++;
            } 
        }
    }
    const formData = new FormData();
    const headers = new Headers();
    headers.append('X-CSRFToken', csrf);
    formData.append("current_photo_id", currentId);  
    formData.append("another_photo_id", anotherId);  
    sendPhoto(changePositionImageHandler, headers, formData)
    .then(data => {
        if (data.success === "true") {
            let currentEl = document.getElementById(currentId);
            let anothertEl = document.getElementById(anotherId);

            let temp = currentEl.outerHTML;
            let tempCurPosition = currentEl.getAttribute("data-img-position");
            let tempAnothPosition = anothertEl.getAttribute("data-img-position");

            currentEl.outerHTML = anothertEl.outerHTML;            
            anothertEl.outerHTML = temp;

            let newCurrentEl = document.getElementById(currentId);
            let newAnotherEl = document.getElementById(anotherId);
            newCurrentEl.setAttribute("data-img-position", tempAnothPosition);
            newAnotherEl.setAttribute("data-img-position", tempCurPosition);

            const countItems = galleryField.querySelectorAll(".section__postAnAdUpload-gallery-item").length;

            if (newCurrentEl.querySelector(".section__postAnAdUpload-gallery-action_up")) newCurrentEl.querySelector(".section__postAnAdUpload-gallery-action_up").remove();
            if (newCurrentEl.querySelector(".section__postAnAdUpload-gallery-action_down")) newCurrentEl.querySelector(".section__postAnAdUpload-gallery-action_down").remove();
            if (newAnotherEl.querySelector(".section__postAnAdUpload-gallery-action_up")) newAnotherEl.querySelector(".section__postAnAdUpload-gallery-action_up").remove();
            if (newAnotherEl.querySelector(".section__postAnAdUpload-gallery-action_down")) newAnotherEl.querySelector(".section__postAnAdUpload-gallery-action_down").remove();
            let upCur = "";
            let downCur = "";
            let upAnoth = "";
            let downAnoth = "";

            if (newCurrentEl.getAttribute("data-img-position") > minPosition) {
                upCur = `<button class="_change_position section__postAnAdUpload-gallery-action_btn section__postAnAdUpload-gallery-action_up">Up</button>`;
            }
            if (newCurrentEl.getAttribute("data-img-position") < maxPosition) {
                downCur = `<button class="_change_position section__postAnAdUpload-gallery-action_btn section__postAnAdUpload-gallery-action_down">Down</button>`;
            }
            if (newAnotherEl.getAttribute("data-img-position") > minPosition) {
                upAnoth = `<button class="_change_position section__postAnAdUpload-gallery-action_btn section__postAnAdUpload-gallery-action_up">Up</button>`;
            }
            if (newAnotherEl.getAttribute("data-img-position") < maxPosition) {
                downAnoth = `<button class="_change_position section__postAnAdUpload-gallery-action_btn section__postAnAdUpload-gallery-action_down">Down</button>`;
            }
            newCurrentEl.querySelector(".section__postAnAdUpload-gallery-action").insertAdjacentHTML('afterBegin', `${downCur}`);
            newCurrentEl.querySelector(".section__postAnAdUpload-gallery-action").insertAdjacentHTML('afterBegin', `${upCur}`);
            newAnotherEl.querySelector(".section__postAnAdUpload-gallery-action").insertAdjacentHTML('afterBegin', `${downAnoth}`);
            newAnotherEl.querySelector(".section__postAnAdUpload-gallery-action").insertAdjacentHTML('afterBegin', `${upAnoth}`);
        } else {
            alert(data.error);
        }
    });
}

async function sendPhoto(url = '', headers, data) {
    const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: data,
    });
    return await response.json();
}

function selectFirstPoto(element) {
    element.style.background = "#D8FDD2";
    const mark = `<span class="section__postAnAdUpload-gallery-mark">`;
    element.insertAdjacentHTML("afterBegin", mark);
}

function comparePositions(a, b) { 
    let comparison = 0;
    if (a.position > b.position) {
      comparison = 1;
    } else if (a.position < b.position) {
      comparison = -1;
    }
    return comparison;
  }