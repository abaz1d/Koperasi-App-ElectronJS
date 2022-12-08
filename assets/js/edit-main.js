let doc_id
let id
ipcRenderer.on('res:form', (e, editDocId, editForm, rowId) => {
    $('#edit-form').html(editForm);
    doc_id = editDocId;
    id = rowId;
});

submitEditData = () => {
    switch (doc_id) {
        case 'product-data':
            submitEditPrdData();
            break;
    }
}

$('body').keydown(function (e) {
    if (e.which == 13) {
        submitEditData();
    }
})