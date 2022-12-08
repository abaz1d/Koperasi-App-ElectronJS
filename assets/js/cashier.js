
closeCashier = () => {
    ipcRenderer.send('close:cashier-window');
}

getProductName = () => {
    let sql = 'SELECT * FROM products ORDER BY id DESC';
    db.query(sql, (err, result) => {
        if (err) throw err;
        let output = '<option value="">Nama Produk</option>';
        result.rows.forEach(row => {
            output += `
                <option value="${row.product_name}">${row.product_name}</option>
            `;
        });
        $('#product_name').html(output);
    });
}
getProductName();

today = () => {
    let d = new Date();
    let day = d.getDate().toString().padStart(2, 0);
    let month = (d.getMonth() + 1).toString().padStart(2, 0);
    let year = d.getFullYear();
    $('#info-sales-date').html(`${day} / ${month} / ${year}`);
}
today();

openSales = () => {
    let sales_number = $('#sales-number').val();
    let buyer = $('#buyer-select').val();
    let buyer_id = $('#buyer_id').val();
    let buyer_address = $('#buyer-address').val();
    let po_number = $('#po-number').val();
    let payment = $('#cash-credit').val();
    let due_date = $('#due-date').val();
    let term = $('#term').val();
    let description = $('#description').val();

    today();
    $('#info-sales-number').html(sales_number);
    $('#info-buyer').html(buyer);
    let tax_rate
    let tax_checked = [];
    $('.sales-tax:checked').each(function () {
        tax_checked.push('checked');
    });
    if (tax_checked.length < 1) {
        tax_rate = 0;
        $('#input-tax').val(tax_rate);
    } else {
        tax_rate = 0.1;
        $('#input-tax').val(tax_rate);
    }
    $('#modal-new-sales').modal('hide');
    $('.sales-input').removeAttr('disabled');
    $('#btn-new-sales').prop('disabled', true);
}

let prdCodeArray = [];

db.query('SELECT * FROM products', (err, result) => {
    if (err) throw err;
    result.rows.map(row => {
        prdCodeArray.push(row.product_code);
    });
});

$('#product_code').autocomplete({
    source: prdCodeArray,
});

getCodeByName = () => {
    let product_name = $('#product_name').val();
    if (product_name == '') {
        $('#product_code').val('');
    } else {
        let sql = `SELECT * FROM products WHERE product_name = '${product_name}'`;
        db.query(sql, (err, result) => {
            if (err) throw err;
            if (result.rows.length < 1) {
                $('#product_code').val('');
            } else {
                $('#product_code').val(result.rows[0].product_code);
            }
        });
    }
}

startNewSales = () => {
    db.query(`INSERT INTO sales (buyer, cost_of_product, price, discount_percent, discount_money, total) VALUES ('generate_invoice', 0, 0, 0, 0, 0) RETURNING *`, (err, result) => {
        if (err) throw err;
        $('#sales-number').val(result.rows[0].invoice_number);
    });
}

insertSales = () => {
    let sales_number = $('#sales-number').val();
    let buyer = $('#buyer-select').val() == '' ? 'kosong' : $('#buyer-select').val();
    let buyer_id = $('#buyer-id').val() == '' ? 0 : $('#buyer-id').val();
    let po_number = $('#po-number').val();
    let payment = $('#cash-credit').val();
    let due_date = $('#due-date').val();
    let term = $('#term').val();
    let description = $('#description').val();
    let product_code = $('#product_code').val().toUpperCase();
    let tax_rate = $('#input-tax').val();

    if (product_code != '' && product_code != null) {
        db.query(`SELECT * FROM products WHERE product_code = '${product_code}' OR barcode = '${product_code}'`, (err, result) => {
            if (err) throw err;
            if (result.rows.length < 1) {
                let alert = dialog.showMessageBoxSync({
                    type: 'info',
                    title: 'Alert',
                    message: 'No Product with code ' + product_code + ' found',
                });
                if (alert == 0) {
                    $('#product_code').val('');
                    $('#product_code').focus();
                }
            } else {
                let product_name = result.rows[0].product_name;
                let product_code = result.rows[0].product_code;
                let product_price = result.rows[0].selling_price;
                let product_cost = result.rows[0].cost_of_product;
                let unit = result.rows[0].unit;
                let discount_percent = 0;
                let discount_money = 0;

                //insert
                db.query(`SELECT * FROM sales WHERE product_code = '${product_code}' AND invoice_number = '${sales_number}'`, (err, result) => {
                    if (err) throw err;
                    if (result.rows.length < 1) {
                        let qty = 1;
                        let total = qty * parseFloat(product_price);
                        db.query(`INSERT INTO sales (invoice_number, buyer, buyer_id, payment, description, po_number, due_date, term, sales_admin, product_name, product_code, cost_of_product, price, qty, unit, discount_percent, discount_money, total) VALUES ('${sales_number}', '${buyer}', '${buyer_id}', '${payment}', '${description}', '${po_number}', '${due_date}', '${term}', '', '${product_name}', '${product_code}', '${product_cost}', '${product_price}', '${qty}', '${unit}', '${discount_percent}', '${discount_money}', '${total}') RETURNING *`, (err, result) => {
                            if (err) throw err;
                            loadSales(sales_number);
                            $('#product_code').val('');
                            if (tax_rate != '') {
                                salesTax(sales_number, tax_rate);
                            } else {
                                salesTax(sales_number);
                            }
                        });
                    } else {
                        let disc_percent
                        let disc_money
                        if (result.rows[0].disc_percent != 0) {
                            disc_percent = result.rows[0].discount_percent;
                        } else {
                            discount_percent = 0;
                        }
                        if (result.rows[0].disc_money != 0) {
                            disc_money = result.rows[0].discount_money;
                        } else {
                            disc_money = 0;
                        }
                        let qty = parseInt(result.rows[0].qty);
                        let new_qty = qty + 1;
                        let new_total = parseInt(new_qty) * parseFloat(product_price);
                        let discount_percent = parseFloat(disc_percent) * new_total
                        let discount_money = parseFloat(disc_money)
                        let net_new_total = new_total - discount_percent - discount_money
                        db.query(`UPDATE sales SET qty = '${new_qty}', total = '${net_new_total}' WHERE product_code = '${product_code}' AND invoice_number = '${sales_number}'`, (err, result) => {
                            if (err) throw err;
                            loadSales(sales_number);
                            $('#product_code').val('');
                            if (tax_rate != '') {
                                salesTax(sales_number, tax_rate);
                            } else {
                                salesTax(sales_number);
                            }
                        });
                    }
                });
            }
        });
    } else {
        dialog.showMessageBoxSync({
            type: 'info',
            title: 'Alert',
            message: 'Please insert product code first!'
        });
    }

}

loadSales = (sales_number) => {
    db.query(`DELETE FROM sales WHERE invoice_number = '${sales_number}' AND cost_of_product = 0 AND price = 0 AND discount_percent = 0 AND discount_money = 0 AND total = 0`, (err, result) => {
        if (err) throw err;
        let sql = `SELECT * FROM sales WHERE invoice_number = '${sales_number}'`;
        db.query(sql, (err, result) => {
            if (err) throw err;
            let tr = '';
            if (result.rows.length < 1) {
                tr = `<tr><td colspan="8" class="text-center">No data found</td></tr>`;
            } else {
                result.rows.map(row => {
                    let discount_percent = row.discount_percent;
                    let discount_money = row.discount_money;
                    let discount_info
                    if (discount_percent == 0 && discount_money == 0) {
                        discount_info = 0
                    } else if (discount_percent != 0 && discount_money == 0) {
                        discount_info = `${discount_percent}%`
                    } else if (discount_percent != 0 && discount_money != 0) {
                        discount_info = `${discount_percent}% + ${currencyFormatter.format(discount_money)}`
                    } else if (discount_percent == 0 && discount_money != 0) {
                        discount_info = `${currencyFormatter.format(discount_money)}`
                    }
                    tr += `<tr>
                            <td>${row.product_name}</td>
                            <td>${row.product_code}</td>
                            <td><span class="float-end">${currencyFormatter.format(row.price)}</span></td>
                            <td style="text-align: center">${row.qty}</td>
                            <td>${row.unit}</td>
                            <td>${discount_info}</td>
                            <td><span class="float-end">${currencyFormatter.format(row.total)}</span></td>
                        </tr>`;
                });
            }
            $('tbody#sales-data').html(tr);
        });
    });
};

$('#product_code, #product_name').keydown(function (e) {
    if (e.which == 13) {
        insertSales();
        getCodeByName();
    }
});

totalSales = (sales_number) => {
    let sql = `SELECT SUM(total) AS total_sales FROM sales WHERE invoice_number = '${sales_number}'`;
    db.query(sql, (err, result) => {
        if (err) throw err;
        let total_sales = result.rows[0].total_sales;
        db.query(`SELECT * FROM discount_final WHERE invoice_number = '${sales_number}'`, (err, result) => {
            if (err) throw err;
            if (result.rows.length < 1) {
                db.query(`SELECT total_tax FROM sales_tax WHERE invoice_number = '${sales_number}'`, (err, result) => {
                    if (err) throw err;
                    if (result.rows.length < 1) {
                        $('#total-and-tax').html(currencyFormatter.format(total_sales));
                    } else {
                        let total_tax = result.rows[0].total_tax;
                        let net_total_sales = parseFloat(total_sales) + parseFloat(total_tax);
                        $('#total-and-tax, #info-total-sales').html(currencyFormatter.format(net_total_sales));

                    }
                });
            } else {
                let discount_percent = result.rows[0].discount_percent;
                let discount_money = result.rows[0].discount_money;
                let discount_final_info
                if (discount_percent == 0 && discount_money == 0) {
                    discount_final_info = 0
                } else if (discount_percent != 0 && discount_money == 0) {
                    discount_final_info = `${discount_percent}%`
                } else if (discount_percent != 0 && discount_money != 0) {
                    discount_final_info = `${discount_percent}% + ${currencyFormatter.format(discount_money)}`
                } else if (discount_percent == 0 && discount_money != 0) {
                    discount_final_info = `${currencyFormatter.format(discount_money)}`
                }
                $('#discount-final').html(discount_final_info);
                let total_discount_final = result.rows[0].total_discount_final;
                db.query(`SELECT total_tax FROM sales_tax WHERE invoice_number = '${sales_number}'`, (err, result) => {
                    if (err) throw err;
                    if (result.rows.length < 1) {
                        let net_total_sales = parseFloat(total_sales) - parseFloat(total_discount_final);
                        $('#total-and-tax').html(currencyFormatter.format(net_total_sales));
                    } else {
                        let total_tax = result.rows[0].total_tax;
                        let net_total_sales = parseFloat(total_sales) + parseFloat(total_tax) - parseFloat(total_discount_final);
                        $('#total-and-tax, #info-total-sales').html(currencyFormatter.format(net_total_sales));
                    }
                });
            }
        });
    });
}

salesTax = (sales_number, tax_rate) => {
    queryTax = (sales_number, total_tax) => {
        let sql = `SELECT * FROM sales_tax WHERE invoice_number = '${sales_number}'`;
        db.query(sql, (err, result) => {
            if (err) throw err;
            if (result.rows.length < 1) {
                let sql = `INSERT INTO sales_tax (invoice_number, total_tax) VALUES ('${sales_number}', '${total_tax}')`;
                db.query(sql, (err, result) => {
                    if (err) throw err;
                    $('#tax').html(currencyFormatter.format(total_tax));
                    totalSales(sales_number);
                });
            } else {
                let sql = `UPDATE sales_tax SET total_tax = '${total_tax}' WHERE invoice_number = '${sales_number}'`;
                db.query(sql, (err, result) => {
                    if (err) throw err;
                    $('#tax').html(currencyFormatter.format(total_tax));
                    totalSales(sales_number);
                });
            }
        });
    }
    let sql = `SELECT SUM(total) AS total_sales FROM sales WHERE invoice_number = '${sales_number}'`;
    db.query(sql, (err, result) => {
        if (err) throw err;
        if (result.rows.length < 1) {
            dialog.showMessageBoxSync({
                type: 'info',
                title: 'Alert',
                message: 'No sales data found'
            });
        } else {
            let total_sales = result.rows[0].total_sales;
            let sql = `SELECT total_discount_final FROM discount_final WHERE invoice_number = '${sales_number}'`;
            db.query(sql, (err, result) => {
                if (err) throw err;
                if (result.rows.length < 1) {
                    let total_tax = parseFloat(total_sales) * parseFloat(tax_rate);
                    queryTax(sales_number, total_tax);
                } else {
                    let total_discount_final = result.rows[0].total_discount_final;
                    let total_sales_after_discount = parseFloat(total_sales) - parseFloat(total_discount_final);
                    let total_tax = parseFloat(total_sales_after_discount) * parseFloat(tax_rate);
                    queryTax(sales_number, total_tax);
                }
            });
        }
    });
}