// const videoURL =
//     "https://www.youtube.com/embed/hXD8itTKdY0?autoplay=1&amp;mute=1&amp;loop=1&amp;controls=0";

// document.querySelectorAll(".video").forEach((iframe) => {
//     iframe.setAttribute("src", videoURL);
// });

// const words = [
//     "Explore",
//     "Unravel",
//     "Journey",
//     "Beyond",
//     "Glimpse",
//     "Infinite",
//     "Unseen",
//     "Awaken",
//     "Unknown",
//     "Seek",
//     "Curiosity",
//     "Voyage"
// ];

// let currentIndex = 0;
// const wordElement = document.getElementById("word");

// function changeWord() {
//     // wordElement.style.opacity = "0";

//     setTimeout(() => {
//         wordElement.textContent = words[currentIndex];
//         wordElement.style.opacity = "1";

//         currentIndex = (currentIndex + 1) % words.length;
//     }, 1000);
// }

// setInterval(changeWord, 5000);

// const contentDiv = document.querySelector(".content");

// // function adjustContentSize() {
// //     const viewportWidth = window.innerWidth;

// //     const baseWidth = 1300;
// //     const scaleFactor =
// //         viewportWidth < baseWidth ? (viewportWidth / baseWidth) * 0.8 : 1;

// //     contentDiv.style.transform = `scale(${scaleFactor})`;
// // }

// // window.addEventListener("load", adjustContentSize);

// // window.addEventListener("resize", adjustContentSize);

// const backgroundImage = document.querySelector(".backgroundImage");
// const reflects = document.querySelector(".reflects");

// function fadeOutReflects() {
//     reflects.classList.add("fade-out-long");
// }

// setTimeout(fadeOutBackground, 13000);

// setTimeout(fadeOutReflects, 45000);

// const box = document.querySelector(".box");

// function resetTransform() {
//     box.classList.add("no-transform");
// }

// function applyInitialTransform() {
//     box.classList.remove("no-transform");
// }

// setTimeout(resetTransform, 60000);
