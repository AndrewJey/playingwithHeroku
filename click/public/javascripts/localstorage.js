$(document).ready(function () {
    $('#btnlocalStorage').click(function () {
        clickCounter();
    });

    $('#btnResetLocalStorage').click(function () {
        clickReset();
    });
    refresh();
});

function refresh() {
   $("#btnlocalStorage").text(localStorage.clickcount || 0);
}

function clickCounter() {
    var cont = localStorage.clickcount || 0;
    localStorage.clickcount = Number(cont) + 1;
    refresh();
}

function clickReset(){
    localStorage.clickcount = 0;
    refresh();
}