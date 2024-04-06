
# :u5408: kanjithing
<div align="center">
    <a href="https://github.com/aiden2480/kanjithing/commits"><img src="https://img.shields.io/github/last-commit/aiden2480/kanjithing?color=red" title="GitHub commit history" /></a>
    <a href="https://chrome.google.com/webstore/detail/kanjithing/nccfelhkfpbnefflolffkclhenplhiab/reviews"><img src="https://img.shields.io/chrome-web-store/rating/nccfelhkfpbnefflolffkclhenplhiab?color=orange" title="Google chrome store rating" /></a>
    <a href="https://chrome.google.com/webstore/detail/kanjithing/nccfelhkfpbnefflolffkclhenplhiab"><img src="https://img.shields.io/chrome-web-store/v/nccfelhkfpbnefflolffkclhenplhiab?color=yellow" title="Last version published on chrome web store" /></a>
    <a href="https://github.com/aiden2480/kanjithing/actions/workflows/updatewebstore.yml"><img src="https://img.shields.io/github/actions/workflow/status/aiden2480/kanjithing/updatewebstore.yml?branch=main&label=Publish%20workflow&color=green" title="Webstore publish workflow status" /></a>
    <a href="https://github.com/aiden2480/kanjithing/blob/main/LICENCE"><img src="https://img.shields.io/github/license/aiden2480/kanjithing?color=blue" /></a>
    <a href="https://aiden2480.github.io/kanjithing/"><img src="https://img.shields.io/badge/GitHub%20Pages-active-af6eeb" /></a>
</div>

## :shrug: A google chrome extension for practising kanji
You can practise drawing kanji featured in the Wakatta units. It also has other useful information like character readings and example words. 
> [Install on the google chrome webstore](https://chrome.google.com/webstore/detail/kanjithing/nccfelhkfpbnefflolffkclhenplhiab)

## :gear: Installation
> The extension is available in the [google chrome store](https://chrome.google.com/webstore/detail/nccfelhkfpbnefflolffkclhenplhiab), though it can be installed from source with the following instructions

1. `git clone https://github.com/aiden2480/kanjithing`
2. Navigate to [`chrome://extensions`](chrome://extensions)
3. Ensure that the `Developer mode` switch is enabled in the top right of your screen
4. Click `Load unpacked` in the top left corner of the screen
5. Select the folder containing the extension in the popup modal

## :recycle: Update
Google chrome will automatically update the extension as I publish new updates if you install from the chrome store.
If installing from this repository, run `git pull origin main`, then go back to `chrome://extensions` and press the refresh icon next to the extension to reload.

I'm using a [custom GitHub action](.github/workflows/updatewebstore.yml) to automatically publish new versions of the extension to the chrome store every time I change the `version` parameter in the `manifest.json` file.

## :camera_flash: Program screenshots
<img src="https://lh3.googleusercontent.com/NuTuEgPEhh0LpGCkyzcpZvysRrbiI5Y7Wer7tKPLJx-O0HkLHaveUPUCabzpWn9s5daCH9Jt3dY-OjheGamEMeCL1A=s1600-w1600-h1000" />
<img src="https://lh3.googleusercontent.com/XFupiSqYq2YRvOoleYBKZpoZ15Ec2COgMR4oRejduc5XaK-NMbEK8hYBaWd4AA5_f8836Jhv0EXEMuhsKNXn1_-bHA=s1600-w1600-h1000" />
<img src="https://lh3.googleusercontent.com/zglUDkiGKA18ixPKbC0tSKLL2RJeyyoo6srT_i-ggDvysBHNigntwECpjzjjW5suLwdX4n8vkkFko8b3c6ymqdvB=s1600-w1600-h1000" />

## :memo: Future features
- [ ] Able to star/favourite kanji to add them quickly to a custom set.
- [ ] Make the user guess readings of kanji in words
- [ ] Flashcard thing where you get the meaning of the kanji and sample words and have to draw it
- [ ] Custom flashcards to remember kanji/words
    - Import from quizlet
- [ ] Show an extra sample word when the readings string doesn't cross over to the next line
    - Compress space between two lines if it crosses over
- [ ] Grade stroke order of drawing
    - [Available on GitHub](https://github.com/kanjialive/kanji-data-media/blob/master/kanji-animations/stroke_timings) with timestamps
- [ ] Grey loading screen should only appear after a certain amount of time to account for cached requests that resolve quickly
    - To prevent grey/white flashes that occur when the next character loads quickly
- [ ] Right click to remove drawing (all connected strokes)
- [ ] Add tooltip banner when extension updates
    - Potentially as a small subtext badge?
- [ ] Use static assets for the emojis to keep design consistent between operating systems
- [ ] Event listener on the popup script to determine when the set storage has changed
- [ ] Use data from the KanjiAlive API to do pronuncation/sounds
- [x] Make CSS for buttons/inputs be consistent throughout the popup/settings/index pages
- [ ] Fix overlap interaction with especially long word descriptions (同 kanji)
- [x] Use a RapidAPI key in the application to fetch data (Replit downtime)
- [ ] Display notice if character data not available
- [ ] https://github.com/gildas-lormeau/zip.js/tree/master/dist
- [ ] https://github.com/kanjialive/kanji-data-media/blob/master/kanji-animations/animations-mp4.zip
