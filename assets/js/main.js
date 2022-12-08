let doc_id = $('body').attr('id');

//total page
total_page = (total_row_displayed, searchVal = '') => {
    switch (doc_id) {
        case 'product-data':
            totalPrdPage(total_row_displayed, searchVal);
            break;
    }
}

load_data = (page_number, total_row_displayed, searchVal = '') => {
    switch (doc_id) {
        case 'product-data':
            loadProduct(page_number, total_row_displayed, searchVal);
            break;
    }
}
let page_number = $('#page_number').val();
let total_row_displayed = $('#row_per_page').val();
let searchVal = $('#search-data').val();
load_data(page_number, total_row_displayed, searchVal);

deleteRecord = (id) => {
    let doc_id = $('body').attr('id');
    let table = '';
    switch (doc_id) {
        case 'product-data':
            table = 'products';
            break;
    }
    let sql = `DELETE FROM ${table} WHERE id = ${id}`;
    db.query(sql, (err, data) => {
        if (err) throw err && console.log('err',err);
        load_data();
    });
}

deleteAllRecords = () => {
    let doc_id = $('body').attr('id');
    let table = '';
    switch (doc_id) {
        case 'product-data':
            table = 'products';
            break;
    }
    let sql = `DELETE FROM ${table}`;
    db.query(sql, (err, data) => {
        if (err) throw err && console.log('err',err);
        load_data();
    });
}

deleteMultipleRecords = (ids) => {
    let doc_id = $('body').attr('id');
    let table = '';
    switch (doc_id) {
        case 'product-data':
            table = 'products';
            break;
    }
    let sql = `DELETE FROM ${table} WHERE id IN (${ids})`;
    db.query(sql, (err, data) => {
        if (err) throw err && console.log('err',err);
        load_data();
    });
}

// checkbox check
$('tbody#data').on('click', 'tr', function () {
    let data_id = $(this).attr('data-id');
    let checkBox = $('Input[type="checkbox"]#'+data_id);
    checkBox.prop('checked', !checkBox.prop('checked'));
    $(this).toggleClass('blocked');
});

editRecord = (id) => {
    let doc_id = $('body').attr('id');
    switch (doc_id) {
        case 'product-data':
            editPrdData(id);
            break;
    }
}

alertSuccess = (msg) => {
    let div = `<div class="alert alert-success">${msg}</div>`;
    $('#alert').html(div);
    clearAlert = () => {
        $('#alert').html('');
    }
    setTimeout(clearAlert, 4000);
}

numberFormatter = (num) => {
    let numFormat = new Intl.NumberFormat('de-DE').format(num);
    return numFormat;
}
