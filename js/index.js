// (async () => {
//     var resp = await fetch("https://api.github.com/repos/aiden2480/kanjithing/releases");
//     var data = await resp.json();
    
//     data.forEach((element, index) => {
//         console.log(index, element.zipball_url);
//     });
//     console.log(data);
// })();

// Display extension install button if needed
chrome.extension || document.getElementById("installbutton").classList.add("available");
chrome.extension || document.getElementById("installbutton").addEventListener("click", () => {
    window.open("https://chrome.google.com/webstore/detail/kanjithing/nccfelhkfpbnefflolffkclhenplhiab/");
});
