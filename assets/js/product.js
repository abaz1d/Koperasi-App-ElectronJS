
let inputPrdPrice = IMask(
    document.getElementById('product_price'), {
    mask: 'num',
    blocks: {
        num: {
            mask: Number,
            thousandsSeparator: '.',
            scale: 3,
            radix: ',',
            mapIoRadix: ['.'],
            padFractionalZeros: false,
            signed: false,
        }
    }
}
);

let inputPrdCost = IMask(
    document.getElementById('product_cost'), {
    mask: 'num',
    blocks: {
        num: {
            mask: Number,
            thousandsSeparator: '.',
            scale: 3,
            radix: ',',
            mapIoRadix: ['.'],
            padFractionalZeros: false,
            signed: false,
        }
    }
}
);

let inputPrdQty = IMask(
    document.getElementById('product_intial_qty'), {
    mask: 'num',
    blocks: {
        num: {
            mask: Number,
            thousandsSeparator: '.',
            padFractionalZeros: false,
            signed: false,
        }
    }
}
);

totalPrdPage = (total_row_displayed, searchVal) => {
    let sql;
    if(searchVal != ''){
        sql = `SELECT COUNT(*) AS total FROM products WHERE product_name ILIKE '%${searchVal}%' ESCAPE '!' OR product_code ILIKE '%${searchVal}%' ESCAPE '!' OR barcode ILIKE '%${searchVal}%' ESCAPE '!' OR category ILIKE '%${searchVal}%' ESCAPE '!' OR CAST(selling_price AS TEXT) ILIKE '%${searchVal}%' ESCAPE '!' OR CAST(cost_of_product AS TEXT) ILIKE '%${searchVal}%' ESCAPE '!' OR CAST(product_intial_qty AS TEXT) ILIKE '%${searchVal}%' ESCAPE '!' OR unit ILIKE '%${searchVal}%' ESCAPE '!'`;
    } else {
        sql = `SELECT COUNT(*) AS total FROM products`;
    }
    db.query(sql, (err, result) => {
        if (err) throw err
        let total_page
        if(result.rows[0].total % total_row_displayed == 0) {
            total_page = parseInt(result.rows[0].total / total_row_displayed);
        }else{
            total_page = parseInt(result.rows[0].total / total_row_displayed) + 1;
        }
        $('#total_pages').val(total_page);
    });
}

loadProduct = (page_number, total_row_displayed, searchVal) => {
    let row_number;
    if(page_number < 2){
        row_number = 0;
    }else{
        row_number = (page_number - 1) * total_row_displayed;
    }
    total_page(total_row_displayed, searchVal);

    let sql;
    if(searchVal != ''){
        sql = `SELECT * FROM products WHERE product_name ILIKE '%${searchVal}%' ESCAPE '!' OR product_code ILIKE '%${searchVal}%' ESCAPE '!' OR barcode ILIKE '%${searchVal}%' ESCAPE '!' OR category ILIKE '%${searchVal}%' ESCAPE '!' OR CAST(selling_price AS TEXT) ILIKE '%${searchVal}%' ESCAPE '!' OR CAST(cost_of_product AS TEXT) ILIKE '%${searchVal}%' ESCAPE '!' OR CAST(product_intial_qty AS TEXT) ILIKE '%${searchVal}%' ESCAPE '!' OR unit ILIKE '%${searchVal}%' ESCAPE '!' ORDER BY product_name ASC LIMIT ${total_row_displayed} OFFSET ${row_number}`;
    } else {
        sql = `SELECT * FROM products ORDER BY id DESC LIMIT ${total_row_displayed} OFFSET ${row_number}`;
    }
    db.query(sql, (err, data) => {
        if (err) throw err;
        let tr = '';
        if (data.length < 1) {
            tr += ''
        } else {
            data.rows.forEach((row) => {
                tr += `<tr data-id=${row.id}>
                    <td data-colname="ID class="d-flex justify-content-center">
                        <input class="data-checkbox" id='${row.id}' type="checkbox">
                    </td>
                    <td>${row.id}</td>
                    <td>${row.product_name}</td>
                    <td>${row.product_code}</td>
                    <td>${row.barcode}</td>
                    <td>${row.category}</td>
                    <td>${row.unit}</td>
                    <td>${currencyFormatter.format(row.selling_price)}</td>
                    <td>${currencyFormatter.format(row.cost_of_product)}</td>
                    <td>${row.product_intial_qty}</td>
                    <td>${currencyFormatter.format(row.cost_of_product)}</td>
                    <td>${currencyFormatter.format(row.cost_of_product)}</td>
                    <td>${currencyFormatter.format(row.cost_of_product)}</td>
                    <td class="d-flex justify-content-center">
                        <button class="btn btn-sm btn-success action-btn" onclick="editRecord(${row.id})" id="edit-data"><i class="fa-solid fa-pencil"></i></button>
                        <button class="btn btn-danger btn-sm action-btn" onclick="deleteAction(${row.id}, '${row.product_name}')" id="delete-data"><i class="fa-solid fa-trash"></i></button>
                    </td>
                </tr>`;
            });
        }
        $('tbody#data').html(tr);
    });
}

resetForm = () => {
    $('#product_name').val('');
    $('#product_code').val('');
    $('#product_barcode').val('');
    $('#product_category').val('');
    $('#product_unit').val('');
    $('#product_price').val('');
    $('#product_cost').val('');
    $('#product_intial_qty').val('');
}

insertProduct = () => {
    let product_name = $('#product_name').val();
    let product_code = $('#product_code').val();
    let barcode = $('#product_barcode').val();
    let category = $('#product_category').val();
    let unit = $('#product_unit').val();
    let selling_price = inputPrdPrice.unmaskedValue;
    let cost_of_product = inputPrdCost.unmaskedValue;
    let product_intial_qty = inputPrdQty.unmaskedValue;

    let required = $('[required]');
    let required_array = [];
    required.each(function () {
        if ($(this).val() != '') {
            required_array.push($(this));
        }
    });

    if (required_array.length < 4) {
        dialog.showMessageBoxSync({
            title: 'Alert',
            type: 'info',
            message: 'Nama Produk, Harga Jual, Harga Pokok, dan Satuan harus diisi ⚠️',
        });
    } else if (parseInt(selling_price) < parseInt(cost_of_product)) {
        dialog.showMessageBoxSync({
            title: 'Alert',
            type: 'info',
            message: 'Harga Jual tidak boleh lebih kecil dari Harga Pokok ⚠️',
        });
    } else {
        db.query("SELECT COUNT(*) AS row_number FROM products WHERE product_name = $1", [product_name], (err, res) => {
            if (err) throw err;
            if (res.rows[0].row_number < 1) {
                db.query(`INSERT INTO products (product_name, product_code, barcode, category, unit, selling_price, cost_of_product, product_intial_qty) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                    [product_name, product_code, barcode, category, unit, selling_price, cost_of_product, product_intial_qty], (err, data) => {
                        if (err) throw err;
                        //generate code product
                        db.query("SELECT id FROM products WHERE product_name = $1", [product_name], (err, row) => {
                            if (err) throw err
                            db.query(`UPDATE products SET product_code = concat('PR-','000000',${row.rows[0].id}) WHERE product_name = $1`, [product_name], err => {
                                if (err) throw err
                                resetForm();
                                $('#product_name').focus();
                                loadProduct();
                            })
                        })
                    });
            } else {
                dialog.showMessageBoxSync({
                    title: 'Alert',
                    type: 'info',
                    message: 'Nama Produk sudah ada ⚠️',
                });
            }
        });
    }
}

loadCategoryOptions = () => {
    db.query("SELECT * FROM categories ORDER BY category_name ASC", (err, data) => {
        if (err) throw err;
        let option = '<option value="">Kategori</option>';
        data.rows.forEach((row) => {
            option += `<option value="${row.category_name}">${row.category_name}</option>`;
        });
        $('#product_category').html(option);
    });
}

loadUnitOptions = () => {
    db.query("SELECT * FROM unit ORDER BY unit_name ASC", (err, data) => {
        if (err) throw err;
        let option = '<option value="">Satuan</option>';
        data.rows.forEach((row) => {
            option += `<option value="${row.unit_name}">${row.unit_name}</option>`;
        });
        $('#product_unit').html(option)
    });
}

function selectUnitOption(unitOpt, unit) {
    let options = unitOpt.replace(`value="${unit}"`, `value="${unit}" selected`);
    return options;
}

function selectCategoryOption(categoryOpt, category) {
    let options = categoryOpt.replace(`value="${category}"`, `value="${category}" selected`);
    return options;
}

editPrdData = (id) => {
    let sqlUnit = "SELECT * FROM unit ORDER BY unit_name ASC";
    let sqlCategory = "SELECT * FROM categories ORDER BY category_name ASC";
    let sql = "SELECT * FROM products WHERE id = $1";

    db.query(sqlUnit, (err, result) => {
        if (err) {
            throw err;
        } else {
            let unitOption
            let unitOpts = '<option></option>';
            result.rows.forEach((row) => {
                unitOpts = `<option value="${row.unit_name}">${row.unit_name}</option>`;
            });
            unitOption = unitOpts;
            db.query(sqlCategory, (err, result) => {
                if (err) {
                    throw err;
                } else {
                    let categoryOption
                    let categoryOpts = '<option></option>';
                    result.rows.forEach((row) => {
                        categoryOpts = `<option value="${row.category_name}">${row.category_name}</option>`;
                    });
                    categoryOption = categoryOpts;
                    db.query(sql, [id], (err, result) => {
                        if (err) {
                            throw err;
                        } else {
                            let row = result.rows[0];
                            let editForm
                            editForm = `<nav class="navbar navbar-light bg-light fixed-top">
                                            <div class="container-fluid">
                                                <div style="display: inline-block;">
                                                    <span id="store-name" class="ms-2" style="font-size: 16.5px; font-weight: 500; bold;">
                                                        ${row.id} - ${row.product_name}
                                                    </span>
                                                </div>
                                                <div style="display: inline-block;">
                                                    <div class="dropdown" style="display: inline;">
                                                        <button class="btn btn-sm btn-danger btn-block" onclick="cancelEditPrdData()"><i class="fa-solid fa-times"></i></button>
                                                    </div>
                                                </div>
                                            </div>
                                        </nav>
                                        <div class="row g-3 mt-4">
                                            <div class="col-12">
                                                <label for="editPrdName" class="form-label">Nama Produk</label>
                                                <input type="text" class="form-control" placeholder="Nama Produk" id="editPrdName" value="${row.product_name}" required>
                                                <input type="hidden" id="prevPrdName" value="${row.product_name}">
                                                <input type="hidden" id="rowId" value="${row.id}">
                                            </div>
                                            <div class="col-12">
                                                <label for="editPrdBarcode" class="form-label">Barcode</label>
                                                <input type="text" class="form-control" placeholder="Barcode" id="editPrdBarcode" value="${row.barcode}" required>
                                                <input type="hidden" id="prevPrdBarcode" value="${row.barcode}">
                                            </div>
                                            <div class="col-12">
                                                <label for="editPrdCategory" class="form-label">Category</label>
                                                <select class="form-select" id="editPrdCategory">
                                                    ${selectCategoryOption(categoryOption, row.category)}
                                                </select>
                                            </div>
                                            <div class="col-12">
                                                <label for="editPrdUnit" class="form-label">Unit</label>
                                                <select class="form-select" id="editPrdUnit">
                                                    ${selectUnitOption(unitOption, row.unit)}
                                                </select>
                                            </div>
                                            <div class="col-12">
                                                <label for="editPrdPrice" class="form-label">Harga Jual</label>
                                                <input type="text" class="form-control" placeholder="Harga Jual" id="editPrdPrice" value="${row.selling_price}" required>
                                            </div>
                                            <div class="col-12">
                                                <label for="editPrdCost" class="form-label">Harga Pokok</label>
                                                <input type="text" class="form-control" placeholder="Harga Pokok" id="editPrdCost" value="${row.product_intial_qty}" required>
                                            </div>
                                            <div class="col-12">
                                                <label for="editPrdInitQty" class="form-label">Stok Awal</label>
                                                <input type="text" class="form-control" placeholder="Stok Awal" id="editPrdInitQty" value="${row.product_intial_qty}" required>
                                            </div>
                                            <div class="col-12">
                                                <button class="btn btn-primary" onclick="submitEditPrdData(${id})" id="btn-submit-edit"><i class="fa-solid fa-paper-plane"></i> Simpan</button>
                                            </div>
                                        </div>`;

                            ipcRenderer.send('load:edit', 'product-data', editForm, 600, 900, id)
                        }
                    });
                }
            });
        }
    });
}

ipcRenderer.on('update:success', (e, msg) => {
    alertSuccess(msg)
    load_data();
})

exportCsvPrdData = (filePath, ext, joinIds = false) => {
    let sql
    let file_path = filePath.replace(/\\/g, "/")
    if (joinIds) {
        sql = `SELECT * FROM products WHERE id IN (${joinIds}) order by id asc`;
    } else {
        sql = `SELECT * FROM products order by id asc`;
    }

    db.query(sql, (err, result) => {
        if(err) throw err;
        convertToCSV = (arr) => {
            let array = [Object.keys(arr[0])].concat(arr);
            return array.map( (item) => {
                return Object.values(item).toString();
            }).join('\r\n');
        }
        let content = convertToCSV(result.rows);
        ipcRenderer.send('write:csv', file_path, content)
    })
}

exportPdfPrdData = (filePath, ext, joinIds = false) => {
    let sql
    let file_path = filePath.replace(/\\/g, "/")
    if (joinIds) {
        sql = `SELECT * FROM products WHERE id IN (${joinIds}) order by id asc`;
        db.query(sql, (err, result) => {
            if(err) throw err;
            let tbody = '';
            let thead = `<tr>
                            <th>Id</th>
                            <th>Nama Produk</th>
                            <th>Kode Produk</th>
                            <th>Barcode</th>
                            <th>Category</th>
                            <th>Harga Jual</th>
                            <th>Harga Pokok</th>
                            <th>Unit</th>
                            <th>Stok Awal</th>
                        </tr>`;
            result.rows.forEach((row, index) => {
                tbody += `<tr>
                            <td>${row.id}</td>
                            <td>${row.product_name}</td>
                            <td>${row.product_code}</td>
                            <td>${row.barcode}</td>
                            <td>${row.category}</td>
                            <td>${row.selling_price}</td>
                            <td>${row.cost_of_product}</td>
                            <td>${row.unit}</td>
                            <td>${row.product_intial_qty}</td>
                        </tr>`;
            });
            ipcRenderer.send('load:to-pdf', thead, tbody, file_path, 'product-data', 'Data Produk')
        });
    } else {
        sql = `SELECT * FROM products order by id asc`;
        db.query(sql, (err, result) => {
            if(err) throw err;
            let tbody = '';
            let thead = `<tr>
                            <th>Id</th>
                            <th>Nama Produk</th>
                            <th>Kode Produk</th>
                            <th>Barcode</th>
                            <th>Category</th>
                            <th>Harga Jual</th>
                            <th>Harga Pokok</th>
                            <th>Unit</th>
                            <th>Stok Awal</th>
                        </tr>`;
            result.rows.forEach((row, index) => {
                tbody += `<tr>
                            <td>${row.id}</td>
                            <td>${row.product_name}</td>
                            <td>${row.product_code}</td>
                            <td>${row.barcode}</td>
                            <td>${row.category}</td>
                            <td>${row.selling_price}</td>
                            <td>${row.cost_of_product}</td>
                            <td>${row.unit}</td>
                            <td>${row.product_intial_qty}</td>
                        </tr>`;
            });
            ipcRenderer.send('load:to-pdf', thead, tbody, file_path, 'product-data', 'Data Produk')
        });
    }
}

printPrdData = (joinIds = false) => {
    let sql
    if (joinIds) {
        sql = `SELECT * FROM products WHERE id IN (${joinIds}) order by id asc`;
        db.query(sql, (err, result) => {
            if(err) throw err;
            let tbody = '';
            let thead = `<tr>
                            <th>Id</th>
                            <th>Nama Produk</th>
                            <th>Kode Produk</th>
                            <th>Barcode</th>
                            <th>Category</th>
                            <th>Harga Jual</th>
                            <th>Harga Pokok</th>
                            <th>Unit</th>
                            <th>Stok Awal</th>
                        </tr>`;
            result.rows.forEach((row, index) => {
                tbody += `<tr>
                            <td>${row.id}</td>
                            <td>${row.product_name}</td>
                            <td>${row.product_code}</td>
                            <td>${row.barcode}</td>
                            <td>${row.category}</td>
                            <td>${row.selling_price}</td>
                            <td>${row.cost_of_product}</td>
                            <td>${row.unit}</td>
                            <td>${row.product_intial_qty}</td>
                        </tr>`;
            });
            ipcRenderer.send('load:print-page', thead, tbody, 'product-data', 'Data Produk')
        });
    } else {
        sql = `SELECT * FROM products order by id asc`;
        db.query(sql, (err, result) => {
            if(err) throw err;
            let tbody = '';
            let thead = `<tr>
                            <th>Id</th>
                            <th>Nama Produk</th>
                            <th>Kode Produk</th>
                            <th>Barcode</th>
                            <th>Category</th>
                            <th>Harga Jual</th>
                            <th>Harga Pokok</th>
                            <th>Unit</th>
                            <th>Stok Awal</th>
                        </tr>`;
            result.rows.forEach((row, index) => {
                tbody += `<tr>
                            <td>${row.id}</td>
                            <td>${row.product_name}</td>
                            <td>${row.product_code}</td>
                            <td>${row.barcode}</td>
                            <td>${row.category}</td>
                            <td>${row.selling_price}</td>
                            <td>${row.cost_of_product}</td>
                            <td>${row.unit}</td>
                            <td>${row.product_intial_qty}</td>
                        </tr>`;
            });
            ipcRenderer.send('load:print-page', thead, tbody, 'product-data', 'Data Produk')
        });
    }
}