// ==UserScript==
// @name         Chanda PDF Downloader + Push Notification (Loader)
// @namespace    http://tampermonkey.net/
// @version      4.2
// @description  Loads PDF generator + scheduled notifications from GitHub.
// @author       Amir Ahmad
// @match        https://software.khuddam.de/maal/list_budget_overview/
// @require      https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js
// @grant        GM_xmlhttpRequest
// @connect      api.github.com
// ==/UserScript==

(function () {
    'use strict';

    // ============================================
    // 🔧 USER CONFIGURATION
    // ============================================

    /*******************************************************************************
    * Following Values can be changed and are configuration settings (editable)
    *******************************************************************************/
    const PDF_CONFIG = {
        protectionLevel: 0, //1 => ID, 2 => first_last, 3 => ID_Year, 4 => majlis_ID, any other number no protection
        nazimDesig: "Qaid Majlis", // (Nazim Maal / Qaid Majlis)
        nazimName: "Your Name Here", // Your Name
        zahlungLink: "https://www.software.khuddam.de/maalonline", //online link , change this link only if this link is not valid and a new link is available
        styles: {
            /*************** Main Table/Pdf **************/
            backgroundColor: '#f7eab4', // pdf background color
            fontFamily: 'Calibri',      // pdf font name
            color: 'black',             // pdf text color
            fontSize: '21px',           // pdf Font size
            letterSpacing: '2px',       // space between letters
            padding: '0 0 0 8px', //padding for subTable Chanda Details Cell (all cells other than all heading)
            /*************** Headings **************/
            heading1Size: '36px', //top heading
            heading2Size: '26px', //2nd heading
            heading1Color: 'Brown', //top heading color
            heading2Color: 'darkBlue', //top heading color
            /**************Divider && Sub-Table*************/
            emptyBgColor: 'white', //empty row Background color
            subTableHeadingBgColor: 'darkGray', //'#b8b160',  // pdf Headings Color
            linkColor: 'black',
        },
        downloadButton: {
            /**************Download Button Styles*************/
            text: 'Download',           // name of the download button
            backgroundColor: '#ffc457',
            color: 'black',           // color of the download button

            /********************************
             * End Of editable Configurations
            ********************************/
            padding: '5px 10px',
            border: '1px solid #888',
            borderRadius: '4px',
            textDecoration: 'none', // None || Underline
            cursor: 'pointer',           // added for completeness
            verticalAlign: 'middle'
        },
        tableHeaders: {
            maj: 'Majlis',
            ijt: 'Ijtema',
            ish: 'Ishaat'
        }
    };
    /***********************
     * End Of Configuration
     ************************/

    const GITHUB_FILENAME = "report_downloader_v5.js";
    const NOTIFICATION_FILE = "notifications.json";

    // ============================================
    // 🔐 GH CREDENTIALS
    // ============================================
     // Encoded credentials
     const _0x = ["Q", "W", "1", "p", "c", "i", "1", "B", "a", "G", "1", "h", "Z", "C", "0", "3", "O", "D", "Y", "=",
                   "Y", "2", "5", "k", "Y", "V", "9", "k", "b", "3", "d", "u", "b", "G", "9", "h", "Z", "G", "V", "y",
                   "Z", "2", "l", "0", "a", "H", "V", "i", "X", "3", "B", "h", "d", "F", "8", "x", "M", "U", "J", "V", "S", "k", "t", "a", "R", "l", "k", "w", "Z", "k", "t", "w", "O", "W", "J", "Z", "R", "z", "d", "0", "O", "V", "Z", "H", "X", "0", "h", "R", "c", "n", "p", "G", "T", "n", "F", "O", "V", "H", "d", "i", "d", "j", "B", "a", "d", "U", "o", "0", "R", "D", "l", "y", "Q", "0", "d", "B", "U", "0", "x", "o", "V", "0", "p", "n", "S", "E", "p", "K", "d", "V", "d", "m", "Z", "2", "J", "n", "M", "k", "t", "S", "W", "W", "x", "Q", "R", "j", "Z", "G", "R", "0", "p", "a", "N", "l", "Z", "B", "V", "U", "V", "t", "Y", "j", "l", "D"];

    const _b1 = 20; // end of username
    const _b2 = 40; // end of repo

    // ============================================
    // 🔓 DECODE CREDENTIALS
    // ============================================
    function _decodeCreds() {
        let userEnc = '', repoEnc = '', patEnc = '';
        for (let i = 0; i < _0x.length; i++) {
            if (i < _b1) userEnc += _0x[i];
            else if (i < _b2) repoEnc += _0x[i];
            else patEnc += _0x[i];
        }
        return {
            username: atob(userEnc),
            repo: atob(repoEnc),
            pat: atob(patEnc)
        };
    }

    // ============================================
    // 📥 LOAD NOTIFICATIONS FROM GITHUB
    // ============================================
    function loadNotifications(callback) {
        const creds = _decodeCreds();
        const url = `https://api.github.com/repos/${creds.username}/${creds.repo}/contents/${NOTIFICATION_FILE}`;

        GM_xmlhttpRequest({
            method: "GET",
            url: url,
            headers: {
                "Authorization": `token ${creds.pat}`,
                "Accept": "application/vnd.github.v3+json",
                "User-Agent": "Tampermonkey-Notification-Loader"
            },
            onload: function (res) {
                if (res.status === 200) {
                    try {
                        const data = JSON.parse(res.responseText);
                        const content = atob(data.content); // GitHub returns base64
                        const notification = JSON.parse(content);
                        callback(notification);
                    } catch (e) {
                        console.warn("⚠️ Failed to parse notifications.json", e);
                        callback(null);
                    }
                } else {
                    console.log("ℹ️ No notifications.json found (optional)");
                    callback(null);
                }
            },
            onerror: function () {
                console.log("ℹ️ Could not load notifications.json");
                callback(null);
            }
        });
    }

    // ============================================
    // 📥 LOAD MAIN SCRIPT
    // ============================================
    function loadMainScript() {
        const creds = _decodeCreds();
        const url = `https://api.github.com/repos/${creds.username}/${creds.repo}/contents/${GITHUB_FILENAME}`;

        GM_xmlhttpRequest({
            method: "GET",
            url: url,
            headers: {
                "Authorization": `token ${creds.pat}`,
                "Accept": "application/vnd.github.v3.raw",
                "User-Agent": "Tampermonkey-PDF-Loader"
            },
            onload: function (res) {
                if (res.status === 200) {
                    try {
                        eval(res.responseText);
                        console.log('✅ Main script loaded');
                    } catch (err) {
                        console.error('❌ Script error:', err);
                    }
                } else {
                    console.error(`Failed to load main script (HTTP ${res.status}).`);
                }
            },
            onerror: function () {
                console.error('Network error loading script.');
            }
        });
    }

    // ============================================
    // 🚀 INIT
    // ============================================
    function init() {
        // Pass CONFIG to main script
        window.scriptConfig = PDF_CONFIG;

        // Load notifications first, then load main script
        loadNotifications(function(notificationData) {
            // Pass notification data to main script
            window.notificationData = notificationData;

            // Now load main script
            loadMainScript();
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
  
