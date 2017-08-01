var Sessions = {
    getData: function () {
        return $.getJSON('/sessions');
    },
    insert: function (data) {
        return $.post('/sessions', data);
    }
};
$(document).ready(function () {
    $('#click').on("click", function () {
        var btn_value = $(this).val();
        btn_value++;
        $(this).val(btn_value);
        $(this).text(btn_value);

        var data = { value: btn_value };
        Sessions.insert(data)
            .done(function (json) {
                session();
             });
    });

    $('#reset').on("click", function () {
        $('#click').val(0);
        $('#click').text(0);

        var data = { value: 0 };
        Sessions.insert(data)
            .done(function (json) {
                session();
             });
    });
    session();
});

function session() {
    Sessions.getData().done(function (json) {
        console.log(json);
        $('#click').val(json);
        $('#click').text(json);
    });
}
