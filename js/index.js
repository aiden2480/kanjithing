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

// Helper function to transform date to human readable time
function howLongAgo(datestamp) {
    var delta = (new Date() - new Date(datestamp)) / 1000;
    const plural = (s) => s !== 1 ? "s" : "";
    let value;
    
    var minute = 60;
    var hour = 60 * minute;
    var day = 24 * hour;
    var month = 30 * day;
    var year = 12 * month;

    if (delta / year >= 1)
        return (value = Math.round(delta / year)) + ` year${plural(value)} ago`;
    if (delta / month >= 1)
        return (value = Math.round(delta / month)) + ` month${plural(value)} ago`;
    if (delta / day >= 1)
        return (value = Math.round(delta / day)) + ` day${plural(value)} ago`;
    if (delta / hour >= 1)
        return (value = Math.round(delta / hour)) + ` hour${plural(value)} ago`;
    if (delta / minute >= 1)
        return (value = Math.round(delta / minute)) + ` minute${plural(value)} ago`;
    
    delta = Math.round(delta);
    return `${delta} second${plural(delta)} ago`
}
