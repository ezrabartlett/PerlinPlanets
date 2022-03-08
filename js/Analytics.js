const baseURL = `https://young-lake-21798.herokuapp.com/`;

const Http = new XMLHttpRequest();

const doCurl = async (action) => {
    Http.open("GET", baseURL+action);
    Http.send();
}

const logSiteVisit = function () {
    doCurl('logVisit');
}

const logSystemGeneration = function (coordinates) {
    doCurl(`systemGenerated/${coordinates}`);
}

const logResumeDownload = function () {
    doCurl(`resumeDownloaded`);
}