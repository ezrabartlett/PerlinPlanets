const baseURL = `https://young-lake-21798.herokuapp.com/`;

const Http = new XMLHttpRequest();

const doCurl = async (action) => {
    Http.open("GET", baseURL+action);
    Http.setRequestHeader('Access-Control-Allow-Headers', '*');
    Http.setRequestHeader('Content-type', 'siteAnalytics');
    Http.setRequestHeader('Access-Control-Allow-Methods','GET,PUT,POST,DELETE,PATCH,OPTIONS');
    Http.setRequestHeader('Access-Control-Allow-Origin', '*');
    Http.send();
}

doCurl('logVisit');

const logSiteVisit = function () {
    doCurl('logVisit');
}

const logSystemGeneration = function (coordinates) {
    doCurl(`systemGenerated/${coordinates}`);
}

const logResumeDownload = function () {
    doCurl(`resumeDownloaded`);
}