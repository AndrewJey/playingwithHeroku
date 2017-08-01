var contador=0;

var Cookies ={
    getData: function() {
      return $.getJSON('/cookies');
  },
    insert: function (contador) {
      return $.get('/cookies/cookie/' + contador);
  },
  reset: function () {
    return $.get('/cookies/clearcookie');
  }
};

$(document).ready(function() {
  Cookies.getData().done(function(json) {
    if (json.cookies == "NaN" || "undefined" === typeof json.cookies)
    {
      $('#btncookies').text(contador);
    }else {
      $('#btncookies').text(json.cookies);
      contador = json.cookies;
    }
    });
});

$("#btncookies").click(function() {
  contador++;
  Cookies.insert(contador);
  $('#btncookies').text(contador);
});

$("#btnResetcookies").click(function() {
    Cookies.reset();
    contador = 0;
  $('#btncookies').text(contador);
});
