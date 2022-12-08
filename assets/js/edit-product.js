
submitEditPrdData = (rowId) => {
    let prdName = $('#edit-form').find('#editPrdName').val();
    let prevPrdName = $('#edit-form').find('#prevPrdName').val();
    let prdBarcode = $('#edit-form').find('#editPrdBarcode').val();
    let prevPrdBarcode = $('#edit-form').find('#prevPrdBarcode').val();
    let prdPrice = $('#edit-form').find('#editPrdPrice').val();


    if (prdName == '' || prdPrice == '') {
        dialog.showMessageBoxSync({
            type: 'info',
            title: 'Alert',
            message: 'Product Name and Price are required',
        });
    } else {
        if (prdName === prevPrdName) {
            if (prdBarcode === '' || prdBarcode === prevPrdBarcode) {
                executeEditPrdData(rowId);
            } else {
                let sql = 'SELECT COUNT(*) AS count FROM products WHERE barcode = $1';
                db.query(sql, [prdBarcode], (err, data) => {
                    if (err) throw err
                    let rowNumber = data.rows[0].count;
                    if (rowNumber < 1) {
                        executeEditPrdData(rowId);
                    } else {
                        dialog.showMessageBoxSync({
                            type: 'info',
                            title: 'Alert',
                            message: 'Barcode \'' + prdBarcode + '\' already exists',
                        });
                    }
                });
            }
            
            // editDataModal.close();
        } else {
            let sql = 'SELECT COUNT(*) AS count FROM products WHERE product_name = $1';
            db.query(sql, [prdName], (err, data) => {
                if (err) throw err
                let rowNumber = data.rows[0].count;
                if (rowNumber < 1) {
                    if (prdBarcode === '' || prdBarcode === prevPrdBarcode) {
                        executeEditPrdData(rowId);
                    } else {
                        let sql = 'SELECT COUNT(*) AS count FROM products WHERE barcode = $1';
                        db.query(sql, [prdBarcode], (err, data) => {
                            if (err) throw err
                            let rowNumber = data.rows[0].count;
                            if (rowNumber < 1) {
                                executeEditPrdData(rowId);
                            } else {
                                dialog.showMessageBoxSync({
                                    type: 'info',
                                    title: 'Alert',
                                    message: 'Barcode \'' + prdBarcode + '\' already exists',
                                });
                            }
                        });
                    }
                } else {
                    dialog.showMessageBoxSync({
                        type: 'info',
                        title: 'Alert',
                        message: 'Product Name \'' + prdName + '\' already exists',
                    });
                }
            })
        }
    }
}

executeEditPrdData = (rowId) => {
    let prdName = $('#edit-form').find('#editPrdName').val();
    let prdBarcode = $('#edit-form').find('#editPrdBarcode').val();
    let prdCategory = $('#edit-form').find('#editPrdCategory').val();
    let prdPrice = $('#edit-form').find('#editPrdPrice').val();
    let prdCost = $('#edit-form').find('#editPrdCost').val();
    let prdInitQty = $('#edit-form').find('#editPrdInitQty').val();
    let prdUnit = $('#edit-form').find('#editPrdUnit').val();

    if(prdPrice === ''){
        dialog.showMessageBoxSync({
            type: 'info',
            title: 'Alert',
            message: 'Product Price is required',
        });
    } else if(prdCost === ''){
        dialog.showMessageBoxSync({
            type: 'info',
            title: 'Alert',
            message: 'Product Cost is required',
        });
    } else if(prdPrice < prdCost){
        dialog.showMessageBoxSync({
            type: 'info',
            title: 'Alert',
            message: 'Product Price must be greater than Cost',
        });
    } else {
        let sql = 'UPDATE products SET product_name = $1, barcode = $2, category = $3, selling_price = $4, cost_of_product = $5, product_intial_qty = $6, unit = $7 WHERE id = $8';
        db.query(sql, [prdName, prdBarcode, prdCategory, prdPrice, prdCost, prdInitQty, prdUnit, rowId], (err, data) => {
            if (err) throw err
            // dialog.showMessageBoxSync({
            //     type: 'info',
            //     title: 'Alert',
            //     message: 'Product Data Updated',
            // });
            ipcRenderer.send('update:success',doc_id);
        })
    }
}

cancelEditPrdData = () => {
    ipcRenderer.send('close:edit')
}